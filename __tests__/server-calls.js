import { expect } from 'chai';
import request from 'request';

import rs, { Param, Type, Error } from '../src';

const app = rs({ log: false, logStack: false });

app.get('/', (req, res, next) => next(null, { success: true }));

app.get('/auth', true, (req, res, next) => next(null, { success: true }));

app.get('/params', false, [new Param('param', true, Type.any)], (req, res, next) => next(null, { success: true }));

app.get('/params/type', false, [new Param('param', true, Type.integer)], (req, res, next) => next(null, { success: true }));

app.get('/params/back', false, ['param'], (req, res, next) => next(null, { success: true }));

app.post('/params', false, [new Param('param', true, Type.any)], (req, res, next) => next(null, { success: true }));

app.post('/params/type', false, [new Param('param', true, Type.integer)], (req, res, next) => next(null, { success: true }));

app.post('/params/back', false, ['param'], (req, res, next) => next(null, { success: true }));

app.get('/204', (req, res, next) => next());

app.get('/error/custom', (req, res, next) => next(new Error('Custom error', 'test', { field: 'test' })));

describe('Server start', () => {

    it('starts the server', (done) => {
        app.start((err) => {
            expect(err).to.be.undefined;
            done();
        });
    });
})

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
            expect(error.message).to.be.equal('Unauthorized');
            expect(error.code).to.be.equal('ERR_UNAUTHORIZED');
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
            expect(error).to.have.all.keys(['message', 'code']);
            expect(error.message).to.be.equal('Parameter \'param\' has invalid type. It should be \'integer\'.');
            expect(error.code).to.be.equal('ERR_INVALID_TYPE');
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
            expect(error).to.have.all.keys(['message', 'code']);
            expect(error.message).to.be.equal('Parameter \'param\' has invalid type. It should be \'integer\'.');
            expect(error.code).to.be.equal('ERR_INVALID_TYPE');
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
});