express = require "express"
compression = require "compression"
bodyParser = require "body-parser"

Err = require "./error"
Endpoint = require "./endpoint"

pkg = require "../package"

__options = 
	port: 8080
	dataKey: "data"
	errorKey: "error"
	log: yes
	logStack: yes
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
		app.set "json spaces", if req.query.pretty is undefined then 0 else 4
		d = new Date
		res.send404 = (message = "Page not found") ->
			res.status 404
			next new Err message, "page_not_found"
		res.send401 = (message = "Unauthorized request") ->
			res.status 401
			next new Err message, "unauthorized_request"
		res.addMeta = (key, value) ->
			res.__meta ?= {}
			res.__meta[key] = value
		res.sendData = (data, key = o.dataKey) ->
			r = {}
			r[key] = data
			body = req.body
			body = "Body too long" if JSON.stringify(body).length > 1024
			took = Date.now() - d.getTime()
			endpoint = "#{req.method} #{req.path}"
			deprecated = no
			if req.__endpoint and req.__endpoint.isDeprecated()
				deprecated = yes
				r.warning = "This endpoint is deprecated. It could be removed in the future."
			if o.meta.enabled and req.query.nometa is undefined
				r._meta = 
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
					r._meta[k] = v for k, v of res.__meta
						
			if o.log
				error = ""
				console.log new Date, "#{res.statusCode} #{req.method} #{req.path} BODY: #{JSON.stringify body} QUERY: #{JSON.stringify req.query} HEADERS: #{JSON.stringify req.headers} TOOK: #{took} ms"
				console.log ""
			res.json r
		
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
						endpoint.callback req, res, (err, data) ->
							return next err if err
							res.sendData data
				
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
			res.sendData 
				message: err.message
				code: err.code
			, o.errorKey
		app.listen o.port
		console.log new Date, "Listening on #{o.port}" if o.log

	squirrel	

module.exports.Error = Err
module.exports.Endpoint = Endpoint