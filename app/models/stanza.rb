class Stanza
  include Configurable

  load_config(Rails.root.join('config', 'stanza.yml'), :stanza)

  class << self
    def method_missing(sym, *args)
      new(sym.to_s, args.shift, args.extract_options!)
    end

    def respond_to_missing?(_, _)
      true
    end
  end

  include ActionView::Helpers::TagHelper

  attr_reader :name
  attr_reader :label

  def initialize(name, label, **options)
    @name    = name
    @label   = label
    @options = options
  end

  def link
    "<link rel='import' href='#{Rails.application.config.stanza.uri}/stanza/#{@name}/' />".html_safe
  end

  def tag
    params = @options.map { |k, v| %(#{k}="#{v.to_s.gsub('"', '&quot;')}") }

    tag = "<togostanza-#{@name}"
    if params.present?
      tag << ' '
      tag << params.join(' ')
    end
    tag << ' />'

    tag.html_safe
  end
end
