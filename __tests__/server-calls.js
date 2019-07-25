import { expect } from 'chai';
import request from 'request';

import rs, { Param, Type, Error, Field, HttpError, Response } from '../src';

const HTML_CONTENT = '<html><head></head><body><h1>TEST</h1></body></html>';

const app = rs({ log: false, logStack: false });

app.get('/', (req, res, next) => next(null, { success: true }));

app.get('/auth', true, (req, res, next) => next(null, { success: true }));

app.get('/params', false, [new Param('param', true, Type.any)], (req, res, next) => next(null, { success: true }));

app.get('/params/type', false, [new Param('param', true, Type.integer), new Param('date', false, Type.date)], (req, res, next) => next(null, { success: true }));

app.get('/params/back', false, ['param'], (req, res, next) => next(null, { success: true }));

app.get('/params/cast', false, [new Param('int', true, Type.integer), new Param('float', true, Type.float)], (req, res, next) => next(null, req.query));

app.post('/params', false, [new Param('param', true, Type.any)], (req, res, next) => next(null, { success: true }));

app.post('/params/type', false, [new Param('param', true, Type.integer), new Param('date', false, Type.date)], (req, res, next) => next(null, { success: true }));

app.post('/params/back', false, ['param'], (req, res, next) => next(null, { success: true }));

app.post('/params/cast', false, [new Param('int', true, Type.integer), new Param('float', true, Type.float)], (req, res, next) => next(null, req.body));

app.get('/204', (req, res, next) => next());

app.get('/error/custom', (req, res, next) => next(new Error('Custom error', 'test', { field: 'test' })));

app.get(0, '/error/throw', { hideDocs: true }, (req, res, next) => {
    throw HttpError.create(403);
});

app.get(1, '/version', (req, res, next) => next(null, { success: true }));

app.get(2, '/version', (req, res, next) => next(null, { success: true }));

app.get(0, '/options', {
    requireAuth: false,
    params: [new Param('param', true, Type.integer, 'Test integer parameter.')],
    response: [new Field('success', Type.boolean, 'Flag if the execution of the endpoint was successful.')],
    description: 'Endpoint with options.',
}, (req, res, next) => next(null, { success: 1 }));

app.get(0, '/options/null-response', {
    response: null,
}, (req, res, next) => next());

app.post(0, '/data-types', {
    params: [
        new Param('integer', false, Type.integer),
        new Param('float', false, Type.float),
        new Param('string', false, Type.string),
        new Param('array', false, Type.arrayOf(Type.integer)),
        new Param('date', false, Type.date),
        new Param('enum', false, Type.enum('a', 'a', 'b', 'c')),
        new Param('shape', false, Type.shape({
            integer: Type.integer,
        })),
    ],
}, (req, res, next) => next(null, req.body));

app.get(0, '/args/:id/not-defined', (req, res, next) => next(null, req.params));

app.get(0, '/args/:id/defined', {
    args: [
        new Field('id', Type.integer, 'Id of the argument.'),
    ],
}, (req, res, next) => next(null, req.params));

app.get(0, '/response/definition/with/null/data', {
    hideDocs: true,
    response: [
        new Field('id', Type.integer, 'Some identificator'),
    ],
}, (req, res, next) => next());

const asyncFunction = (error = false) => new Promise((resolve, reject) => {
    if (error) {
        reject(HttpError.create(400));
        return;
    }
    resolve();
});

app.get(0, '/promise', {
    hideDocs: true,
    params: [
        new Param('error', false, Type.boolean, 'Indicates if the promise should return array.'),
    ],
    response: null,
}, async (req, res, next) => {
    const { error } = req.query;
    await asyncFunction(error);
    next();
});

app.get(0, '/shape-array', {
    hideDocs: true,
    response: [
        new Field.ShapeArray('shape_array', 'Shape array.', new Field('id', Type.integer), new Field('number', Type.integer)),
    ],
}, (req, res, next) => next(null, { shape_array: [{ id: 1, number: 2, text: 'text' }] }));

app.get(0, '/html', {
    response: new Response.Custom('text/html'),
}, (req, res, next) => {
    next(null, HTML_CONTENT);
});

app.get(0, '/image', {
    response: new Response.Custom('image/png'),
}, (req, res, next) => {
    request.get('https://avatars1.githubusercontent.com/u/9919', { encoding: null }, (err, response, body) => {
        next(err, body);
    });
});

describe('Server start', () => {

    it('starts the server', (done) => {
        app.start((err) => {
            expect(err).to.be.undefined;
            done();
        });
    });
});

