request = require "request"
chai = require "chai"

Endpoint = require "../src/endpoint"

describe "Endpoint instance", ->

    it "checks the default values of the instance", ->
        #e = new Endpoint
        