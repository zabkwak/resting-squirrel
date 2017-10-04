rs = require "../src"
request = require "request"
chai = require "chai"
expect = chai.expect

app = rs
	log: no
	logStack: no

app.get "/", (req, res, next) -> next no, success: yes

app.get "/auth", yes, (req, res, next) -> next no, success: yes

app.get "/params", no, ["param"], (req, res, next) -> next no, success: yes

app.post "/params", no, ["param"], (req, res, next) -> next no, success: yes

app.get "/204", (req, res, next) -> res.send204()

app.get "/501", (req, res, next) -> res.send501()

app.listen()

describe "Base calls", ->
	it "calls the documentation endpoint", (done) ->
		request.get
			url: "http://localhost:8080/docs"
			gzip: yes
			json: yes
		, (err, res, body) ->
			expect(err).to.be.null
			expect(res.headers["content-type"]).to.be.equal "application/json; charset=utf-8"
			expect(body).to.have.all.keys ["data", "_meta"]
			done()
	it "calls the endpoint with nometa parameter", (done) ->
		request.get
			url: "http://localhost:8080/?nometa"
			gzip: yes
			json: yes
		, (err, res, body) ->
			expect(err).to.be.null
			expect(res.headers["content-type"]).to.be.equal "application/json; charset=utf-8"
			expect(body).to.have.all.keys ["data"]
			done()

describe "Authorization", ->
	it "calls the endpoint which requires authorization without token", (done) ->
		request.get
			url: "http://localhost:8080/auth?nometa"
			gzip: yes
			json: yes
		, (err, res, body) ->
			expect(err).to.be.null
			expect(res.headers["content-type"]).to.be.equal "application/json; charset=utf-8"
			expect(res.statusCode).to.equal 401
			done()
	it "calls the endpoint which requires authorization with token", (done) ->
		request.get
			url: "http://localhost:8080/auth?nometa"
			gzip: yes
			json: yes
			headers: "x-token": "baf"
		, (err, res, body) ->
			expect(err).to.be.null
			expect(res.headers["content-type"]).to.be.equal "application/json; charset=utf-8"
			expect(body).to.have.all.keys ["data"]
			done()

describe "GET parameter validation", ->
	it "calls the GET endpoint with parameters", (done) ->
		request.get
			url: "http://localhost:8080/params?nometa"
			gzip: yes
			json: yes
			qs: param: 1
		, (err, res, body) ->
			expect(err).to.be.null
			expect(res.headers["content-type"]).to.be.equal "application/json; charset=utf-8"
			expect(body).to.have.all.keys ["data"]
			done()
	it "calls the GET endpoint without parameters", (done) ->
		request.get
			url: "http://localhost:8080/params?nometa"
			gzip: yes
			json: yes
		, (err, res, body) ->
			expect(err).to.be.null
			expect(res.headers["content-type"]).to.be.equal "application/json; charset=utf-8"
			expect(body).to.have.all.keys ["error"]
			expect(body.error).to.have.all.keys ["message", "code"]
			expect(body.error.code).to.equal "ERR_MISSING_PARAMETER"
			done()

describe "POST parameter validation", ->
	it "calls the POST endpoint with parameters", (done) ->
		request.post
			url: "http://localhost:8080/params?nometa"
			gzip: yes
			json: yes
			body: param: 1
		, (err, res, body) ->
			expect(err).to.be.null
			expect(res.headers["content-type"]).to.be.equal "application/json; charset=utf-8"
			expect(body).to.have.all.keys "data"
			done()
	
	it "calls the POST endpoint without parameters", (done) ->
		request.post
			url: "http://localhost:8080/params?nometa"
			gzip: yes
			json: yes
		, (err, res, body) ->
			expect(err).to.be.null
			expect(res.headers["content-type"]).to.be.equal "application/json; charset=utf-8"
			expect(body).to.have.all.keys "error"
			expect(body.error).to.have.all.keys ["message", "code"]
			expect(body.error.code).to.equal "ERR_MISSING_PARAMETER"
			done()

describe "Response codes", ->
	it "calls endpoint with 204 response code", (done) ->
		request.get
			url: "http://localhost:8080/204"
			gzip: yes
			json: yes
		, (err, res, body) ->
			expect(err).to.be.null
			expect(res.headers["content-type"]).to.be.equal undefined
			expect(res.statusCode).to.be.equal 204
			expect(body).to.be.undefined
			done()
	it "calls not existing endpoint", (done) ->
		request.get
			url: "http://localhost:8080/404?nometa"
			gzip: yes
			json: yes
		, (err, res, body) ->
			expect(err).to.be.null
			expect(res.headers["content-type"]).to.be.equal "application/json; charset=utf-8"
			expect(res.statusCode).to.be.equal 404
			expect(body).to.have.all.keys ["error"]
			expect(body.error).to.have.all.keys ["message", "code"]
			expect(body.error.code).to.be.equal "ERR_PAGE_NOT_FOUND"
			done()
	it "calls endpoint with 501 error code", (done) ->
		request.get
			url: "http://localhost:8080/501?nometa"
			gzip: yes
			json: yes
		, (err, res, body) ->
			expect(err).to.be.null
			expect(res.headers["content-type"]).to.be.equal "application/json; charset=utf-8"
			expect(res.statusCode).to.be.equal 501
			expect(body).to.have.all.keys ["error"]
			expect(body.error).to.have.all.keys ["message", "code"]
			expect(body.error.code).to.be.equal "ERR_NOT_IMPLEMENTED"
			done()