describe('Base calls', () => {

    it('calls the documentation endpoint', (done) => {
        request.get({ gzip: true, json: true, url: 'http://localhost:8080/docs' }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(200);
            expect(body).to.have.all.keys(['data', '_meta']);
            done();
        });
    });

    it('calls the base endpoint', (done) => {
        request.get({ gzip: true, json: true, url: 'http://localhost:8080' }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(200);
            expect(body).to.have.all.keys(['data', '_meta']);
            const { data } = body;
            expect(data).to.have.all.keys(['success']);
            expect(data.success).to.be.true;
            done();
        });
    });

    it('calls the base endpoint with nometa parameter', (done) => {
        request.get({ gzip: true, json: true, url: 'http://localhost:8080?nometa' }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(200);
            expect(body).to.have.all.keys(['data']);
            const { data } = body;
            expect(data).to.have.all.keys(['success']);
            expect(data.success).to.be.true;
            done();
        });
    });

    it('calls the non-existing endpoint', (done) => {
        request.get({ gzip: true, json: true, url: 'http://localhost:8080/non-existing' }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(404);
            expect(body).to.have.all.keys(['error', '_meta']);
            const { error } = body;
            expect(error).to.have.all.keys(['message', 'code']);
            expect(error.message).to.be.equal('Page not found');
            expect(error.code).to.be.equal('ERR_PAGE_NOT_FOUND');
            done();
        });
    });
});

describe('Authorization', () => {

    it('calls the endpoint which requires the authorization without the token', (done) => {
        request.get({ gzip: true, json: true, url: 'http://localhost:8080/auth' }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(401);
            expect(body).to.have.all.keys(['error', '_meta']);
            const { error } = body;
            expect(error).to.have.all.keys(['message', 'code']);
            expect(error.message).to.be.equal('The access token is missing.');
            expect(error.code).to.be.equal('ERR_MISSING_ACCESS_TOKEN');
            done();
        });
    });

    it('calls the endpoint which requires the authorization with the token', (done) => {
        request.get({ gzip: true, json: true, url: 'http://localhost:8080/auth', headers: { 'x-token': 'some-token' } }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(200);
            expect(body).to.have.all.keys(['data', '_meta']);
            const { data } = body;
            expect(data).to.have.all.keys(['success']);
            expect(data.success).to.be.true;
            done();
        });
    });
});

describe('Arguments validation', () => {

    it('calls the GET endpoint with not defined arguments with valid arguments', (done) => {
        request.get({
            url: 'http://localhost:8080/0/args/5/not-defined',
            gzip: true,
            json: true,
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(200);
            expect(body).to.have.all.keys(['data', '_meta']);
            const { data } = body;
            expect(data).to.have.all.keys(['id']);
            expect(data.id).to.be.equal('5');
            done();
        });
    });

    it('calls the GET endpoint with not defined arguments with valid arguments', (done) => {
        request.get({
            url: 'http://localhost:8080/0/args/string/not-defined',
            gzip: true,
            json: true,
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(200);
            expect(body).to.have.all.keys(['data', '_meta']);
            const { data } = body;
            expect(data).to.have.all.keys(['id']);
            expect(data.id).to.be.equal('string');
            done();
        });
    });

    it('calls the GET endpoint with valid arguments', (done) => {
        request.get({
            url: 'http://localhost:8080/0/args/5/defined',
            gzip: true,
            json: true,
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(200);
            expect(body).to.have.all.keys(['data', '_meta']);
            const { data } = body;
            expect(data).to.have.all.keys(['id']);
            expect(data.id).to.be.equal(5);
            done();
        });
    });

    it('calls the GET endpoint with arguments of invalid type', (done) => {
        request.get({
            url: 'http://localhost:8080/0/args/invalid/defined',
            gzip: true,
            json: true,
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(400);
            expect(body).to.have.all.keys(['error', '_meta']);
            const { error } = body;
            expect(error).to.have.all.keys(['message', 'code']);
            expect(error.message).to.be.equal('Argument \'id\' has invalid type. It should be \'integer\'.');
            expect(error.code).to.be.equal('ERR_INVALID_TYPE');
            done();
        });
    });
});

