// Generated by CoffeeScript 1.10.0
(function() {
  var app, chai, check, expect, request, rs;

  rs = require("../");

  request = require("request");

  chai = require("chai");

  expect = chai.expect;

  check = function(done, cb) {
    var e, error;
    try {
      cb();
      return done();
    } catch (error) {
      e = error;
      return done(e);
    }
  };

  app = rs({
    log: false
  });

  app.get("/", function(req, res, next) {
    return next(false, {
      success: true
    });
  });

  app.get("/auth", true, function(req, res, next) {
    return next(false, {
      success: true
    });
  });

  app.get("/params", false, ["param"], function(req, res, next) {
    return next(false, {
      success: true
    });
  });

  app.post("/params", false, ["param"], function(req, res, next) {
    return next(false, {
      success: true
    });
  });

  app.listen();

  describe("Docs call test", function() {
    return it("data key found in /docs endpoint", function(done) {
      return request.get({
        url: "http://localhost:8080/docs",
        gzip: true,
        json: true
      }, function(err, res, body) {
        return check(done, function() {
          return expect(body).to.have.keys(["data", "_meta"]);
        });
      });
    });
  });

  describe("No meta call test", function() {
    return it("no meta data in the call", function(done) {
      return request.get({
        url: "http://localhost:8080/?nometa",
        gzip: true,
        json: true
      }, function(err, res, body) {
        return check(done, function() {
          return expect(body).to.have.keys(["data"]);
        });
      });
    });
  });

  describe("No auth call test", function() {
    return it("401 error", function(done) {
      return request.get({
        url: "http://localhost:8080/auth",
        gzip: true,
        json: true
      }, function(err, res, body) {
        return check(done, function() {
          return expect(res.statusCode).to.equal(401);
        });
      });
    });
  });

  describe("Auth call test", function() {
    return it("data key found in /auth endpoint", function(done) {
      return request.get({
        url: "http://localhost:8080/auth?nometa",
        gzip: true,
        json: true,
        headers: {
          "x-token": "baf"
        }
      }, function(err, res, body) {
        return check(done, function() {
          return expect(body).to.have.keys(["data"]);
        });
      });
    });
  });

  describe("GET parameter validation", function() {
    return it("data key found in /params endpoint", function(done) {
      return request.get({
        url: "http://localhost:8080/params?nometa",
        gzip: true,
        json: true,
        qs: {
          param: 1
        }
      }, function(err, res, body) {
        return check(done, function() {
          return expect(body).to.have.keys("data");
        });
      });
    });
  });

  describe("GET parameter validation", function() {
    return it("missing parameter error in /params endpoint", function(done) {
      return request.get({
        url: "http://localhost:8080/params?nometa",
        gzip: true,
        json: true
      }, function(err, res, body) {
        return check(done, function() {
          expect(body).to.have.keys("error");
          expect(body.error).to.have.keys(["message", "code"]);
          return expect(body.error.code).to.equal("ERR_MISSING_PARAMETER");
        });
      });
    });
  });

  describe("POST parameter validation", function() {
    return it("data key found in /params endpoint", function(done) {
      return request.post({
        url: "http://localhost:8080/params?nometa",
        gzip: true,
        json: true,
        body: {
          param: 1
        }
      }, function(err, res, body) {
        return check(done, function() {
          return expect(body).to.have.keys("data");
        });
      });
    });
  });

  describe("POST parameter validation", function() {
    return it("missing parameter error in /params endpoint", function(done) {
      return request.post({
        url: "http://localhost:8080/params?nometa",
        gzip: true,
        json: true
      }, function(err, res, body) {
        return check(done, function() {
          expect(body).to.have.keys("error");
          expect(body.error).to.have.keys(["message", "code"]);
          return expect(body.error.code).to.equal("ERR_MISSING_PARAMETER");
        });
      });
    });
  });

}).call(this);
