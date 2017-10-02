rs = require "../src"
request = require "request"
chai = require "chai"
expect = chai.expect

check = (done, cb) ->
	try
		cb()
		done()
	catch e
		done e

app = rs
	log: no

app.get "/", (req, res, next) -> next no, success: yes

app.get "/auth", yes, (req, res, next) -> next no, success: yes

app.get "/params", no, ["param"], (req, res, next) -> next no, success: yes

app.post "/params", no, ["param"], (req, res, next) -> next no, success: yes

app.get "/204", (req, res, next) -> res.send204()

app.listen()

describe "Docs call test", ->
	it "data key found in /docs endpoint", (done) ->
		request.get
			url: "http://localhost:8080/docs"
			gzip: yes
			json: yes
		, (err, res, body) ->
			check done, ->
				expect(body).to.have.keys ["data", "_meta"]

describe "No meta call test", ->
	it "no meta data in the call", (done) ->
		request.get
			url: "http://localhost:8080/?nometa"
			gzip: yes
			json: yes
		, (err, res, body) ->
			check done, ->
				expect(body).to.have.keys ["data"]

describe "No auth call test", ->
	it "401 error", (done) ->
		request.get
			url: "http://localhost:8080/auth"
			gzip: yes
			json: yes
		, (err, res, body) ->
			check done, ->
				expect(res.statusCode).to.equal 401

describe "Auth call test", ->
	it "data key found in /auth endpoint", (done) ->
		request.get
			url: "http://localhost:8080/auth?nometa"
			gzip: yes
			json: yes
			headers: "x-token": "baf"
		, (err, res, body) ->
			check done, ->
				expect(body).to.have.keys ["data"]

describe "GET parameter validation", ->
	it "data key found in /params endpoint", (done) ->
		request.get
			url: "http://localhost:8080/params?nometa"
			gzip: yes
			json: yes
			qs: param: 1
		, (err, res, body) ->
			check done, ->
				expect(body).to.have.keys "data"

describe "GET parameter validation", ->
	it "missing parameter error in /params endpoint", (done) ->
		request.get
			url: "http://localhost:8080/params?nometa"
			gzip: yes
			json: yes
		, (err, res, body) ->
			check done, ->
				expect(body).to.have.keys "error"
				expect(body.error).to.have.keys ["message", "code"]
				expect(body.error.code).to.equal "ERR_MISSING_PARAMETER"

describe "POST parameter validation", ->
	it "data key found in /params endpoint", (done) ->
		request.post
			url: "http://localhost:8080/params?nometa"
			gzip: yes
			json: yes
			body: param: 1
		, (err, res, body) ->
			check done, ->
				expect(body).to.have.keys "data"

describe "POST parameter validation", ->
	it "missing parameter error in /params endpoint", (done) ->
		request.post
			url: "http://localhost:8080/params?nometa"
			gzip: yes
			json: yes
		, (err, res, body) ->
			check done, ->
				expect(body).to.have.keys "error"
				expect(body.error).to.have.keys ["message", "code"]
				expect(body.error.code).to.equal "ERR_MISSING_PARAMETER"

describe "Response codes", ->
	it "calls endpoint with 204 response code", (done) ->
		request.get
			url: "http://localhost:8080/204"
			gzip: yes
			json: yes
		, (err, res, body) ->
			expect(err).to.be.null
			expect(res.statusCode).to.be.equal 204
			expect(body).to.be.undefined
			done()