describe('GET parameter validation', () => {

    it('calls the GET endpoint with parameters', (done) => {
        request.get({
            url: 'http://localhost:8080/params',
            gzip: true,
            json: true,
            qs: { param: 1 },
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(200);
            expect(body).to.have.all.keys(['data', '_meta']);
            const { data } = body;
            expect(data).to.have.all.keys(['success']);
            expect(data.success).to.be.true;
            done();
        });
    });

    it('calls the GET endpoint with 0 value parameter', (done) => {
        request.get({
            url: 'http://localhost:8080/params',
            gzip: true,
            json: true,
            qs: { param: 0 },
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(200);
            expect(body).to.have.all.keys(['data', '_meta']);
            const { data } = body;
            expect(data).to.have.all.keys(['success']);
            expect(data.success).to.be.true;
            done();
        });
    });

    it('calls the GET endpoint without required parameter', (done) => {
        request.get({
            url: 'http://localhost:8080/params',
            gzip: true,
            json: true,
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(400);
            expect(body).to.have.all.keys(['error', '_meta']);
            const { error } = body;
            expect(error).to.have.all.keys(['message', 'code']);
            expect(error.message).to.be.equal('Parameter \'param\' is missing.');
            expect(error.code).to.be.equal('ERR_MISSING_PARAMETER');
            done();
        });
    });

    it('calls the GET endpoint with parameter of invalid type', (done) => {
        request.get({
            url: 'http://localhost:8080/params/type',
            gzip: true,
            json: true,
            qs: { param: 'test' },
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(400);
            expect(body).to.have.all.keys(['error', '_meta']);
            const { error } = body;
            expect(error).to.have.all.keys(['message', 'code', 'type_error']);
            expect(error.message).to.be.equal('Parameter \'param\' has invalid type. It should be \'integer\'.');
            expect(error.code).to.be.equal('ERR_INVALID_TYPE');
            done();
        });
    });

    it('calls the GET endpoint without an optional parameter of defined type', (done) => {
        request.get({
            url: 'http://localhost:8080/params/type',
            gzip: true,
            json: true,
            qs: { param: 1 },
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(200);
            expect(body).to.have.all.keys(['data', '_meta']);
            const { data } = body;
            expect(data).to.have.all.keys(['success']);
            expect(data.success).to.be.true;
            done();
        });
    });

    it('calls the GET endpoint with optional parameter of invalid type', (done) => {
        request.get({
            url: 'http://localhost:8080/params/type',
            gzip: true,
            json: true,
            qs: { param: 1, date: 'date' },
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(400);
            expect(body).to.have.all.keys(['error', '_meta']);
            const { error } = body;
            expect(error).to.have.all.keys(['message', 'code', 'type_error']);
            expect(error.message).to.be.equal('Parameter \'date\' has invalid type. It should be \'date\'.');
            expect(error.code).to.be.equal('ERR_INVALID_TYPE');
            done();
        });
    });

    it('calls the GET endpoint with optional parameter of correct type', (done) => {
        request.get({
            url: 'http://localhost:8080/params/type',
            gzip: true,
            json: true,
            qs: { param: 1, date: new Date() },
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(200);
            expect(body).to.have.all.keys(['data', '_meta']);
            const { data } = body;
            expect(data).to.have.all.keys(['success']);
            expect(data.success).to.be.true;
            done();
        });
    });

    it('calls the GET endpoint with parameters for back compatibility', (done) => {
        request.get({
            url: 'http://localhost:8080/params/back',
            gzip: true,
            json: true,
            qs: { param: 1 },
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(200);
            expect(body).to.have.all.keys(['data', '_meta']);
            const { data } = body;
            expect(data).to.have.all.keys(['success']);
            expect(data.success).to.be.true;
            done();
        });
    });

    it('calls the GET endpoint without required parameter for back compatibility', (done) => {
        request.get({
            url: 'http://localhost:8080/params/back',
            gzip: true,
            json: true,
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(400);
            expect(body).to.have.all.keys(['error', '_meta']);
            const { error } = body;
            expect(error).to.have.all.keys(['message', 'code']);
            expect(error.message).to.be.equal('Parameter \'param\' is missing.');
            expect(error.code).to.be.equal('ERR_MISSING_PARAMETER');
            done();
        });
    });

    it('calls the GET endpoint with params response', (done) => {
        request.get({
            url: 'http://localhost:8080/params/cast',
            gzip: true,
            json: true,
            qs: { int: 1, float: 1.1, not_defined_param: 'not defined' },
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(200);
            expect(body).to.have.all.keys(['data', '_meta']);
            const { data } = body;
            expect(data).to.have.all.keys(['int', 'float', 'not_defined_param']);
            expect(data.int).to.be.equal(1);
            expect(data.float).to.be.equal(1.1);
            expect(data.not_defined_param).to.be.equal('not defined');
            done();
        });
    });
});

