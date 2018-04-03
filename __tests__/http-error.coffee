rs = require "../src"
chai = require "chai"
SmartError = require "smart-error"

expect = chai.expect

HttpError = rs.HttpError

describe "HttpError", () ->
    it "checks the default values of the HttpError", ->
        error = new HttpError 400
        expect(error).to.be.instanceOf Error
        expect(error).to.be.instanceOf SmartError
        expect(error).to.have.all.keys ["message", "code", "statusCode"]
        expect(error.message).to.be.equal "Unknown error"
        expect(error.code).to.be.equal "ERR_UNKNOWN"
        expect(error.statusCode).to.be.equal 400
    it "gets the error instance by the statusCode", ->
        error = HttpError.create 400
        expect(error).to.be.instanceOf Error
        expect(error).to.be.instanceOf SmartError
        expect(error).to.have.all.keys ["message", "code", "statusCode"]
        expect(error.message).to.be.equal "Bad Request"
        expect(error.code).to.be.equal "ERR_BAD_REQUEST"
        expect(error.statusCode).to.be.equal 400