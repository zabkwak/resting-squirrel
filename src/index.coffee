express = require "express"
compression = require "compression"
bodyParser = require "body-parser"
Err = require "smart-error"

Endpoint = require "./endpoint"

pkg = require "../package"

__options =
	port: 8080
	dataKey: "data"
	errorKey: "error"
	log: yes
	logStack: yes
	logger: ({ statusCode, method, path, spec, body, params, query, headers, took }) ->
		console.log new Date, "#{statusCode} #{method} #{path} BODY: #{JSON.stringify body} QUERY: #{JSON.stringify query} HEADERS: #{JSON.stringify headers} TOOK: #{took} ms"
		console.log ""
	meta:
		enabled: yes
		data: {}
	requestLimit: "1mb"
	docs:
		enabled: yes
		route: "/docs"
		auth: no
	auth: (req, res, next) ->
		return res.send401() unless req.headers["x-token"]
		next()
	before: (req, res, next) -> next()
	after: (err, data, req, res, next) -> next()

__methods = ["get", "post", "put", "delete", "head"]

class Route
	constructor: (@method, @route) ->
		@routes = {}

	addEndpoint: (endpoint) ->
		@routes[endpoint.version] = endpoint
		endpoint.route = @

	getMaxVersion: ->
		max = Math.max.apply null, Object.keys @routes
		return max unless isNaN max
		null

Route.routes = {}

Route.add = (method, name, endpoint) ->
	key = "#{method}#{name}"
	@routes[key] = new Route method, name unless @routes[key]
	route = @routes[key]
	route.addEndpoint endpoint
	endpoint

__hasObjectValue = (o, path) ->
	t = {}
	t[k] = v for k, v of o
	for p in path
		return no unless t[p]
		t = t[p]
	yes

__checkParams = (params, req, res, next) ->
	return next() if params.length is 0
	for p in params
		if req.method is "GET"
			unless req.query[p]
				return next new Err "Parameter '#{p}' is missing", "missing_parameter" if p.indexOf(".") < 0
				return next new Err "Parameter '#{p}' is missing", "missing_parameter" unless __hasObjectValue req.query, p.split "."
		else
			unless req.body[p]
				return next new Err "Parameter '#{p}' is missing", "missing_parameter" if p.indexOf(".") < 0
				return next new Err "Parameter '#{p}' is missing", "missing_parameter" unless __hasObjectValue req.body, p.split "."
	next()

__checkAuth = (req, res, requiredAuth, authMethod, cb) ->
	return cb() unless requiredAuth
	authMethod req, res, cb

__beforeCallback = (req, res, method, cb) ->
	method req, res, cb

__afterCallback = (err, data, req, res, method, cb) ->
	method err, data, req, res, cb

__handle = (app, options, method, version, route, requiredAuth, requiredParams, docs, callback) ->
	if typeof requiredAuth is "function"
		callback = requiredAuth
		requiredAuth = no
		requiredParams = []
		docs = null
	else if typeof requiredParams is "function"
		callback = requiredParams
		requiredParams = []
		docs = null
	else if typeof docs is "function"
		callback = docs
		docs = null

	Route.add method, route, new Endpoint version, requiredAuth, requiredParams, docs, callback

__mergeObjects = (o1, o2) ->
	o = {}
	for k, v of o2
		if o1[k] is undefined
			o[k] = v
			continue
		unless typeof v is "object"
			o[k] = o1[k]
			continue
		o[k] = __mergeObjects o1[k], v
	o
		