describe('POST parameter validation', () => {

    it('calls the POST endpoint with parameters', (done) => {
        request.post({
            url: 'http://localhost:8080/params',
            gzip: true,
            json: true,
            body: { param: 1 },
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(200);
            expect(body).to.have.all.keys(['data', '_meta']);
            const { data } = body;
            expect(data).to.have.all.keys(['success']);
            expect(data.success).to.be.true;
            done();
        });
    });

    it('calls the POST endpoint with 0 value parameter', (done) => {
        request.post({
            url: 'http://localhost:8080/params',
            gzip: true,
            json: true,
            body: { param: 0 },
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(200);
            expect(body).to.have.all.keys(['data', '_meta']);
            const { data } = body;
            expect(data).to.have.all.keys(['success']);
            expect(data.success).to.be.true;
            done();
        });
    });

    it('calls the POST endpoint without required parameter', (done) => {
        request.post({
            url: 'http://localhost:8080/params',
            gzip: true,
            json: true,
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(400);
            expect(body).to.have.all.keys(['error', '_meta']);
            const { error } = body;
            expect(error).to.have.all.keys(['message', 'code']);
            expect(error.message).to.be.equal('Parameter \'param\' is missing.');
            expect(error.code).to.be.equal('ERR_MISSING_PARAMETER');
            done();
        });
    });

    it('calls the POST endpoint with parameter of invalid type', (done) => {
        request.post({
            url: 'http://localhost:8080/params/type',
            gzip: true,
            json: true,
            body: { param: 'test' },
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(400);
            expect(body).to.have.all.keys(['error', '_meta']);
            const { error } = body;
            expect(error).to.have.all.keys(['message', 'code', 'type_error']);
            expect(error.message).to.be.equal('Parameter \'param\' has invalid type. It should be \'integer\'.');
            expect(error.code).to.be.equal('ERR_INVALID_TYPE');
            done();
        });
    });

    it('calls the POST endpoint without an optional parameter of defined type', (done) => {
        request.post({
            url: 'http://localhost:8080/params/type',
            gzip: true,
            json: true,
            body: { param: 1 },
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(200);
            expect(body).to.have.all.keys(['data', '_meta']);
            const { data } = body;
            expect(data).to.have.all.keys(['success']);
            expect(data.success).to.be.true;
            done();
        });
    });

    it('calls the POST endpoint with optional parameter of invalid type', (done) => {
        request.post({
            url: 'http://localhost:8080/params/type',
            gzip: true,
            json: true,
            body: { param: 1, date: 'date' },
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(400);
            expect(body).to.have.all.keys(['error', '_meta']);
            const { error } = body;
            expect(error).to.have.all.keys(['message', 'code', 'type_error']);
            expect(error.message).to.be.equal('Parameter \'date\' has invalid type. It should be \'date\'.');
            expect(error.code).to.be.equal('ERR_INVALID_TYPE');
            done();
        });
    });

    it('calls the POST endpoint with optional parameter of correct type', (done) => {
        request.post({
            url: 'http://localhost:8080/params/type',
            gzip: true,
            json: true,
            body: { param: 1, date: new Date() },
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(200);
            expect(body).to.have.all.keys(['data', '_meta']);
            const { data } = body;
            expect(data).to.have.all.keys(['success']);
            expect(data.success).to.be.true;
            done();
        });
    });

    it('calls the POST endpoint with parameters for back compatibility', (done) => {
        request.post({
            url: 'http://localhost:8080/params/back',
            gzip: true,
            json: true,
            body: { param: 1 },
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(200);
            expect(body).to.have.all.keys(['data', '_meta']);
            const { data } = body;
            expect(data).to.have.all.keys(['success']);
            expect(data.success).to.be.true;
            done();
        });
    });

    it('calls the POST endpoint without required parameter for back compatibility', (done) => {
        request.post({
            url: 'http://localhost:8080/params/back',
            gzip: true,
            json: true,
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(400);
            expect(body).to.have.all.keys(['error', '_meta']);
            const { error } = body;
            expect(error).to.have.all.keys(['message', 'code']);
            expect(error.message).to.be.equal('Parameter \'param\' is missing.');
            expect(error.code).to.be.equal('ERR_MISSING_PARAMETER');
            done();
        });
    });

    it('calls the POST endpoint with params response', (done) => {
        request.post({
            url: 'http://localhost:8080/params/cast',
            gzip: true,
            json: true,
            body: { int: '1', float: '1.1', not_defined_param: 'not defined' },
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(200);
            expect(body).to.have.all.keys(['data', '_meta']);
            const { data } = body;
            expect(data).to.have.all.keys(['int', 'float', 'not_defined_param']);
            expect(data.int).to.be.equal(1);
            expect(data.float).to.be.equal(1.1);
            expect(data.not_defined_param).to.be.equal('not defined');
            done();
        });
    });
});

describe('Special responses', () => {

    it('calls the endpoint with 204 response code', (done) => {
        request.get({ gzip: true, json: true, url: 'http://localhost:8080/204' }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.undefined;
            expect(res.statusCode).to.equal(204);
            expect(body).to.be.undefined;
            done();
        });
    });

    it('calls the endpoint which will resolve a Promise', (done) => {
        request.get({ gzip: true, json: true, url: 'http://localhost:8080/0/promise' }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.undefined;
            expect(res.statusCode).to.equal(204);
            expect(body).to.be.undefined;
            done();
        });
    });

    it('calls the enpdoint which has defined response but the callback sends undefined data', (done) => {
        request.get({ gzip: true, json: true, url: 'http://localhost:8080/0/response/definition/with/null/data' }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.undefined;
            expect(res.statusCode).to.equal(204);
            expect(body).to.be.undefined;
            done();
        });
    });
});

