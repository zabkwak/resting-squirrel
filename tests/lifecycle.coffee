rs = require "../src"
request = require "request"
chai = require "chai"
expect = chai.expect

describe "Endpoint lifecycle", ->
	app = rs
		log: no
		port: 8081
		auth: (req, res, next) ->
			res.__counter ?= 0
			res.__counter++
			next()
		before: (req, res, next) ->
			res.__counter ?= 0
			res.__counter++
			next()
		after: (err, data, req, res, next) ->
			res.__counter ?= 0
			res.__counter++
			data.counter = res.__counter
			next()
	app.get "/", (req, res, next) -> next no, counter: res.__counter
	app.get "/auth", yes, (req, res, next) -> next no, counter: res.__counter
	app.listen()

	it "calls all functions of the lifecycle on the not auth endpoint", (done) ->
		request.get
			url: "http://localhost:8081?nometa"
			gzip: yes
			json: yes
		, (err, res, body) ->
			expect(err).to.be.null
			expect(body).to.have.all.keys ["data"]
			expect(body.data).to.have.all.keys ["counter"]
			expect(body.data.counter).to.be.equal 2
			done()

	it "calls all functions of the lifecycle on the auth endpoint", (done) ->
		request.get
			url: "http://localhost:8081/auth?nometa"
			gzip: yes
			json: yes
		, (err, res, body) ->
			expect(err).to.be.null
			expect(body).to.have.all.keys ["data"]
			expect(body.data).to.have.all.keys ["counter"]
			expect(body.data.counter).to.be.equal 3
			done()