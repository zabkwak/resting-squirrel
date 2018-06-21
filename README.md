# Resting Squirrel

Simple REST server with json input data. It uses [express](https://www.npmjs.com/package/express) functions for register endpoints. Non-existing routes are automatically handled and return 404 status.

## Installation

```bash
$ npm install resting-squirrel
```

## Usage
```javascript
import rs, { Param, Type, Field, ErrorField } from 'resting-squirrel';

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
    requireAuth: true,
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
**meta** Object for setting up the behaviour of meta data. 
- **enabled** If true meta data are showed in every request. Default: true  
- **data** Custom meta data for the application. This data are set for all endpoints. Default: {}

**log** If true access log and error log are written in stdout. Default: true  
**logStack** If true and log is enabled the stack trace is written in stdout. This option should be false on the production app -> the request process is longer if the complete stack is printed to the console. Default: true  
**logger({ statusCode, method, path, spec, body, params, query, headers, took })** Custom logging function which is called before the request ends. Default function logs the data in the console like in previous versions.  
**docs** Object for setting up the documentation for the API.
- **enabled** If true docs are enabled on the *options.docs.endpoint* endpoint. Default: true  
- **endpoint** On this endpoint is shown documentation. Default: /docs  
- **auth** If true documentation request must be authorized with *options.auth* function. Default: false DEPRECATED Using api key is preffered option.  
- **paramsAsArray** If true params are returned as array in the docs. Default: false  

**auth(req, res, next)** Function to handle authorization. Default function checks if 'x-token' parameter is in headers.  
**apiKey** Object for setting up the api key.
- **enabled** If true api key is validated. Default: false  
- **type** Type of the location of api key in request. One of qs, body, header. Default: qs  
- **validator(apiKey, next)** Validator of api key.  

**before** Object of functions with key as a route spec. The functions `(req, res, next)` are called before the endpoint execution. Default object on all endpoints just calls next().  
**after(isError, data, req, res, next)** Object of functions with key as a route spec. The functions `(err, data, req, res, next)` are called after the endpoint execution. Default object on all endpoints just calls next().   
**defaultError** Default error for response if no error is defined  
- **statusCode** Default HTTP status code on error. Default: 500
- **message** Default error message. Default: Server error  
- **code** Default error code. Default: unknown  

**validateParams** If true the params are validated and the validator message is printed in stdout as warning if something is found. Default: true  
**responseStrictValidation** If true the Error is thrown if response key has invalid type. Default: false  

### Errors
Module has own Error class inherited from [Error](https://nodejs.org/api/errors.html#errors_class_error). Id adds code parameter to the error response. 
```javascript
import { Error } from 'resting-squirrel';

console.log(new Error("Some error", "some_code"));
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
**get(version, route, options = {}, callback)** Registers route on the GET method. options can be callback. Callback is taken from express.  
**post(version, route, options = {}, callback)** Registers route on the POST method. options can be callback. Callback is taken from express.  
**put(version, route, options = {}, callback)** Registers route on the PUT method. options can be callback. Callback is taken from express.  
**delete(version, route, options = {}, callback)** Registers route on the DELETE method. optionscan be callback. Callback is taken from express.  
**head(version, route, options = {}, callback)** Registers route on the HEAD method. options can be callback. Callback is taken from express.  
**listen(cb)** Starts listening on the port from options. DEPRECATED   
**start(cb)** Starts listening on the port from options.  

All http methods are using the same function for handling data. First parameter in the callback is error and second are data which are sent to the *options.dataKey* in the response.

#### Endpoint options
**requireAuth** If true the endpoint requires authorization.  
**description** Description of the endpoint.  
**args** List of `Field` instances to define endpoint arguments. If it's not defined all arguments defined in the route are of `any` type.  
**params** List of `Param` instances to define endpoint parameters.  
**response** List of `Field` instances to define endpoint response fields.  
**errors** List of `ErrorField` instances to define errors which could be returned during the execution.  
**hideDocs** If true the endpoint is hidden from the documentation.

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
rs.get(0, '/fields', {
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
rs.get(0, '/params', false, [p1, p2, p3], 'Test endpoint for param examples', (req, res, next) => next(null, req.query));
```
The `Param` class uses type definition from the [runtime-type](https://www.npmjs.com/package/runtime-type) for type checking. 

#### Response definition
The list of response fields in the http methods is array of `Field` instances. Response data sent to `next` function in endpoint callback are validated with type checking to render correct data-types.
```javascript
import rs, { Param, Field, Type } from 'resting-squirrel';

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
rs.get(0, '/fields', {
    response: [f1, f2, f3],
    description: 'Test endpoint for field examples',
}, (req, res, next) => next(null, doSomeStuff()));

```

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

## Documentation
The module creates generic documentation by default. The documentation is on the `/docs` route (if it's not set in app options) as a JSON data. `/docs.html` contains simple HTML which converts the JSON data to HTML and adds the test console. 

## TODO
- shape fields required status
- timeout option
- custom warning of the endpoint
- remove callback hell in start function
- filter endpoints by api key
- auth as object with function and description -> the description will be used in documentation.
- custom data to endpoint instance
- non-array response definition
- shape description in placeholder in doc console
- empty array of required params is passing the type params checking
- doc console shape fields
### v3
- remove auth option in the docs
- remove POST api key support
- remove function arguments support in http methods.