describe('Endpoint defined with options', () => {

    it('calls the endpoint with defined response without required param', (done) => {
        request.get({ gzip: true, json: true, url: 'http://localhost:8080/0/options' }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers['content-type']).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(400);
            expect(body).to.have.all.keys(['error', '_meta']);
            const { error } = body;
            expect(error).to.have.all.keys(['message', 'code']);
            expect(error.message).to.be.equal('Parameter \'param\' is missing.');
            expect(error.code).to.be.equal('ERR_MISSING_PARAMETER');
            done();
        });
    });

    it('calls the endpoint with defined response with required param of invalid type', (done) => {
        request.get({ gzip: true, json: true, url: 'http://localhost:8080/0/options', qs: { param: 'test' } }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers['content-type']).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(400);
            expect(body).to.have.all.keys(['error', '_meta']);
            const { error } = body;
            expect(error).to.have.all.keys(['message', 'code', 'type_error']);
            expect(error.message).to.be.equal('Parameter \'param\' has invalid type. It should be \'integer\'.');
            expect(error.code).to.be.equal('ERR_INVALID_TYPE');
            done();
        });
    });

    it('calls the endpoint with defined response', (done) => {
        request.get({ gzip: true, json: true, url: 'http://localhost:8080/0/options', qs: { param: 1 } }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers['content-type']).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(200);
            expect(body).to.have.all.keys(['data', '_meta']);
            const { data } = body;
            expect(data).to.have.all.keys(['success']);
            expect(data.success).to.be.true;
            done();
        });
    });

    it('calls the endpoint with defined response as null', (done) => {
        request.get({ gzip: true, json: true, url: 'http://localhost:8080/0/options/null-response' }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.undefined;
            expect(res.statusCode).to.equal(204);
            expect(body).to.be.undefined;
            done();
        });
    });
});

describe('Data types validation', () => {

    it('calls the data-types endpoint with invalid integer value', (done) => {
        request.post({
            gzip: true,
            json: true,
            url: 'http://localhost:8080/0/data-types',
            body: {
                integer: 'test',
            },
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers['content-type']).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(400);
            expect(body).to.have.all.keys(['error', '_meta']);
            const { error } = body;
            expect(error).to.have.all.keys(['message', 'code', 'type_error']);
            expect(error.message).to.be.equal('Parameter \'integer\' has invalid type. It should be \'integer\'.');
            expect(error.code).to.be.equal('ERR_INVALID_TYPE');
            done();
        });
    });

    it('calls the data-types endpoint with invalid float value', (done) => {
        request.post({
            gzip: true,
            json: true,
            url: 'http://localhost:8080/0/data-types',
            body: {
                float: 'test',
            },
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers['content-type']).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(400);
            expect(body).to.have.all.keys(['error', '_meta']);
            const { error } = body;
            expect(error).to.have.all.keys(['message', 'code', 'type_error']);
            expect(error.message).to.be.equal('Parameter \'float\' has invalid type. It should be \'float\'.');
            expect(error.code).to.be.equal('ERR_INVALID_TYPE');
            done();
        });
    });

    it('calls the data-types endpoint with invalid array value', (done) => {
        request.post({
            gzip: true,
            json: true,
            url: 'http://localhost:8080/0/data-types',
            body: {
                array: ['test'],
            },
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers['content-type']).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(400);
            expect(body).to.have.all.keys(['error', '_meta']);
            const { error } = body;
            expect(error).to.have.all.keys(['message', 'code', 'type_error']);
            expect(error.message).to.be.equal('Parameter \'array\' has invalid type. It should be \'integer[]\'.');
            expect(error.code).to.be.equal('ERR_INVALID_TYPE');
            done();
        });
    });

    it('calls the data-types endpoint with invalid date value', (done) => {
        request.post({
            gzip: true,
            json: true,
            url: 'http://localhost:8080/0/data-types',
            body: {
                date: 'test',
            },
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers['content-type']).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(400);
            expect(body).to.have.all.keys(['error', '_meta']);
            const { error } = body;
            expect(error).to.have.all.keys(['message', 'code', 'type_error']);
            expect(error.message).to.be.equal('Parameter \'date\' has invalid type. It should be \'date\'.');
            expect(error.code).to.be.equal('ERR_INVALID_TYPE');
            done();
        });
    });

    it('calls the data-types endpoint with invalid enum value', (done) => {
        request.post({
            gzip: true,
            json: true,
            url: 'http://localhost:8080/0/data-types',
            body: {
                enum: 'test',
            },
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers['content-type']).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(400);
            expect(body).to.have.all.keys(['error', '_meta']);
            const { error } = body;
            expect(error).to.have.all.keys(['message', 'code', 'type_error']);
            expect(error.message).to.be.equal('Parameter \'enum\' has invalid type. It should be \'enum(\'a\',\'b\',\'c\')\'.');
            expect(error.code).to.be.equal('ERR_INVALID_TYPE');
            done();
        });
    });

    it('calls the data-types endpoint with shape as string', (done) => {
        request.post({
            gzip: true,
            json: true,
            url: 'http://localhost:8080/0/data-types',
            body: {
                shape: 'test',
            },
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers['content-type']).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(400);
            expect(body).to.have.all.keys(['error', '_meta']);
            const { error } = body;
            expect(error).to.have.all.keys(['message', 'code', 'type_error']);
            expect(error.message).to.be.equal('Parameter \'shape\' has invalid type. It should be \'shape({"integer":"integer"})\'.');
            expect(error.code).to.be.equal('ERR_INVALID_TYPE');
            done();
        });
    });

    it('calls the data-types endpoint with invalid shape value', (done) => {
        request.post({
            gzip: true,
            json: true,
            url: 'http://localhost:8080/0/data-types',
            body: {
                shape: { integer: 'test' },
            },
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers['content-type']).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(400);
            expect(body).to.have.all.keys(['error', '_meta']);
            const { error } = body;
            expect(error).to.have.all.keys(['message', 'code', 'type_error']);
            expect(error.message).to.be.equal('Parameter \'shape\' has invalid type. It should be \'shape({"integer":"integer"})\'.');
            expect(error.code).to.be.equal('ERR_INVALID_TYPE');
            done();
        });
    });

    it('calls the data-types endpoint with all valid parameters', (done) => {
        request.post({
            gzip: true,
            json: true,
            url: 'http://localhost:8080/0/data-types',
            body: {
                integer: 5,
                float: 5.5,
                string: 'string',
                array: [1, 2, 3, 4, 5],
                date: new Date('2018-06-01T00:00:00.000Z'),
                enum: 'a',
                shape: {
                    integer: 5,
                },
            }
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers['content-type']).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(200);
            expect(body).to.have.all.keys(['data', '_meta']);
            const { data } = body;
            expect(data).to.have.all.keys(['integer', 'float', 'string', 'array', 'date', 'enum', 'shape']);
            expect(data.integer).to.be.equal(5);
            expect(data.float).to.be.equal(5.5);
            expect(data.string).to.be.equal('string');
            expect(data.array).to.deep.equal([1, 2, 3, 4, 5]);
            expect(data.date).to.be.equal('2018-06-01T00:00:00.000Z');
            expect(data.enum).to.be.equal('a');
            expect(data.shape).to.deep.equal({ integer: 5 });
            done();
        });
    });
});

