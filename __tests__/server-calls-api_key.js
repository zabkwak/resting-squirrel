import { expect } from 'chai';
import request from 'request';

import rs, { HttpError } from '../src';

describe('Api Key', () => {

    describe('Disabled api key', () => {

        const app = rs({ port: 8083, log: false, logStack: false, apiKey: { enabled: false } });

        app.get(0, '/api-key', (req, res, next) => next(null, req.query));

        app.start();

        it('calls the endpoint without an api key', (done) => {
            request.get({
                url: 'http://localhost:8083/0/api-key',
                gzip: true,
                json: true,
            }, (err, res, body) => {
                expect(err).to.be.null;
                expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
                expect(res.statusCode).to.equal(200);
                expect(body).to.have.all.keys(['data', '_meta']);
                const { data } = body;
                expect(data).to.deep.equal({});
                done();
            });
        });

        it('calls the endpoint with an api key', (done) => {
            request.get({
                url: 'http://localhost:8083/0/api-key',
                gzip: true,
                json: true,
                qs: { api_key: 'API_KEY' },
            }, (err, res, body) => {
                expect(err).to.be.null;
                expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
                expect(res.statusCode).to.equal(200);
                expect(body).to.have.all.keys(['data', '_meta']);
                const { data } = body;
                expect(data).to.deep.equal({ api_key: 'API_KEY' });
                done();
            });
        });
    });

    describe('Enabled api key with default validator', () => {

        const app = rs({ port: 8084, log: false, logStack: false, apiKey: { enabled: true } });

        app.get(0, '/api-key', (req, res, next) => next(null, req.query));

        app.start();

        it('calls the endpoint without an api key', (done) => {
            request.get({
                url: 'http://localhost:8084/0/api-key',
                gzip: true,
                json: true,
            }, (err, res, body) => {
                expect(err).to.be.null;
                expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
                expect(res.statusCode).to.equal(403);
                expect(body).to.have.all.keys(['error', '_meta']);
                const { error } = body;
                const { message, code } = error;
                expect(message).to.be.equal('Api key is missing.');
                expect(code).to.be.equal('ERR_MISSING_API_KEY');
                done();
            });
        });

        it('calls the endpoint with an api key', (done) => {
            request.get({
                url: 'http://localhost:8084/0/api-key',
                gzip: true,
                json: true,
                qs: { api_key: 'API_KEY' },
            }, (err, res, body) => {
                expect(err).to.be.null;
                expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
                expect(res.statusCode).to.equal(200);
                expect(body).to.have.all.keys(['data', '_meta']);
                const { data } = body;
                expect(data).to.deep.equal({ api_key: 'API_KEY' });
                done();
            });
        });

        it('calls non existing endpoint with an api key', (done) => {
            request.get({
                url: 'http://localhost:8084/404',
                gzip: true,
                json: true,
                qs: { api_key: 'API_KEY' },
            }, (err, res, body) => {
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

        it('calls non existing endpoint without an api key', (done) => {
            request.get({
                url: 'http://localhost:8084/404',
                gzip: true,
                json: true,
            }, (err, res, body) => {
                expect(err).to.be.null;
                expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
                expect(res.statusCode).to.equal(403);
                expect(body).to.have.all.keys(['error', '_meta']);
                const { error } = body;
                expect(error).to.have.all.keys(['message', 'code']);
                expect(error.message).to.be.equal('Api key is missing.');
                expect(error.code).to.be.equal('ERR_MISSING_API_KEY');
                done();
            });
        });
    });

    describe('Enabled api key in body with default validator', () => {

        const app = rs({ port: 8085, log: false, logStack: false, apiKey: { enabled: true, type: 'body' } });

        app.get(0, '/api-key', (req, res, next) => next(null, req.body));

        app.start();

        it('calls the endpoint without an api key', (done) => {
            request.get({
                url: 'http://localhost:8085/0/api-key',
                gzip: true,
                json: true,
            }, (err, res, body) => {
                expect(err).to.be.null;
                expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
                expect(res.statusCode).to.equal(403);
                expect(body).to.have.all.keys(['error', '_meta']);
                const { error } = body;
                const { message, code } = error;
                expect(message).to.be.equal('Api key is missing.');
                expect(code).to.be.equal('ERR_MISSING_API_KEY');
                done();
            });
        });

        it('calls the endpoint with an api key', (done) => {
            request.get({
                url: 'http://localhost:8085/0/api-key',
                gzip: true,
                json: true,
                body: { api_key: 'API_KEY' },
            }, (err, res, body) => {
                expect(err).to.be.null;
                expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
                expect(res.statusCode).to.equal(200);
                expect(body).to.have.all.keys(['data', '_meta']);
                const { data } = body;
                expect(data).to.deep.equal({ api_key: 'API_KEY' });
                done();
            });
        });
    });

    describe('Enabled api key in headers with default validator', () => {

        const app = rs({ port: 8086, log: false, logStack: false, apiKey: { enabled: true, type: 'header' } });

        app.get(0, '/api-key', (req, res, next) => next(null, { api_key: req.headers.api_key }));

        app.start();

        it('calls the endpoint without an api key', (done) => {
            request.get({
                url: 'http://localhost:8086/0/api-key',
                gzip: true,
                json: true,
            }, (err, res, body) => {
                expect(err).to.be.null;
                expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
                expect(res.statusCode).to.equal(403);
                expect(body).to.have.all.keys(['error', '_meta']);
                const { error } = body;
                const { message, code } = error;
                expect(message).to.be.equal('Api key is missing.');
                expect(code).to.be.equal('ERR_MISSING_API_KEY');
                done();
            });
        });

        it('calls the endpoint with an api key', (done) => {
            request.get({
                url: 'http://localhost:8086/0/api-key',
                gzip: true,
                json: true,
                headers: { api_key: 'API_KEY' },
            }, (err, res, body) => {
                expect(err).to.be.null;
                expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
                expect(res.statusCode).to.equal(200);
                expect(body).to.have.all.keys(['data', '_meta']);
                const { data } = body;
                expect(data).to.deep.equal({ api_key: 'API_KEY' });
                done();
            });
        });
    });

    describe('Enabled api key with custom validator', () => {

        const app = rs({
            port: 8087,
            log: false,
            logStack: false,
            apiKey: {
                enabled: true,
                validator: (apiKey) => new Promise(resolve => resolve(apiKey === 'API_KEY')),
            },
        });

        app.get(0, '/api-key', (req, res, next) => next(null, req.query));

        app.get(0, '/api-key/ignore', { requireApiKey: false }, (req, res, next) => next());

        app.start();

        it('calls the endpoint without an api key', (done) => {
            request.get({
                url: 'http://localhost:8087/0/api-key',
                gzip: true,
                json: true,
            }, (err, res, body) => {
                expect(err).to.be.null;
                expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
                expect(res.statusCode).to.equal(403);
                expect(body).to.have.all.keys(['error', '_meta']);
                const { error } = body;
                const { message, code } = error;
                expect(message).to.be.equal('Api key is missing.');
                expect(code).to.be.equal('ERR_MISSING_API_KEY');
                done();
            });
        });

        it('calls the endpoint with invalid api key', (done) => {
            request.get({
                url: 'http://localhost:8087/0/api-key',
                gzip: true,
                json: true,
                qs: { api_key: 'INVALID_API_KEY' },
            }, (err, res, body) => {
                expect(err).to.be.null;
                expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
                expect(res.statusCode).to.equal(403);
                expect(body).to.have.all.keys(['error', '_meta']);
                const { error } = body;
                const { message, code } = error;
                expect(message).to.be.equal('Api key is invalid.');
                expect(code).to.be.equal('ERR_INVALID_API_KEY');
                done();
            });
        });

        it('calls the endpoint with an api key', (done) => {
            request.get({
                url: 'http://localhost:8087/0/api-key',
                gzip: true,
                json: true,
                qs: { api_key: 'API_KEY' },
            }, (err, res, body) => {
                expect(err).to.be.null;
                expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
                expect(res.statusCode).to.equal(200);
                expect(body).to.have.all.keys(['data', '_meta']);
                const { data } = body;
                expect(data).to.deep.equal({ api_key: 'API_KEY' });
                done();
            });
        });

        it('calls the endpoint which does not require an api key', (done) => {
            request.get({
                url: 'http://localhost:8087/0/api-key/ignore',
                gzip: true,
                json: true,
            }, (err, res, body) => {
                expect(err).to.be.null;
                expect(res.statusCode).to.equal(204);
                done();
            });
        });
    });

    describe('Enabled api key with endpoint which have the api key excluded', () => {

        const app = rs({
            port: 8088,
            log: false,
            logStack: false,
            apiKey: {
                enabled: true,
            },
        });

        app.get(0, '/api-key/excluded/array', { excludedApiKeys: ['excluded'] }, (req, res, next) => next(null, req.query));
        app.get(0, '/api-key/excluded/promise', { excludedApiKeys: () => new Promise(resolve => resolve(['excluded'])) }, (req, res, next) => next(null, req.query));

        app.start();

        it('calls the excluded endpoint with valid api key', (done) => {
            request.get({
                url: 'http://localhost:8088/0/api-key/excluded/array',
                gzip: true,
                json: true,
                qs: { api_key: 'API_KEY' },
            }, (err, res, body) => {
                expect(err).to.be.null;
                expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
                expect(res.statusCode).to.equal(200);
                expect(body).to.have.all.keys(['data', '_meta']);
                const { data } = body;
                expect(data).to.deep.equal({ api_key: 'API_KEY' });
                done();
            });
        });

        it('calls the excluded endpoint with excluded api key', (done) => {
            request.get({
                url: 'http://localhost:8088/0/api-key/excluded/array',
                gzip: true,
                json: true,
                qs: { api_key: 'excluded' },
            }, (err, res, body) => {
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

        it('calls the excluded endpoint which is using function exclude with valid api key', (done) => {
            request.get({
                url: 'http://localhost:8088/0/api-key/excluded/promise',
                gzip: true,
                json: true,
                qs: { api_key: 'API_KEY' },
            }, (err, res, body) => {
                expect(err).to.be.null;
                expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
                expect(res.statusCode).to.equal(200);
                expect(body).to.have.all.keys(['data', '_meta']);
                const { data } = body;
                expect(data).to.deep.equal({ api_key: 'API_KEY' });
                done();
            });
        });

        it('calls the excluded endpoint which is using function exclude with excluded api key', (done) => {
            request.get({
                url: 'http://localhost:8088/0/api-key/excluded/promise',
                gzip: true,
                json: true,
                qs: { api_key: 'excluded' },
            }, (err, res, body) => {
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

        it('calls the docs endpoint with valid api key', (done) => {
            request.get({
                url: 'http://localhost:8088/docs',
                gzip: true,
                json: true,
                qs: { api_key: 'API_KEY' },
            }, (err, res, body) => {
                expect(err).to.be.null;
                expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
                expect(res.statusCode).to.equal(200);
                expect(body).to.have.all.keys(['data', '_meta']);
                const { data } = body;
                expect(data).to.have.all.keys([
                    'GET /0/api-key/excluded/array',
                    'GET /0/api-key/excluded/promise',
                ]);
                done();
            });
        });

        it('calls the docs endpoint with excluded api key', (done) => {
            request.get({
                url: 'http://localhost:8088/docs',
                gzip: true,
                json: true,
                qs: { api_key: 'excluded' },
            }, (err, res, body) => {
                expect(err).to.be.null;
                expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
                expect(res.statusCode).to.equal(200);
                expect(body).to.have.all.keys(['data', '_meta']);
                const { data } = body;
                expect(data).to.be.deep.equal({});
                done();
            });
        });
    });
});
