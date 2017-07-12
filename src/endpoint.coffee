class Endpoint
	constructor: (@version, @requiredAuth, @requiredParams, @docs, @callback) -> 
		@route = null
		@deprecated = no
		@params = {}

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