describe('Errors', () => {

    it('calls endpoint with custom error with payload', (done) => {
        request.get({ gzip: true, json: true, url: 'http://localhost:8080/error/custom' }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(500);
            expect(body).to.have.all.keys(['error', '_meta']);
            const { error } = body;
            expect(error).to.have.all.keys(['message', 'code', 'field']);
            expect(error.message).to.be.equal('Custom error');
            expect(error.code).to.be.equal('ERR_TEST');
            expect(error.field).to.be.equal('test');
            done();
        });
    });

    it('calls endpoint that rejects a Promise without try-catch', (done) => {
        request.get({ gzip: true, json: true, url: 'http://localhost:8080/0/promise', qs: { error: true } }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(400);
            expect(body).to.have.all.keys(['error', '_meta']);
            const { error } = body;
            expect(error).to.have.all.keys(['message', 'code']);
            expect(error.message).to.be.equal('Bad Request');
            expect(error.code).to.be.equal('ERR_BAD_REQUEST');
            done();
        });
    });

    it('calls endpoint that throws an error in callback', (done) => {
        request.get({ gzip: true, json: true, url: 'http://localhost:8080/0/error/throw' }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(403);
            expect(body).to.have.all.keys(['error', '_meta']);
            const { error } = body;
            expect(error).to.have.all.keys(['message', 'code']);
            expect(error.message).to.be.equal('Forbidden');
            expect(error.code).to.be.equal('ERR_FORBIDDEN');
            done();
        });
    });
});

describe('Responses', () => {

    it('calls the endpoint which sends field not defined in the shape array', (done) => {
        request.get({ gzip: true, json: true, url: 'http://localhost:8080/0/shape-array' }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(200);
            expect(body).to.have.all.keys(['data', '_meta']);
            const { data } = body;
            expect(data).to.have.all.keys(['shape_array']);
            const { shape_array } = data;
            expect(shape_array).to.be.an.instanceOf(Array);
            expect(shape_array.length).to.be.equal(1);
            const item = shape_array.shift();
            expect(item).to.have.all.keys(['id', 'number', 'text']);
            expect(item.id).to.be.equal(1);
            expect(item.number).to.be.equal(2);
            // expect(item.text).to.be.equal('text');
            done();
        });
    });

    describe('HTML', () => {

        it('calls the endpoint which sends html response', (done) => {
            request.get({ gzip: true, json: true, url: 'http://localhost:8080/0/html' }, (err, res, body) => {
                expect(err).to.be.null;
                expect(res.headers["content-type"]).to.be.equal('text/html; charset=utf-8');
                expect(res.statusCode).to.equal(200);
                expect(body).to.be.equal(HTML_CONTENT);
                done();
            });
        });
    });

    describe('Image', () => {

        it('calls the endpoint which sends image response', (done) => {
            request.get({ gzip: true, json: true, url: 'http://localhost:8080/0/image' }, (err, res, body) => {
                expect(err).to.be.null;
                expect(res.headers["content-type"]).to.be.equal('image/png');
                expect(res.statusCode).to.equal(200);
                done();
            });
        });
    });
});

