Type = require "runtime-type"

class Endpoint
	constructor: (@version, @requiredAuth, params, @docs, @callback) ->
		@route = null
		@deprecated = no
		@requiredParams = []
		@params = []
		for param in params
			if typeof param is "string"
				@params.push
					name: param
					type: Type.any
					required: yes
					description: null
				continue
			@params.push param
		for param in @params
			@requiredParams.push param.name if param.required

	getEndpoint: ->
		return @route.route if @version is null
		"/#{@version}#{@route.route}"

	isDeprecated: ->
		return no unless @route
		@deprecated or @route.getMaxVersion() isnt @version

	deprecate: ->
		@deprecated = yes
		@

	auth: ->
		@requiredAuth = yes
		@

	addParams: (params) ->
		for param in params
			@addParam param

	addParam: (param) ->
		@params[param.key] =
			required: param.required
			type: param.type
			description: param.description
		@requiredParams.push param.key if param.required
		@

	setDocs: (docs) ->
		@docs = docs
		@

class Endpoint.Param
	constructor: (@key, @required = no, @type = null, @description = null) ->

module.exports = Endpoint