// Generated by CoffeeScript 1.10.0
(function() {
  var Endpoint, Err, Route, __checkAuth, __checkParams, __handle, __hasObjectValue, __mergeObjects, __methods, __options, bodyParser, compression, express, pkg;

  express = require("express");

  compression = require("compression");

  bodyParser = require("body-parser");

  Err = require("./error");

  Endpoint = require("./endpoint");

  pkg = require("../package");

  __options = {
    port: 8080,
    dataKey: "data",
    errorKey: "error",
    log: true,
    logStack: true,
    meta: {
      enabled: true,
      data: {}
    },
    requestLimit: "1mb",
    docs: {
      enabled: true,
      route: "/docs",
      auth: false
    },
    auth: function(req, res, next) {
      if (!req.headers["x-token"]) {
        return res.send401();
      }
      return next();
    }
  };

  __methods = ["get", "post", "put", "delete", "head"];

  Route = (function() {
    function Route(method1, route1) {
      this.method = method1;
      this.route = route1;
      this.routes = {};
    }

    Route.prototype.addEndpoint = function(endpoint) {
      this.routes[endpoint.version] = endpoint;
      return endpoint.route = this;
    };

    Route.prototype.getMaxVersion = function() {
      var max;
      max = Math.max.apply(null, Object.keys(this.routes));
      if (!isNaN(max)) {
        return max;
      }
      return null;
    };

    return Route;

  })();

  Route.routes = {};

  Route.add = function(method, name, endpoint) {
    var key, route;
    key = "" + method + name;
    if (!this.routes[key]) {
      this.routes[key] = new Route(method, name);
    }
    route = this.routes[key];
    route.addEndpoint(endpoint);
    return endpoint;
  };

  __hasObjectValue = function(o, path) {
    var i, k, len, p, t, v;
    t = {};
    for (k in o) {
      v = o[k];
      t[k] = v;
    }
    for (i = 0, len = path.length; i < len; i++) {
      p = path[i];
      if (!t[p]) {
        return false;
      }
      t = t[p];
    }
    return true;
  };

  __checkParams = function(params, req, res, next) {
    var i, len, p;
    if (params.length === 0) {
      return next();
    }
    for (i = 0, len = params.length; i < len; i++) {
      p = params[i];
      if (req.method === "GET") {
        if (!req.query[p]) {
          if (p.indexOf(".") < 0) {
            return next(new Err("Parameter '" + p + "' is missing", "missing_parameter"));
          }
          if (!__hasObjectValue(req.query, p.split("."))) {
            return next(new Err("Parameter '" + p + "' is missing", "missing_parameter"));
          }
        }
      } else {
        if (!req.body[p]) {
          if (p.indexOf(".") < 0) {
            return next(new Err("Parameter '" + p + "' is missing", "missing_parameter"));
          }
          if (!__hasObjectValue(req.body, p.split("."))) {
            return next(new Err("Parameter '" + p + "' is missing", "missing_parameter"));
          }
        }
      }
    }
    return next();
  };

  __checkAuth = function(req, res, requiredAuth, authMethod, cb) {
    if (!requiredAuth) {
      return cb();
    }
    return authMethod(req, res, cb);
  };

  __handle = function(app, options, method, version, route, requiredAuth, requiredParams, docs, callback) {
    if (typeof requiredAuth === "function") {
      callback = requiredAuth;
      requiredAuth = false;
      requiredParams = [];
      docs = null;
    } else if (typeof requiredParams === "function") {
      callback = requiredParams;
      requiredParams = [];
      docs = null;
    } else if (typeof docs === "function") {
      callback = docs;
      docs = null;
    }
    return Route.add(method, route, new Endpoint(version, requiredAuth, requiredParams, docs, callback));
  };

  __mergeObjects = function(o1, o2) {
    var k, o, v;
    o = {};
    for (k in o2) {
      v = o2[k];
      if (o1[k] === void 0) {
        o[k] = v;
        continue;
      }
      if (typeof v !== "object") {
        o[k] = o1[k];
        continue;
      }
      o[k] = __mergeObjects(o1[k], v);
    }
    return o;
  };

  module.exports = function(options) {
    var app, cb, i, k, len, method, o, ref, squirrel, v;
    if (options == null) {
      options = {};
    }
    o = __mergeObjects(options, __options);
    if (options.meta && options.meta.data) {
      ref = options.meta.data;
      for (k in ref) {
        v = ref[k];
        o.meta.data[k] = v;
      }
    }
    app = express();
    app.use(function(req, res, next) {
      var d, ref1;
      app.set("json spaces", req.query.pretty === void 0 ? 0 : 4);
      d = new Date;
      res.send404 = function(message) {
        if (message == null) {
          message = "Page not found";
        }
        res.status(404);
        return next(new Err(message, "page_not_found"));
      };
      res.send401 = function(message) {
        if (message == null) {
          message = "Unauthorized request";
        }
        res.status(401);
        return next(new Err(message, "unauthorized_request"));
      };
      res.addMeta = function(key, value) {
        if (res.__meta == null) {
          res.__meta = {};
        }
        return res.__meta[key] = value;
      };
      res.sendData = function(data, key) {
        var body, deprecated, endpoint, error, r, ref1, took;
        if (key == null) {
          key = o.dataKey;
        }
        r = {};
        r[key] = data;
        body = req.body;
        if (JSON.stringify(body).length > 1024) {
          body = "Body too long";
        }
        took = Date.now() - d.getTime();
        endpoint = req.method + " " + req.path;
        deprecated = false;
        if (req.__endpoint && req.__endpoint.isDeprecated()) {
          deprecated = true;
          r.warning = "This endpoint is deprecated. It could be removed in the future.";
        }
        if (o.meta.enabled && req.query.nometa === void 0) {
          r._meta = {
            took: took,
            deprecated: deprecated || void 0,
            rs: {
              version: pkg.version,
              module: "https://www.npmjs.com/package/" + pkg.name
            },
            request: {
              endpoint: endpoint,
              body: body,
              query: req.query,
              headers: req.headers
            }
          };
          if (res.__meta) {
            ref1 = res.__meta;
            for (k in ref1) {
              v = ref1[k];
              r._meta[k] = v;
            }
          }
        }
        if (o.log) {
          error = "";
          console.log(new Date, res.statusCode + " " + req.method + " " + req.path + " BODY: " + (JSON.stringify(body)) + " QUERY: " + (JSON.stringify(req.query)) + " HEADERS: " + (JSON.stringify(req.headers)) + " TOOK: " + took + " ms");
          console.log("");
        }
        return res.json(r);
      };
      ref1 = o.meta.data;
      for (k in ref1) {
        v = ref1[k];
        res.addMeta(k, v);
      }
      return next();
    });
    app.use(compression());
    app.use(bodyParser.json({
      limit: o.requestLimit
    }));
    squirrel = {
      use: function(route, callback) {
        if (!callback) {
          return app.use(route);
        }
        return app.use(route, callback);
      }
    };
    cb = function(method) {
      return function(version, route, requiredAuth, requiredParams, docs, callback) {
        if (isNaN(parseFloat(version))) {
          callback = docs;
          docs = requiredParams;
          requiredParams = requiredAuth;
          requiredAuth = route;
          route = version;
          version = null;
        }
        return __handle(app, o, method, version, route, requiredAuth, requiredParams, docs, callback);
      };
    };
    for (i = 0, len = __methods.length; i < len; i++) {
      method = __methods[i];
      squirrel[method] = cb(method);
    }
    if (o.docs.enabled) {
      squirrel.get(o.docs.route, o.docs.auth, [], "Documentation of this API.", function(req, res, next) {
        var docs, endpoint, key, ref1, ref2, route;
        docs = {};
        ref1 = Route.routes;
        for (key in ref1) {
          route = ref1[key];
          ref2 = route.routes;
          for (v in ref2) {
            endpoint = ref2[v];
            docs[(route.method.toUpperCase()) + " " + (endpoint.getEndpoint())] = {
              docs: endpoint.docs,
              required_params: endpoint.requiredParams,
              required_auth: endpoint.requiredAuth,
              deprecated: endpoint.isDeprecated()
            };
          }
        }
        return next(false, docs);
      });
    }
    squirrel.listen = function() {
      var endpoint, f, key, ref1, ref2, route;
      f = function(endpoint) {
        return function(req, res, next) {
          req.__endpoint = endpoint;
          return __checkAuth(req, res, endpoint.requiredAuth, o.auth, function(err) {
            if (err) {
              return next(err);
            }
            return __checkParams(endpoint.requiredParams, req, res, function(err) {
              if (err) {
                return next(err);
              }
              return endpoint.callback(req, res, function(err, data) {
                if (err) {
                  return next(err);
                }
                return res.sendData(data);
              });
            });
          });
        };
      };
      ref1 = Route.routes;
      for (key in ref1) {
        route = ref1[key];
        ref2 = route.routes;
        for (v in ref2) {
          endpoint = ref2[v];
          app[route.method](endpoint.getEndpoint(), f(endpoint));
        }
      }
      app.use("*", function(req, res, next) {
        return res.send404();
      });
      app.use(function(err, req, res, next) {
        if (!(err instanceof Err)) {
          err = new Err(err);
        }
        if (o.log) {
          console.error(err.message);
          if (o.logStack) {
            console.error(err.stack);
          }
        }
        if (res.statusCode === 200) {
          res.status(500);
        }
        return res.sendData({
          message: err.message,
          code: err.code
        }, o.errorKey);
      });
      app.listen(o.port);
      if (o.log) {
        return console.log(new Date, "Listening on " + o.port);
      }
    };
    return squirrel;
  };

  module.exports.Error = Err;

  module.exports.Endpoint = Endpoint;

}).call(this);