describe('Docs', () => {

    const validateDocs = (doc, docs = null, args = [], params = [], errors = [], required_params = [], required_auth = false, response = [], deprecated = false) => {
        expect(doc).to.have.all.keys([
            'docs',
            'description',
            'args',
            'params',
            'required_params',
            'required_auth',
            'response',
            'response_type',
            'errors',
            'deprecated',
            'auth',
        ]);
        expect(doc.docs).to.be.equal(docs);
        expect(doc.docs).to.be.equal(doc.description);
        expect(doc.required_params).to.deep.equal(required_params);
        expect(doc.required_auth).to.be.equal(required_auth);
        expect(doc.deprecated).to.be.equal(deprecated);
        // Params validation
        let o = {};
        params.forEach(p => o[p.name] = p);
        expect(doc.params).to.deep.equal(o);
        // Response validation
        if (response) {
            o = {};
            response.forEach(p => o[p.name] = p);
        } else {
            o = null;
        }
        expect(doc.response).to.deep.equal(o);
        // Arguments validation
        o = {};
        args.forEach(p => o[p.name] = p);
        expect(doc.args).to.deep.equal(o);
        // Errors validation
        o = {};
        errors.forEach(p => o[p.code] = p.description);
        expect(doc.errors).to.deep.equal(o);
    }

    it('validates the docs data', (done) => {
        request.get({ gzip: true, json: true, url: 'http://localhost:8080/docs' }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
            expect(res.statusCode).to.equal(200);
            expect(body).to.have.all.keys(['data', '_meta']);
            const { data } = body;
            expect(data).to.have.all.keys([
                'GET /',
                'GET /auth',
                'GET /params',
                'GET /params/type',
                'GET /params/back',
                'GET /params/cast',
                'POST /params',
                'POST /params/type',
                'POST /params/back',
                'POST /params/cast',
                'GET /204',
                'GET /error/custom',
                'GET /1/version',
                'GET /2/version',
                'GET /0/options',
                'GET /0/options/null-response',
                'POST /0/data-types',
                'GET /0/args/:id/not-defined',
                'GET /0/args/:id/defined',
                'GET /0/html',
                'GET /0/image',
            ]);
            validateDocs(data['GET /']);
            validateDocs(data['GET /auth'], null, [], [], [
                { code: 'ERR_MISSING_ACCESS_TOKEN', description: 'Returned if header with access token is missing.' },
                { code: 'ERR_INVALID_ACCESS_TOKEN', description: 'Returned if header with access token is not valid.' },
            ], [], true);
            validateDocs(data['GET /params'], null, [], [{ name: 'param', description: null, key: 'param', required: true, type: 'any' }], [
                { code: 'ERR_MISSING_PARAMETER', description: 'Returned if one of the required parameters is not defined.' },
                { code: 'ERR_INVALID_TYPE', description: 'Returned if one of the parameters has invalid type.' },
            ], ['param']);
            validateDocs(data['GET /params/type'], null, [], [
                { name: 'param', description: null, key: 'param', required: true, type: 'integer' },
                { name: 'date', description: null, key: 'date', required: false, type: 'date' },
            ], [
                    { code: 'ERR_MISSING_PARAMETER', description: 'Returned if one of the required parameters is not defined.' },
                    { code: 'ERR_INVALID_TYPE', description: 'Returned if one of the parameters has invalid type.' },
                ], ['param']);
            validateDocs(data['GET /params/back'], null, [], [{ name: 'param', description: null, key: 'param', required: true, type: 'any' }], [
                { code: 'ERR_MISSING_PARAMETER', description: 'Returned if one of the required parameters is not defined.' },
                { code: 'ERR_INVALID_TYPE', description: 'Returned if one of the parameters has invalid type.' },
            ], ['param']);
            validateDocs(data['GET /params/cast'], null, [], [
                { name: 'int', description: null, key: 'int', required: true, type: 'integer' },
                { name: 'float', description: null, key: 'float', required: true, type: 'float' },
            ], [
                    { code: 'ERR_MISSING_PARAMETER', description: 'Returned if one of the required parameters is not defined.' },
                    { code: 'ERR_INVALID_TYPE', description: 'Returned if one of the parameters has invalid type.' },
                ], ['int', 'float']);
            validateDocs(data['POST /params'], null, [], [{ name: 'param', description: null, key: 'param', required: true, type: 'any' }], [
                { code: 'ERR_MISSING_PARAMETER', description: 'Returned if one of the required parameters is not defined.' },
                { code: 'ERR_INVALID_TYPE', description: 'Returned if one of the parameters has invalid type.' },
            ], ['param']);
            validateDocs(data['POST /params/type'], null, [], [
                { name: 'param', description: null, key: 'param', required: true, type: 'integer' },
                { name: 'date', description: null, key: 'date', required: false, type: 'date' },
            ], [
                    { code: 'ERR_MISSING_PARAMETER', description: 'Returned if one of the required parameters is not defined.' },
                    { code: 'ERR_INVALID_TYPE', description: 'Returned if one of the parameters has invalid type.' },
                ], ['param']);
            validateDocs(data['POST /params/back'], null, [], [{ name: 'param', description: null, key: 'param', required: true, type: 'any' }], [
                { code: 'ERR_MISSING_PARAMETER', description: 'Returned if one of the required parameters is not defined.' },
                { code: 'ERR_INVALID_TYPE', description: 'Returned if one of the parameters has invalid type.' },
            ], ['param']);
            validateDocs(data['POST /params/cast'], null, [], [
                { name: 'int', description: null, key: 'int', required: true, type: 'integer' },
                { name: 'float', description: null, key: 'float', required: true, type: 'float' },
            ], [
                    { code: 'ERR_MISSING_PARAMETER', description: 'Returned if one of the required parameters is not defined.' },
                    { code: 'ERR_INVALID_TYPE', description: 'Returned if one of the parameters has invalid type.' },
                ], ['int', 'float']);
            validateDocs(data['GET /204']);
            validateDocs(data['GET /error/custom']);
            validateDocs(data['GET /1/version'], null, [], [], [], [], false, [], true);
            validateDocs(data['GET /2/version']);
            validateDocs(
                data['GET /0/options'],
                'Endpoint with options.',
                [],
                [{ name: 'param', description: null, key: 'param', required: true, type: 'integer', description: 'Test integer parameter.' }],
                [
                    { code: 'ERR_MISSING_PARAMETER', description: 'Returned if one of the required parameters is not defined.' },
                    { code: 'ERR_INVALID_TYPE', description: 'Returned if one of the parameters has invalid type.' },
                ],
                ['param'],
                false,
                [{ name: 'success', key: 'success', type: 'boolean', description: 'Flag if the execution of the endpoint was successful.' }],
            );
            validateDocs(data['GET /0/options/null-response'], null, [], [], [], [], false, null);
            validateDocs(data['POST /0/data-types'], null, [], [
                { name: 'integer', description: null, key: 'integer', required: false, type: 'integer' },
                { name: 'float', description: null, key: 'float', required: false, type: 'float' },
                { name: 'string', description: null, key: 'string', required: false, type: 'string' },
                { name: 'array', description: null, key: 'array', required: false, type: 'integer[]' },
                { name: 'date', description: null, key: 'date', required: false, type: 'date' },
                { name: 'enum', description: null, key: 'enum', required: false, type: 'enum(\'a\',\'b\',\'c\')' },
                { name: 'shape', description: null, key: 'shape', required: false, type: 'shape({"integer":"integer"})' },
            ], [
                    { code: 'ERR_INVALID_TYPE', description: 'Returned if one of the parameters has invalid type.' },
                ]);
            validateDocs(data['GET /0/args/:id/not-defined'], null, [{ name: 'id', key: 'id', type: 'any', description: null }], [], [
                { code: 'ERR_INVALID_TYPE', description: 'Returned if one of the arguments has invalid type.' },
            ]);
            validateDocs(data['GET /0/args/:id/defined'], null, [{ name: 'id', key: 'id', type: 'integer', description: 'Id of the argument.' }], [], [
                { code: 'ERR_INVALID_TYPE', description: 'Returned if one of the arguments has invalid type.' },
            ]);
            validateDocs(data['GET /0/html']);
            validateDocs(data['GET /0/image']);
            expect(data['GET /docs']).to.be.undefined;
            expect(data['GET /docs.html']).to.be.undefined;
            expect(data['GET /docs.js']).to.be.undefined;
            expect(data['GET /docs.css']).to.be.undefined;
            done();
        });
    });
});

describe('Server stop', () => {

    it('stops the server', (done) => {
        app.stop(done);
    });

    it('checks if the server is not accessible via http request', (done) => {
        request.get({ gzip: true, json: true, url: 'http://localhost:8080/' }, (err) => {
            expect(err.code).to.be.equal('ECONNREFUSED');
            done();
        });
    });
});
