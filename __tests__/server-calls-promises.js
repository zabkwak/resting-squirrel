import { expect } from 'chai';
import request from 'request';

import rs, { Param, Type, Error, Field, HttpError } from '../src';

const app = rs({ port: 8090, log: false, logStack: false });

class C {

    constructor(id) {
        this.id = id;
    }

    async get(cb = null) {
        if (typeof cb === 'function') {
            console.warn('Using get method with callback is deprecated. Use async/await.');
            let item;
            try {
                item = await this.get();
            } catch (e) {
                cb(e);
                return;
            }
            cb(null, item);
            return;
        }
        return new Promise((resolve, reject) => {
            if (!this.id) {
                reject('No id specified');
                return;
            }
            resolve({ id: this.id });
        });
    }
}

app.get(0, '/:id', {
    args: [
        new Field('id', Type.integer),
    ],
    response: [
        new Field('id', Type.integer),
    ],
    errors: ['ERR_INTERNAL_SERVER_ERROR'],
}, (req, res, next) => {
    new C(req.params.id).get(next);
});

app.get(1, '/:id', {
    args: [
        new Field('id', Type.integer),
    ],
    response: [
        new Field('id', Type.integer),
    ],
    errors: ['ERR_INTERNAL_SERVER_ERROR'],
}, async (req, res, next) => {
    next(null, await new C(req.params.id).get());
});

describe('Promises', () => {

    describe('Server start', () => {

        it('starts the server', (done) => {
            app.start((err) => {
                expect(err).to.be.undefined;
                done();
            });
        });
    });

    describe('GET /0/id', () => {

        it('calls the endpoint with valid id with a callback function', (done) => {
            request.get({
                url: 'http://localhost:8090/0/1',
                gzip: true,
                json: true,
            }, (err, res, body) => {
                expect(err).to.be.null;
                expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
                expect(res.statusCode).to.equal(200);
                expect(body).to.have.all.keys(['data', '_meta', 'warning']);
                const { data } = body;
                expect(data).to.have.all.keys(['id']);
                expect(data.id).to.be.equal(1);
                done();
            });
        });

        it('calls the endpoint with 0 id with a callback function', (done) => {
            request.get({
                url: 'http://localhost:8090/0/0',
                gzip: true,
                json: true,
            }, (err, res, body) => {
                expect(err).to.be.null;
                expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
                expect(res.statusCode).to.equal(500);
                expect(body).to.have.all.keys(['error', '_meta', 'warning']);
                const { error } = body;
                expect(error).to.have.all.keys(['message', 'code']);
                expect(error.message).to.be.equal('No id specified');
                expect(error.code).to.be.equal('ERR_INTERNAL_SERVER_ERROR');
                done();
            });
        });

        it('calls the endpoint with valid id with async/await', (done) => {
            request.get({
                url: 'http://localhost:8090/1/1',
                gzip: true,
                json: true,
            }, (err, res, body) => {
                expect(err).to.be.null;
                expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
                expect(res.statusCode).to.equal(200);
                expect(body).to.have.all.keys(['data', '_meta']);
                const { data } = body;
                expect(data).to.have.all.keys(['id']);
                expect(data.id).to.be.equal(1);
                done();
            });
        });

        it('calls the endpoint with 0 id with async/await', (done) => {
            request.get({
                url: 'http://localhost:8090/1/0',
                gzip: true,
                json: true,
            }, (err, res, body) => {
                expect(err).to.be.null;
                expect(res.headers["content-type"]).to.be.equal('application/json; charset=utf-8');
                expect(res.statusCode).to.equal(500);
                expect(body).to.have.all.keys(['error', '_meta']);
                const { error } = body;
                expect(error).to.have.all.keys(['message', 'code']);
                expect(error.message).to.be.equal('No id specified');
                expect(error.code).to.be.equal('ERR_INTERNAL_SERVER_ERROR');
                done();
            });
        });
    });
});