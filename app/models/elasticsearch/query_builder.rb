# frozen_string_literal: true

module Elasticsearch
  class QueryBuilder
    include Elasticsearch::DSL

    attr_accessor :from
    attr_accessor :size

    def initialize
      @term = nil
      @dataset_conditions = []
      @frequency_conditions = []
      @for_all_datasets = false
      @type_conditions = []
      @significance_conditions = []
      @consequence_conditions = []
      @sift_conditions = []
      @polyphen_conditions = []
      @from = 0
      @size = 100
      @sort = true
    end

    def term(term)
      if term.blank?
        @term = nil
        return self
      end

      @term = case term.delete(' ')
              when /^tgv\d+(,tgv\d+)*$/
                tgv_condition(term)
              when /^rs\d+(,rs\d+)*$/i
                rs_condition(term)
              when /^(\d+|[XY]|MT):\d+(,(\d+|[XY]|MT):\d+)*$/
                position_condition(term)
              when /^(\d+|[XY]|MT):\d+-\d+(,(\d+|[XY]|MT):\d+-\d+)*$/
                region_condition(term)
              else
                if (results = GeneSymbol.search(term).results).total.positive?
                  symbol_root = results.first.dig(:_source, :alias_of)
                  gene_condition(symbol_root || results.first.dig(:_source, :symbol))
                else
                  disease_condition(term)
                end
              end

      self
    end

    def dataset(key)
      query = Elasticsearch::DSL::Search.search do
        query do
          bool do
            must do
              if key.to_sym == :clinvar
                nested do
                  path :conditions
                  query { exists { field :conditions } }
                end
              else
                nested do
                  path :frequencies
                  query { match 'frequencies.source': key }
                end
              end
            end
          end
        end
      end

      @dataset_conditions.push query.to_hash[:query]

      self
    end

    def frequency(key, frequency_from, frequency_to, invert = false)
      return self if key.to_sym == :clinvar

      query = Elasticsearch::DSL::Search.search do
        query do
          bool do
            must do
              nested do
                path :frequencies
                query do
                  bool do
                    must { match 'frequencies.source': key }
                    if invert
                      must do
                        bool do
                          must_not do
                            range 'frequencies.frequency' do
                              gte frequency_from.to_f
                              lte frequency_to.to_f
                            end
                          end
                        end
                      end
                    else
                      must do
                        range 'frequencies.frequency' do
                          gte frequency_from.to_f
                          lte frequency_to.to_f
                        end
                      end
                    end
                  end
                end
              end
            end
          end
        end
      end

      @frequency_conditions.push query.to_hash[:query]

      self
    end

    def for_all_datasets(boolean)
      @for_all_datasets = !!boolean
      self
    end

    def type(*keys)
      query = Elasticsearch::DSL::Search.search do
        query do
          bool do
            keys.each do |x|
              should do
                match variant_type: x
              end
            end
          end
        end
      end

      @type_conditions.push query.to_hash[:query]

      self
    end

    def significance(*values)
      query = Elasticsearch::DSL::Search.search do
        query do
          bool do
            if values.include?('Not in ClinVar')
              should do
                bool do
                  must_not do
                    nested do
                      path :conditions
                      query { exists { field :conditions } }
                    end
                  end
                end
              end
            end
            values.each do |x|
              next if x == 'Not in ClinVar'
              next unless (p = Form::ClinicalSignificance.param_name(x))

              should do
                nested do
                  path :conditions
                  query { match 'conditions.interpretations': p.key }
                end
              end
            end
          end
        end
      end

      @significance_conditions.push query.to_hash[:query]

      self
    end

    def consequence(*values)
      query = Elasticsearch::DSL::Search.search do
        query do
          bool do
            values.each do |x|
              should do
                nested do
                  path :transcripts
                  query { match 'transcripts.consequences': x }
                end
              end
            end
          end
        end
      end

      @consequence_conditions.push query.to_hash[:query]

      self
    end

    def sift(*values)
      query = Elasticsearch::DSL::Search.search do
        query do
          bool do
            values.each do |x|
              should do
                nested do
                  path :transcripts
                  query do
                    bool do
                      should do
                        range 'transcripts.sift' do
                          if x == :D
                            lt 0.05
                          elsif x == :T
                            gte 0.05
                          end
                        end
                      end
                    end
                  end
                end
              end
            end
          end
        end
      end

      @sift_conditions.push query.to_hash[:query]

      self
    end

    def polyphen(*values)
      query = Elasticsearch::DSL::Search.search do
        query do
          bool do
            values.each do |x|
              next if x == :U

              should do
                nested do
                  path :transcripts
                  query do
                    bool do
                      should do
                        range 'transcripts.polyphen' do
                          if x == :PROBD
                            gt 0.908
                          elsif x == :POSSD
                            gt 0.446
                            lte 0.908
                          elsif x == :B
                            lte 0.446
                          end
                        end
                      end
                    end
                  end
                end
              end
            end
          end
        end
      end

      @polyphen_conditions.push query.to_hash[:query]

      self
    end

    def limit(size)
      @size = size
      self
    end

    def sort(bool)
      @sort = bool
      self
    end

    def stat_query
      query = build

      query[:size] = 0
      query.delete(:from)
      query.delete(:sort)

      query.merge(aggregations)
    end

    def build
      conditions = []

      conditions << @term[:query] if @term

      unless @dataset_conditions.empty?
        conditions << if @dataset_conditions.size == 1
                        @dataset_conditions.first
                      else
                        { bool: { should: @dataset_conditions } }
                      end
      end

      unless @frequency_conditions.empty?
        conditions << if @frequency_conditions.size == 1
                        @frequency_conditions.first
                      else
                        {
                          bool: if @for_all_datasets
                                  { must: @frequency_conditions }
                                else
                                  { should: @frequency_conditions }
                                end
                        }
                      end
      end

      unless @type_conditions.empty?
        merge = @type_conditions.inject([]) { |memo, obj| memo + obj.dig(:bool, :should) }
        conditions << { bool: { should: merge } }
      end

      unless @significance_conditions.empty?
        merge = @significance_conditions.inject([]) { |memo, obj| memo + obj.dig(:bool, :should) }
        conditions << { bool: { should: merge } }
      end

      unless @consequence_conditions.empty?
        merge = @consequence_conditions.inject([]) { |memo, obj| memo + obj.dig(:bool, :should) }
        conditions << { bool: { should: merge } }
      end

      unless @sift_conditions.empty?
        merge = @sift_conditions.inject([]) { |memo, obj| memo + obj.dig(:bool, :should) }
        conditions << { bool: { should: merge } }
      end

      unless @polyphen_conditions.empty?
        merge = @polyphen_conditions.inject([]) { |memo, obj| memo + obj.dig(:bool, :should) }
        conditions << { bool: { should: merge } }
      end

      query = if conditions.empty?
                default_scope
              else
                conditions << default_scope[:query] if @dataset_conditions.empty?
                {
                  query: if conditions.size == 1
                           conditions.first
                         else
                           {
                             bool: {
                               must: conditions
                             }
                           }
                         end
                }
              end

      query[:size] = @size
      query[:from] = @from unless @from.zero?
      query[:sort] = %i[chromosome_sort start stop] if @sort

      query
    end

    private

    def aggregations
      query = Elasticsearch::DSL::Search.search do
        aggregation :aggs_frequencies do
          nested do
            path :frequencies
            aggregation :group_by_source do
              terms field: 'frequencies.source',
                    size: 5
            end
          end
        end
        aggregation :aggs_conditions do
          nested do
            path :conditions
            aggregation :group_by_interpretations do
              terms field: 'conditions.interpretations',
                    size: 15
            end
          end
        end
        aggregation :group_by_type do
          terms field: :variant_type,
                size: 5
        end
        aggregation :aggs_consequences do
          nested do
            path :transcripts
            aggregation :group_by_consequences do
              terms field: 'transcripts.consequences',
                    size: 40
            end
          end
        end
      end

      # add manually because dsl does not support nested-exists query
      total_clinvar = {
        aggregations: {
          total_clinvar: {
            filter: {
              nested: {
                path: 'conditions',
                query: {
                  exists: {
                    field: 'conditions'
                  }
                }
              }
            }
          }
        }
      }

      query.to_hash.deep_merge(total_clinvar)
    end

    def default_scope
      query = Elasticsearch::DSL::Search.search do
        query do
          bool do
            should do
              nested do
                path :frequencies
                query { exists { field :frequencies } }
              end
            end
            should do
              nested do
                path :conditions
                query { exists { field :conditions } }
              end
            end
          end
        end
      end

      query.to_hash
    end

    def tgv_condition(term)
      id = term.split(/[\s,]/)

      query = Elasticsearch::DSL::Search.search do
        query do
          bool do
            id.each do |x|
              should do
                match tgv_id: x.sub(/^tgv/, '').to_i
              end
            end
          end
        end
      end

      query.to_hash
    end

    def rs_condition(term)
      id = term.split(/[\s,]/)

      query = Elasticsearch::DSL::Search.search do
        query do
          bool do
            id.each do |x|
              should do
                match existing_variations: x
              end
            end
          end
        end
      end

      query.to_hash
    end

    def position_condition(term)
      positions = term.split(/[\s,]/)

      query = Elasticsearch::DSL::Search.search do
        query do
          bool do
            positions.each do |x|
              chr, pos = x.split(':')
              should do
                bool do
                  must { match chromosome: chr }
                  must { range(:start) { lte pos.to_i } }
                  must { range(:stop) { gte pos.to_i } }
                end
              end
            end
          end
        end
      end

      query.to_hash
    end

    def region_condition(term)
      positions = term.split(/[\s,]/)

      query = Elasticsearch::DSL::Search.search do
        query do
          bool do
            positions.each do |x|
              chr, pos = x.split(':')
              start, stop = pos.split('-')
              should do
                bool do
                  must { match chromosome: chr }
                  must do
                    bool do
                      should do
                        range :start do
                          gte start.to_i
                          lte stop.to_i
                        end
                      end
                      should do
                        range :stop do
                          gte start.to_i
                          lte stop.to_i
                        end
                      end
                      should do
                        bool do
                          must do
                            range :start do
                              lte start.to_i
                            end
                          end
                          must do
                            range :stop do
                              gte stop.to_i
                            end
                          end
                        end
                      end
                    end
                  end
                end
              end
            end
          end
        end
      end

      query.to_hash
    end

    def gene_condition(term)
      query = Elasticsearch::DSL::Search.search do
        query do
          nested do
            path :transcripts
            query do
              match 'transcripts.symbol': term
            end
          end
        end
      end

      query.to_hash
    end

    def disease_condition(term)
      query = Elasticsearch::DSL::Search.search do
        query do
          nested do
            path :conditions
            query do
              match 'conditions.condition': term
            end
          end
        end
      end

      query.to_hash
    end
  end
end
