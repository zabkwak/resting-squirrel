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
            port: 8087, log: false, logStack: false, apiKey: {
                enabled: true,
                validator: (apiKey, next) => {
                    if (apiKey !== 'API_KEY') {
                        next(HttpError.create(403, 'Api key is invalid.', 'invalid_api_key'));
                        return;
                    }
                    next();
                }
            }
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

});