module.exports = (options = {}) ->
	o = __mergeObjects options, __options

	# Object merge cannot merge not existing keys, so this adds custom meta data to the options.
	if options.meta and options.meta.data
		o.meta.data[k] = v for k, v of options.meta.data
			
	app = express()
	app.use (req, res, next) ->
		d = new Date
		res.send204 = ->
			__afterCallback no, undefined, req, res, o.after, (err) ->
				return next err if err
				res.status 204
				res._end()
		res.send404 = (message = "Page not found", code = "page_not_found") ->
			res.sendError 404, message, code
		res.send401 = (message = "Unauthorized request", code = "unauthorized_request") ->
			res.sendError 401, message, code
		res.send501 = (message = "Not implemented", code = "not_implemented") ->
			res.sendError 501, message, code
		res.addMeta = (key, value) ->
			res.__meta ?= {}
			res.__meta[key] = value
		res.sendError = (code = 500, message = "Server error", errorCode = "unknown") ->
			res.status code
			next new Err message, errorCode
		res.sendData = (data, key = o.dataKey) ->
			console.warn "res.sendData is deprecated"
			res._sendData data, key
		res._sendData = (data, key = o.dataKey) ->
			__afterCallback key is o.errorKey, data, req, res, o.after, (err) ->
				return next err if err
				r = {}
				r[key] = data
				res._end r
		res._end = (data) ->
			body = req.body
			body = "Body too long" if JSON.stringify(body).length > 1024
			took = Date.now() - d.getTime()
			endpoint = "#{req.method} #{req.path}"
			deprecated = no
			if data
				if req.__endpoint and req.__endpoint.isDeprecated()
					deprecated = yes
					data.warning = "This endpoint is deprecated. It could be removed in the future."
				if o.meta.enabled and req.query.nometa is undefined
					data._meta =
						took: took
						deprecated: deprecated or undefined
						rs:
							version: pkg.version
							module: "https://www.npmjs.com/package/#{pkg.name}"
						request:
							endpoint: endpoint
							body: body
							query: req.query
							headers: req.headers
					if res.__meta
						data._meta[k] = v for k, v of res.__meta
				res.header "content-type", "application/json; charset=utf-8"
				res.write JSON.stringify data, null, if req.query.pretty is undefined then 0 else 4
			res.end()

			if o.log and typeof o.logger is "function"
				o.logger
					statusCode: res.statusCode
					method: req.method
					path: req.path
					spec: if req.route then req.route.path else req.path
					body: req.body
					params: req.params
					query: req.query
					headers: req.headers
					took: took
		
		res.addMeta k, v for k, v of o.meta.data
			
		next()
	app.use compression()
	app.use bodyParser.json limit: o.requestLimit

	squirrel =
		use: (route, callback) ->
			return app.use route unless callback
			app.use route, callback

	cb = (method) ->
		(version, route, requiredAuth, requiredParams, docs, callback) ->
			if isNaN parseFloat version
				callback = docs
				docs = requiredParams
				requiredParams = requiredAuth
				requiredAuth = route
				route = version
				version = null
			__handle app, o, method, version, route, requiredAuth, requiredParams, docs, callback
	
	for method in __methods
		squirrel[method] = cb method

	if o.docs.enabled
		squirrel.get o.docs.route, o.docs.auth, [], "Documentation of this API.", (req, res, next) ->
			docs = {}
			for key, route of Route.routes
				for v, endpoint of route.routes
					docs["#{route.method.toUpperCase()} #{endpoint.getEndpoint()}"] =
						docs: endpoint.docs
						#params: endpoint.params
						required_params: endpoint.requiredParams
						required_auth: endpoint.requiredAuth
						deprecated: endpoint.isDeprecated()
			next no, docs

	squirrel.listen = ->
		f = (endpoint) ->
			(req, res, next) ->
				req.__endpoint = endpoint
				__checkAuth req, res, endpoint.requiredAuth, o.auth, (err) ->
					return next err if err
					__checkParams endpoint.requiredParams, req, res, (err) ->
						return next err if err
						__beforeCallback req, res, o.before, (err) ->
							return next err if err
							endpoint.callback req, res, (err, data) ->
								return next err if err
								res._sendData data
				
		for key, route of Route.routes
			for v, endpoint of route.routes
				app[route.method] endpoint.getEndpoint(), f endpoint

		app.use "*", (req, res, next) ->
			res.send404()
		app.use (err, req, res, next) ->
			unless err instanceof Err
				err = new Err err
			if o.log
				console.error err.message
				if o.logStack
					console.error err.stack
			res.status 500 if res.statusCode is 200
			res._sendData err.toJSON(), o.errorKey
		app.listen o.port
		console.log new Date, "Listening on #{o.port}" if o.log

	squirrel

module.exports.Error = Err
module.exports.Endpoint = Endpoint