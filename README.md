# Resting Squirrel

Simple REST server with json input data. It uses [express](https://www.npmjs.com/package/express) functions for register endpoints. Non-existing routes are automatically handled and return 404 status.

## Installation

```bash
$ npm install resting-squirrel
```

## Usage
```javascript
import rs, { Param, Type, Field, ErrorField, RouteAuth } from 'resting-squirrel';

const app = rs();

// Simple definition
// Simple endpoint
app.get("/", (req, res, next) => next(null, { success: true }));
// Endpoint which requires authorization with specified version
app.get(0, '/user', true, (req, res, next) => next(null, { success: true}));
// Endpoint which requires authorization with incremented version causing 0 version endpoint is deprecated 
app.get(1, '/user', true, (req, res, next) => next(null, { success: true}));
// Endpoint with defined required parameter
app.put(0, '/user', false, [new Param('name', true, Type.string, 'Name of the user')], (req, res, next) => next(null, { success: true }));
// Endpoint with description
app.get('/documented', false, [], 'I am documented endpoint.', (req, res, next) => next(null, { success: true }));

// Complex definition
app.post(0, '/user/:id', {
    // Endpoint requires authorization
    auth: RouteAuth.REQUIRED,
    // Route argument "id" must be an integer
    args: [
        new Field('id', Type.integer, 'Identificator of the user to update'),
    ],
    // Endpoint accepts parameter name which has to be a string
    params: [
        new Param('name', false, Type.string, 'Name of the user'),
    ],
    // Endpoints returns object with parameters id (casted to integer before rendering data) and name
    response: [
        new Field('id', Type.integer, 'Identificator of the user'),
        new Field('name', Type.string, 'Name of the user'),
    ],
    // Description for the documentation
    description: 'Updates the user informations',
    errors: [
        new ErrorField('ERR_INVALID_USER', 'Returned if request id of the user does not exist.'),
    ],
}, (req, res, next) => User.update(req.params.id, req.body, next));

app.start();
```
This usage will create the app with default options. 

### Options
**port** Port where the app listens. Default: 8080  
**name** Name of the app. Default: Resting Squirrel App  
**dataKey** Key in the output where the data are sent. Default: data  
**errorKey** Key in the output where the error is sent. Default: error  
**requestLimit** Limit for input data. Default: 1mb  
**charset** Charset of the response. Default: utf-8  
**meta** Object for setting up the behaviour of meta data. 
- **enabled** If true meta data are showed in every request. Default: true  
- **data** Custom meta data for the application. This data are set for all endpoints. Default: {}

**log** Object to configure logging options.  
- **enabled** If true the logging is enabled. Default: true  
- **level** Logging level (error, warning, verbose). Default: verbose  
- **stack** If true the error stack is logged if logging is enabled. Default: true  
**logStack** If true and log is enabled the stack trace is written in stdout. This option should be false on the production app -> the request process is longer if the complete stack is printed to the console. Default: true DEPRECATED  
**logger({ statusCode, method, path, spec, body, params, query, headers, took, response })** Custom logging function which is called before the request ends. Default function logs the data in the console like in previous versions.  

**docs** Object for setting up the documentation for the API.
- **enabled** If true docs are enabled on the *options.docs.endpoint* endpoint. Default: true  
- **endpoint** On this endpoint is shown documentation. Default: /docs  
- **auth** If true documentation request must be authorized with *options.auth* function. Default: false DEPRECATED Using api key is preffered option.  
- **paramsAsArray** If true params are returned as array in the docs. Default: false  

**auth** Object for setting up the authorization.  
- **key** Key in the headers where the access token is. Default: x-token  
- **description** Custom description of the authorization process. Default: null  
- **validator(key, req, res, next)** Function which validates the access token. Default function just checks if the header with `key` exists.  

**apiKey** Object for setting up the api key.
- **enabled** If true api key is validated. Default: false  
- **type** Type of the location of api key in request. One of qs, body, header. Default: qs  
- **validator(apiKey, next)** Validator of api key. It should return `Promise<boolean>`.  

**timeout** Time in milliseconds. After this time the endpoints return 408 status code. Default: null  
**before** Object of functions with key as a route spec. The functions `(req, res, next)` are called before the endpoint execution. Default object on all endpoints just calls next(). DEPRECATED  
**after(isError, data, req, res, next)** Object of functions with key as a route spec. The functions `(err, data, req, res, next)` are called after the endpoint execution. Default object on all endpoints just calls next(). DEPRECATED  
**defaultError** Default error for response if no error is defined  
- **statusCode** Default HTTP status code on error. Default: 500
- **message** Default error message. Default: Server error  
- **code** Default error code. Default: unknown  

**validateParams** If true the params are validated and the validator message is printed in stdout as warning if something is found. Default: true  
**responseStrictValidation** If true the Error is thrown if response key has invalid type. Default: false  

### Errors
Module is using [SmartError](https://www.npmjs.com/package/smart-error) as base error and [HttpSmartError](https://www.npmjs.com/package/http-smart-error) for http errors.
```javascript
import { Error, HttpError } from 'resting-squirrel';

console.log(new Error("Some error", "some_code")); // Error with message "Some error" and code "ERR_SOME_CODE"
console.log(HttpError.create(400)); // Http error with 400 status code, message "Bad request" and code "ERR_BAD_REQUEST"
```

### Functions DEPRECATED
**use(route, callback)** Registers express middleware. Route can be callback.  
**get(version, route, requiredAuth = false, params = [], docs = null, callback)** Registers route on the GET method. requiredAuth, params and docs can be callback. Callback is taken from express.  
**post(version, route, requiredAuth = false, params = [], docs = null, callback)** Registers route on the POST method. requiredAuth, params and docs can be callback. Callback is taken from express.  
**put(version, route, requiredAuth = false, params = [], docs = null, callback)** Registers route on the PUT method. requiredAuth, params and docs can be callback. Callback is taken from express.  
**delete(version, route, requiredAuth = false, params = [], docs = null, callback)** Registers route on the DELETE method. requiredAuth, params and docscan be callback. Callback is taken from express.  
**head(version, route, requiredAuth = false, params = [], docs = null, callback)** Registers route on the HEAD method. requiredAuth, params and docs can be callback. Callback is taken from express.  
**listen(cb)** Starts listening on the port from options. DEPRECATED   
**start(cb)** Starts listening on the port from options.  

### Functions
**use(route, callback)** Registers express middleware. Route can be callback.  
**registerBeforeExecution(spec, callback)** Registers callback `(req, res)` to the route spec which is executed before the endpoint execution.  
**registerAfterExecution(spec, callback)** Registers callback `(isError, data, req, res)` to the route spec wich is executed after the endpoint execution.   
**get(version, route, options = {}, callback)** Registers route on the GET method. options can be callback. Callback is taken from express.  
**post(version, route, options = {}, callback)** Registers route on the POST method. options can be callback. Callback is taken from express.  
**put(version, route, options = {}, callback)** Registers route on the PUT method. options can be callback. Callback is taken from express.  
**delete(version, route, options = {}, callback)** Registers route on the DELETE method. optionscan be callback. Callback is taken from express.  
**head(version, route, options = {}, callback)** Registers route on the HEAD method. options can be callback. Callback is taken from express.  
**listen(cb)** Starts listening on the port from options. DEPRECATED   
**start(cb)** Starts listening on the port from options.  

#### Data handling
All http methods are using the same function for handling data. First parameter in the callback is error and second are data which are sent to the *options.dataKey* in the response.
```javascript
app.get(0, '/user', (req, res, next) => {
    const { user } = req;
    next(null, user);
});
```
##### Promises
The callback function can return promise or be an `async` function. Entire callback function is surrounded with `try-catch` block so all rejects in `async` functions are handled as errors.
```javascript
app.get(0, '/user', (req, res, next) => {
    const { user } = req;
    return new Promise(resolve => resolve(user));
});
app.get(1, '/user', async (req) => {
    const { user } = req;
    await user.doSomeAsyncStuff();
    return user;
});
```
For 204 response code just return `null` in the promise.

#### Endpoint options
**auth** Indicates auth process of the endpoint.  
**requireAuth** If true the endpoint requires authorization. DEPRECATED  
**description** Description of the endpoint.  
**args** List of `Field` instances to define endpoint arguments. If it's not defined all arguments defined in the route are of `any` type.  
**params** List of `Param` instances to define endpoint parameters.  
**response** List of `Field` instances to define endpoint response fields.  
**errors** List of `ErrorField` instances to define errors which could be returned during the execution.  
**hideDocs** If true the endpoint is hidden from the documentation.  
**requireApiKey** If false the endpoint doesn't require an api key in the request. This option overrides the `options.apiKey.enabled` option if it's false. It's not recommended to use this option.  
**props** Custom props for the endpoint.  

#### Arguments
The list of arguments fields in the http methods is array of `Field` instances. The values are validated with type checking. 
```javascript
import rs, { Param, Field, Type } from 'resting-squirrel';

const app = rs();

// It creates integer argument field with name int_arg
const f1 = new Field('int_arg', Type.integer, 'Integer argument');

// It creates float response field with name float_arg
const f2 = Field.create({
    name: 'float_arg',
    type: Type.float,
    description: 'Float argument',
});

// It creates any argument field with name any_arg
const f3 = Field.create('any_arg');

// Registers the GET endpoint which validates the arguments.
app.get(0, '/fields', {
    args: [f1, f2, f3],
    description: 'Test endpoint for argument examples',
}, (req, res, next) => next(null, req.params));
```

#### Params
The list of params in the http methods can be array of `string`s or array of `Param` instances. The params are input json in the POST, PUT, DELETE methods or query string in the GET method.
##### String array
The string array of the parameters is deprecated. It creates `Param` instances from string. The parameter has the name from the `string`, it will be required, the type will be `any` and it won't have a description.
##### Param array
The `Param` class can by required from the module. 
```javascript
import rs, { Param, Type } from 'resting-squirrel';

const app = rs();

// It creates required integer parameter with name int_param
const p1 = new Param('int_param', true, Type.integer, 'Integer parameter');

// It creates required float parameter with name float_param
const p2 = Param.create({
    name: 'float_param', 
    required: true,
    type: Type.float,
    description: 'Float parameter',
});

// It creates required any parameter with name any_param
const p3 = Param.create('any_param');

// Registers the GET endpoint which requires three parameters to execute
app.get(0, '/params', false, [p1, p2, p3], 'Test endpoint for param examples', (req, res, next) => next(null, req.query));
```
The `Param` class uses type definition from the [runtime-type](https://www.npmjs.com/package/runtime-type) for type checking. 

#### Response definition
The list of response fields in the http methods is array of `Field` instances. Response data sent to `next` function in endpoint callback are validated with type checking to render correct data-types.
```javascript
import rs, { Param, Field, Type, Response } from 'resting-squirrel';

const app = rs();

// It creates integer response field with name int_field
const f1 = new Field('int_field', Type.integer, 'Integer response field');

// It creates float response field with name float_field
const f2 = Field.create({
    name: 'float_field',
    type: Type.float,
    description: 'Float response field',
});

// It creates any response field with name any_field
const f3 = Field.create('any_field');

const doSomeStuff = () => {
    return {
        int_field: 666,
        float_field: 6.66,
        any_field: 'satan',
    };
};

// Registers the GET endpoint which validates the fields before the data render.
app.get(0, '/fields', {
    response: [f1, f2, f3],
    description: 'Test endpoint for field examples',
}, (req, res, next) => next(null, doSomeStuff()));

// Equivalent of the previous register but using a JSON Response instance.
app.get(1, '/fields', {
    response: new Response.JSON([f1, f2, f3]),
    description: 'Test endpoint for field examples',
}, (req, res, next) => next(null, doSomeStuff()));

// Registers the GET endpoint which sends a image content.
app.get(0, '/fields', {
    response: new Custom.Response('image/png'),
}, (req, res, next) => next(null, '[SOME IMAGE DATA]'));
```

#### Shapes
In some cases is needed to use shape field (param). Shapes are JS objects. The field (param) can have `Type.shape` but it's not effective for the documentation. For this purpose `Field` (`Param`) class has static classes `Shape` and `ShapeArray`. 
##### Field.Shape
###### constructor
| field         | type          | description                 |
| ------------- |:-------------:| --------------------------- |
| name          | string        | Name of the field           |
| description   | string        | Description of the field    |
| ...fields     | `Field`[]     | List of fields in the shape |
##### Field.ShapeArray
###### constructor
| field         | type          | description                 |
| ------------- |:-------------:| --------------------------- |
| name          | string        | Name of the field           |
| description   | string        | Description of the field    |
| ...fields     | `Field`[]     | List of fields in the shape |
##### Param.Shape
###### constructor
| field         | type          | description                        |
| ------------- |:-------------:| ---------------------------------- |
| name          | string        | Name of the param                  |
| required      | boolean       | Indicates if the param is requried |
| description   | string        | Description of the param           |
| ...params     | `Param`[]     | List of params in the shape        |
##### Param.ShapeArray
###### constructor
| field         | type          | description                        |
| ------------- |:-------------:| ---------------------------------- |
| name          | string        | Name of the param                  |
| required      | boolean       | Indicates if the param is requried |
| description   | string        | Description of the param           |
| ...params     | `Param`[]     | List of params in the shape        |

#### Response methods in the callback  
**send204()** Sets 204 http code and sends empty response.  
**send401(message = "Unauthorized request", code = "unauthorized_request")** Sets 401 http code and sends the Error instance.  
**send404(message = "Page not found", code = "page_not_found")** Sets 404 http code and sends the Error instance.   
**send501(message = "Not implemented", code = "not_implemented")** Sets 501 http code and sends Error instance.  
**addMeta(key, value)** Adds custom meta key and value for current request.  
**sendData(data)** Sends the data to the *options.dataKey* in response. DEPRECATED: You should use the callback in http methods  
**sendError(code = options.defaultError.statusCode, message = options.defaultError.message, errorCode = options.defaultError.code)** Sets the code as http code and sends the Error instance.  

#### Reserved GET parameters
This parameters are updating behaviour of the current request.  
**nometa** If meta is enabled in config this parameter will disable it.  
**pretty** JSON response is printed for human reading.  

## Time out
If timeout option (global or endpoint) is set the execution process is killed in the first possible moment (some lifecycle methods are still called). If the timeout occured during the endpoint callback execution the execution is still in process but the event `timeout` is called to the `express.Request.on` method. 
```javascript
app.get(0, '/timeout', { timeout: 500 }, (req, res, next) => {
    const timeout = setTimeout(() => {
        // some stuff
        next();
    }, 1000);
    req.on('timeout', () => clearTimeout(timeout));
});
```
The above example will clear the timeout after the 500ms and 408 error is returned.

## Documentation
The module creates generic documentation by default. The documentation is on the `/docs` route (if it's not set in app options) as a JSON data. `/docs.html` contains simple HTML which converts the JSON data to HTML and adds the test console. 

## Recommendations
- Do not use `Type.shape` in args, params and fields definition. It'll be documented as shape string from the [runtime-type](https://www.npmjs.com/package/runtime-type) module.
- Do not use `Type.any` in args, params and fields definition. Any type is not validated as a type so it can be anything.
- Use `HttpError` for errors sent to the endpoint callback.

## Support modules
### [resting-squirrel-dto](https://www.npmjs.com/package/resting-squirrel-dto)
Module to define DTOs to simply define documentation.
### [resting-squirrel-controller](https://www.npmjs.com/package/resting-squirrel-controller)
Module to use class controllers to define endpoints.

## TODO
- shape fields required status
- custom warning of the endpoint
- non-array response definition
- handle Param and Field classes for typescript
- 410 error code after the deprecation if needed
- finish all requests before stop
- shapes with generic keys -> [key: string]: string
### v3
- TypeScript source code
- remove auth option in the docs
- remove POST api key support
- remove headers api key support
- remove function arguments support in http methods.
- remove after and before options
- send access token to the auth.validator instead of key
- change auth default key to authorization

## Thanks
- [richardszemerei](https://github.com/richardszemerei) for CSS consultations.