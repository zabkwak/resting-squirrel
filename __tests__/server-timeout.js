import { expect } from 'chai';
import request from 'request';

import rs, { HttpError } from '../src';

describe('App timeout', () => {

    it('starts the app', (done) => {
        const app = rs({ port: 8100, log: { enabled: false }, timeout: 500 });

        app.get(0, '/timeout', (req, res, next) => {
            const timeout = setTimeout(next, req.query.t);
            req.on('timeout', () => clearTimeout(timeout));
        });
        app.start(done);
    });

    it('calls the endpoint which times out', (done) => {
        request.get({
            url: 'http://localhost:8100/0/timeout?t=1000',
            gzip: true,
            json: true,
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.statusCode).to.be.equal(408);
            expect(body).to.have.all.keys(['error', '_meta']);
            expect(body.error).to.have.all.keys(['message', 'code']);
            const { message, code } = body.error;
            expect(message).to.be.equal('Request Timeout');
            expect(code).to.be.equal('ERR_REQUEST_TIMEOUT');
            done();
        });
    });

    it('calls the endpoint which executes', (done) => {
        request.get({
            url: 'http://localhost:8100/0/timeout?t=100',
            gzip: true,
            json: true,
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.statusCode).to.be.equal(204);
            done();
        });
    });
});

describe('Endpoint timeout', () => {

    it('starts the app', (done) => {
        const app = rs({ port: 8101, log: { enabled: false } });

        app.get(0, '/timeout', { timeout: 500 }, (req, res, next) => {
            const timeout = setTimeout(next, req.query.t);
            req.on('timeout', () => clearTimeout(timeout));
        });
        app.start(done);
    });

    it('calls the endpoint which times out', (done) => {
        request.get({
            url: 'http://localhost:8101/0/timeout?t=1000',
            gzip: true,
            json: true,
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.statusCode).to.be.equal(408);
            expect(body).to.have.all.keys(['error', '_meta']);
            expect(body.error).to.have.all.keys(['message', 'code']);
            const { message, code } = body.error;
            expect(message).to.be.equal('Request Timeout');
            expect(code).to.be.equal('ERR_REQUEST_TIMEOUT');
            done();
        });
    });

    it('calls the endpoint which executes', (done) => {
        request.get({
            url: 'http://localhost:8101/0/timeout?t=100',
            gzip: true,
            json: true,
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.statusCode).to.be.equal(204);
            done();
        });
    });
});