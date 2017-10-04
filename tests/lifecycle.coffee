rs = require "../src"
request = require "request"
chai = require "chai"
expect = chai.expect

describe "Endpoint lifecycle", ->
	app = rs
		log: no
		port: 8081
		auth: (req, res, next) ->
			res.__meta.lifecycle.auth = yes
			return res.send401() unless req.headers["x-token"]
			next()
		before: (req, res, next) ->
			res.__meta.lifecycle.before = yes
			next()
		after: (isError, data, req, res, next) ->
			res.__meta.lifecycle.after = yes
			next()
	# Force __meta key to the res for add meta data for counting callbacks
	app.use (req, res, next) ->
		res.__meta ?=
			lifecycle:
				auth: no
				before: no
				after: no
		next()
	app.get "/", (req, res, next) -> next no, success: yes
	app.get "/auth", yes, (req, res, next) -> next no, success: yes
	app.get "/204", (req, res, next) -> res.send204()
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
			expect(body._meta.lifecycle).to.be.an "object"
			expect(body._meta.lifecycle).to.have.all.keys ["auth", "before", "after"]
			expect(body._meta.lifecycle.auth).to.be.false
			expect(body._meta.lifecycle.before).to.be.true
			expect(body._meta.lifecycle.after).to.be.true
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
			expect(body._meta.lifecycle).to.be.an "object"
			expect(body._meta.lifecycle).to.have.all.keys ["auth", "before", "after"]
			expect(body._meta.lifecycle.auth).to.be.true
			expect(body._meta.lifecycle.before).to.be.true
			expect(body._meta.lifecycle.after).to.be.true
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
			expect(body._meta.lifecycle).to.be.an "object"
			expect(body._meta.lifecycle).to.have.all.keys ["auth", "before", "after"]
			expect(body._meta.lifecycle.auth).to.be.false
			expect(body._meta.lifecycle.before).to.be.false
			expect(body._meta.lifecycle.after).to.be.true
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
			expect(body._meta.lifecycle).to.be.an "object"
			expect(body._meta.lifecycle).to.have.all.keys ["auth", "before", "after"]
			expect(body._meta.lifecycle.auth).to.be.true
			expect(body._meta.lifecycle.before).to.be.false
			expect(body._meta.lifecycle.after).to.be.true
			done()