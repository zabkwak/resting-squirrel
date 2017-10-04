rs = require "../src"
request = require "request"
chai = require "chai"
expect = chai.expect

describe "Endpoint lifecycle", ->
	app = rs
		log: no
		port: 8081
		auth: (req, res, next) ->
			req.lifecycle.auth = yes
			return res.send401() unless req.headers["x-token"]
			next()
		before: (req, res, next) ->
			req.lifecycle.before = yes
			next()
		after: (isError, data, req, res, next) ->
			req.lifecycle.after = yes
			res.header "lifecycle", JSON.stringify req.lifecycle
			next()
	# Force __meta key to the res for add meta data for counting callbacks
	app.use (req, res, next) ->
		req.lifecycle =
			auth: no
			before: no
			after: no
		next()
	app.get "/", (req, res, next) -> next no, success: yes
	app.get "/auth", yes, (req, res, next) -> next no, success: yes
	app.get "/204", (req, res, next) -> res.send204()
	app.get "/204/auth", yes, (req, res, next) -> res.send204()
	app.listen()

	it "calls all functions of the lifecycle on the not auth endpoint", (done) ->
		request.get
			url: "http://localhost:8081"
			gzip: yes
			json: yes
		, (err, res, body) ->
			expect(err).to.be.null
			expect(body).to.have.all.keys ["data", "_meta"]
			expect(body.data).to.have.all.keys ["success"]
			lifecycle = JSON.parse res.headers.lifecycle
			expect(lifecycle).to.be.an "object"
			expect(lifecycle).to.have.all.keys ["auth", "before", "after"]
			expect(lifecycle.auth).to.be.false
			expect(lifecycle.before).to.be.true
			expect(lifecycle.after).to.be.true
			done()

	it "calls all functions of the lifecycle on the auth endpoint", (done) ->
		request.get
			url: "http://localhost:8081/auth"
			gzip: yes
			json: yes
			headers: "x-token": "token"
		, (err, res, body) ->
			expect(err).to.be.null
			expect(body).to.have.all.keys ["data", "_meta"]
			expect(body.data).to.have.all.keys ["success"]
			lifecycle = JSON.parse res.headers.lifecycle
			expect(lifecycle).to.be.an "object"
			expect(lifecycle).to.have.all.keys ["auth", "before", "after"]
			expect(lifecycle.auth).to.be.true
			expect(lifecycle.before).to.be.true
			expect(lifecycle.after).to.be.true
			done()

	it "calls all functions of the lifecycle on the non existing endpoint", (done) ->
		request.get
			url: "http://localhost:8081/non-existing"
			gzip: yes
			json: yes
		, (err, res, body) ->
			expect(err).to.be.null
			expect(body).to.have.all.keys ["error", "_meta"]
			expect(body.error).to.have.all.keys ["code", "message"]
			expect(body.error.code).to.be.equal "ERR_PAGE_NOT_FOUND"
			lifecycle = JSON.parse res.headers.lifecycle
			expect(lifecycle).to.be.an "object"
			expect(lifecycle).to.have.all.keys ["auth", "before", "after"]
			expect(lifecycle.auth).to.be.false
			expect(lifecycle.before).to.be.false
			expect(lifecycle.after).to.be.true
			done()

	it "calls all functions of the lifecycle on the auth endpoint without token to authorize", (done) ->
		request.get
			url: "http://localhost:8081/auth"
			gzip: yes
			json: yes
		, (err, res, body) ->
			expect(err).to.be.null
			expect(body).to.have.all.keys ["error", "_meta"]
			expect(body.error).to.have.all.keys ["code", "message"]
			expect(body.error.code).to.be.equal "ERR_UNAUTHORIZED_REQUEST"
			lifecycle = JSON.parse res.headers.lifecycle
			expect(lifecycle).to.be.an "object"
			expect(lifecycle).to.have.all.keys ["auth", "before", "after"]
			expect(lifecycle.auth).to.be.true
			expect(lifecycle.before).to.be.false
			expect(lifecycle.after).to.be.true
			done()

	it "calls all functions of the lifecycle on the endpoint with 204 response code", (done) ->
		request.get
			url: "http://localhost:8081/204"
			gzip: yes
			json: yes
		, (err, res, body) ->
			expect(err).to.be.null
			expect(body).to.be.undefined
			lifecycle = JSON.parse res.headers.lifecycle
			expect(lifecycle).to.be.an "object"
			expect(lifecycle).to.have.all.keys ["auth", "before", "after"]
			expect(lifecycle.auth).to.be.false
			expect(lifecycle.before).to.be.true
			expect(lifecycle.after).to.be.true
			done()

	it "calls all functions of the lifecycle on the auth endpoint with 204 response code", (done) ->
		request.get
			url: "http://localhost:8081/204/auth"
			gzip: yes
			json: yes
			headers: "x-token": "token"
		, (err, res, body) ->
			expect(err).to.be.null
			expect(body).to.be.undefined
			lifecycle = JSON.parse res.headers.lifecycle
			expect(lifecycle).to.be.an "object"
			expect(lifecycle).to.have.all.keys ["auth", "before", "after"]
			expect(lifecycle.auth).to.be.true
			expect(lifecycle.before).to.be.true
			expect(lifecycle.after).to.be.true
			done()