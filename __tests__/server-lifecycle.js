/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import { expect } from 'chai';
import request from 'request';

import rs from '../src';

describe('Endpoint lifecycle', function () {
    const app = rs({
        log: false,
        port: 8081,
        auth(req, res, next) {
            req.lifecycle.auth = true;
            if (!req.headers['x-token']) { return res.send401(); }
            return next();
        },
        before: {
            '*': (req, res, next) => {
                req.lifecycle.before = true;
                return next();
            },
            '/param/*param': (req, res, next) => {
                req.lifecycle.before_custom = true;
                return next();
            },
            '/model/*modelData': (req, res, next) => {
                if (req.route.path.indexOf('/model/:id') < 0) { return next(); }
                req.lifecycle.before_custom = true;
                return next();
            }
        },
        after: {
            '/param/*param': (isError, data, req, res, next) => {
                req.lifecycle.after_custom = true;
                return next();
            },
            '*': (isError, data, req, res, next) => {
                req.lifecycle.after = true;
                res.header('lifecycle', JSON.stringify(req.lifecycle));
                return next();
            }
        }
    });
    // Force __meta key to the res for add meta data for counting callbacks
    app.use(function (req, res, next) {
        req.lifecycle = {
            auth: false,
            before: false,
            before_custom: false,
            after: false,
            after_custom: false
        };
        return next();
    });

    app.get('/', (req, res, next) => next(false, { success: true }));
    app.get('/auth', true, (req, res, next) => next(false, { success: true }));
    app.get('/204', (req, res, next) => next());
    app.get('/204/auth', true, (req, res, next) => next());
    app.get('/param/:param', true, (req, res, next) => next(false, { success: true }));
    app.get('/param/:param/param', true, (req, res, next) => next(false, { success: true }));
    app.get('/model/list', true, (req, res, next) => next(false, { success: true }));
    app.get('/model/:id', true, (req, res, next) => next(false, { success: true }));
    app.get('/model/:id/relation/:relationId', true, (req, res, next) => next(false, { success: true }));
    app.listen();

    it('calls all functions of the lifecycle on the not auth endpoint', done =>
        request.get({
            url: 'http://localhost:8081',
            gzip: true,
            json: true
        }
            , function (err, res, body) {
                expect(err).to.be.null;
                expect(body).to.have.all.keys(['data', '_meta']);
                expect(body.data).to.have.all.keys(['success']);
                const lifecycle = JSON.parse(res.headers.lifecycle);
                expect(lifecycle).to.be.an('object');
                expect(lifecycle).to.have.all.keys(['auth', 'before', 'before_custom', 'after', 'after_custom']);
                expect(lifecycle.auth).to.be.false;
                expect(lifecycle.before).to.be.true;
                expect(lifecycle.before_custom).to.be.false;
                expect(lifecycle.after).to.be.true;
                expect(lifecycle.after_custom).to.be.false;
                return done();
            })
    );

    it('calls all functions of the lifecycle on the auth endpoint', done =>
        request.get({
            url: 'http://localhost:8081/auth',
            gzip: true,
            json: true,
            headers: {
                'x-token': 'token'
            }
        }
            , function (err, res, body) {
                expect(err).to.be.null;
                expect(body).to.have.all.keys(['data', '_meta']);
                expect(body.data).to.have.all.keys(['success']);
                const lifecycle = JSON.parse(res.headers.lifecycle);
                expect(lifecycle).to.be.an('object');
                expect(lifecycle).to.have.all.keys(['auth', 'before', 'before_custom', 'after', 'after_custom']);
                expect(lifecycle.auth).to.be.true;
                expect(lifecycle.before).to.be.true;
                expect(lifecycle.before_custom).to.be.false;
                expect(lifecycle.after).to.be.true;
                expect(lifecycle.after_custom).to.be.false;
                return done();
            })
    );

    it('calls all functions of the lifecycle on the non existing endpoint', done =>
        request.get({
            url: 'http://localhost:8081/non-existing',
            gzip: true,
            json: true
        }
            , function (err, res, body) {
                expect(err).to.be.null;
                expect(body).to.have.all.keys(['error', '_meta']);
                expect(body.error).to.have.all.keys(['code', 'message']);
                expect(body.error.code).to.be.equal('ERR_PAGE_NOT_FOUND');
                const lifecycle = JSON.parse(res.headers.lifecycle);
                expect(lifecycle).to.be.an('object');
                expect(lifecycle).to.have.all.keys(['auth', 'before', 'before_custom', 'after', 'after_custom']);
                expect(lifecycle.auth).to.be.false;
                expect(lifecycle.before).to.be.false;
                expect(lifecycle.before_custom).to.be.false;
                expect(lifecycle.after).to.be.true;
                expect(lifecycle.after_custom).to.be.false;
                return done();
            })
    );

    it('calls all functions of the lifecycle on the auth endpoint without token to authorize', done =>
        request.get({
            url: 'http://localhost:8081/auth',
            gzip: true,
            json: true
        }
            , function (err, res, body) {
                expect(err).to.be.null;
                expect(body).to.have.all.keys(['error', '_meta']);
                expect(body.error).to.have.all.keys(['code', 'message']);
                expect(body.error.code).to.be.equal('ERR_MISSING_ACCESS_TOKEN');
                const lifecycle = JSON.parse(res.headers.lifecycle);
                expect(lifecycle).to.be.an('object');
                expect(lifecycle).to.have.all.keys(['auth', 'before', 'before_custom', 'after', 'after_custom']);
                expect(lifecycle.auth).to.be.false;
                expect(lifecycle.before).to.be.false;
                expect(lifecycle.before_custom).to.be.false;
                expect(lifecycle.after).to.be.true;
                expect(lifecycle.after_custom).to.be.false;
                return done();
            })
    );

    it('calls all functions of the lifecycle on the endpoint with 204 response code', done =>
        request.get({
            url: 'http://localhost:8081/204',
            gzip: true,
            json: true
        }
            , function (err, res, body) {
                expect(err).to.be.null;
                expect(body).to.be.undefined;
                const lifecycle = JSON.parse(res.headers.lifecycle);
                expect(lifecycle).to.be.an('object');
                expect(lifecycle).to.have.all.keys(['auth', 'before', 'before_custom', 'after', 'after_custom']);
                expect(lifecycle.auth).to.be.false;
                expect(lifecycle.before).to.be.true;
                expect(lifecycle.before_custom).to.be.false;
                expect(lifecycle.after).to.be.true;
                expect(lifecycle.after_custom).to.be.false;
                return done();
            })
    );

    it('calls all functions of the lifecycle on the auth endpoint with 204 response code', done =>
        request.get({
            url: 'http://localhost:8081/204/auth',
            gzip: true,
            json: true,
            headers: {
                'x-token': 'token'
            }
        }
            , function (err, res, body) {
                expect(err).to.be.null;
                expect(body).to.be.undefined;
                const lifecycle = JSON.parse(res.headers.lifecycle);
                expect(lifecycle).to.be.an('object');
                expect(lifecycle).to.have.all.keys(['auth', 'before', 'before_custom', 'after', 'after_custom']);
                expect(lifecycle.auth).to.be.true;
                expect(lifecycle.before).to.be.true;
                expect(lifecycle.before_custom).to.be.false;
                expect(lifecycle.after).to.be.true;
                expect(lifecycle.after_custom).to.be.false;
                return done();
            })
    );

    it('calls all functions of the lifecycle on the param endpoint', done =>
        request.get({
            url: 'http://localhost:8081/param/test',
            gzip: true,
            json: true,
            headers: {
                'x-token': 'token'
            }
        }
            , function (err, res, body) {
                expect(err).to.be.null;
                expect(body).to.have.all.keys(['data', '_meta']);
                expect(body.data).to.have.all.keys(['success']);
                const lifecycle = JSON.parse(res.headers.lifecycle);
                expect(lifecycle).to.be.an('object');
                expect(lifecycle).to.have.all.keys(['auth', 'before', 'before_custom', 'after', 'after_custom']);
                expect(lifecycle.auth).to.be.true;
                expect(lifecycle.before).to.be.true;
                expect(lifecycle.before_custom).to.be.true;
                expect(lifecycle.after).to.be.true;
                expect(lifecycle.after_custom).to.be.true;
                return done();
            })
    );

    it('calls all functions of the lifecycle on the param endpoint with another slash', done =>
        request.get({
            url: 'http://localhost:8081/param/test/param',
            gzip: true,
            json: true,
            headers: {
                'x-token': 'token'
            }
        }
            , function (err, res, body) {
                expect(err).to.be.null;
                expect(body).to.have.all.keys(['data', '_meta']);
                expect(body.data).to.have.all.keys(['success']);
                const lifecycle = JSON.parse(res.headers.lifecycle);
                expect(lifecycle).to.be.an('object');
                expect(lifecycle).to.have.all.keys(['auth', 'before', 'before_custom', 'after', 'after_custom']);
                expect(lifecycle.auth).to.be.true;
                expect(lifecycle.before).to.be.true;
                expect(lifecycle.before_custom).to.be.true;
                expect(lifecycle.after).to.be.true;
                expect(lifecycle.after_custom).to.be.true;
                return done();
            })
    );

    it('calls all functions of the lifecycle on the model endpoints', done =>
        request.get({
            url: 'http://localhost:8081/model/1',
            gzip: true,
            json: true,
            headers: {
                'x-token': 'token'
            }
        }
            , function (err, res, body) {
                expect(err).to.be.null;
                expect(body).to.have.all.keys(['data', '_meta']);
                expect(body.data).to.have.all.keys(['success']);
                const lifecycle = JSON.parse(res.headers.lifecycle);
                expect(lifecycle).to.be.an('object');
                expect(lifecycle).to.have.all.keys(['auth', 'before', 'before_custom', 'after', 'after_custom']);
                expect(lifecycle.auth).to.be.true;
                expect(lifecycle.before).to.be.true;
                expect(lifecycle.before_custom).to.be.true;
                expect(lifecycle.after).to.be.true;
                expect(lifecycle.after_custom).to.be.false;
                return done();
            })
    );

    it('calls all functions of the lifecycle on the model endpoints with relation', done =>
        request.get({
            url: 'http://localhost:8081/model/1/relation/1',
            gzip: true,
            json: true,
            headers: {
                'x-token': 'token'
            }
        }
            , function (err, res, body) {
                expect(err).to.be.null;
                expect(body).to.have.all.keys(['data', '_meta']);
                expect(body.data).to.have.all.keys(['success']);
                const lifecycle = JSON.parse(res.headers.lifecycle);
                expect(lifecycle).to.be.an('object');
                expect(lifecycle).to.have.all.keys(['auth', 'before', 'before_custom', 'after', 'after_custom']);
                expect(lifecycle.auth).to.be.true;
                expect(lifecycle.before).to.be.true;
                expect(lifecycle.before_custom).to.be.true;
                expect(lifecycle.after).to.be.true;
                expect(lifecycle.after_custom).to.be.false;
                return done();
            })
    );

    return it('calls all functions of the lifecycle on the model endpoints with non-id endpoint', done =>
        request.get({
            url: 'http://localhost:8081/model/list',
            gzip: true,
            json: true,
            headers: {
                'x-token': 'token'
            }
        }
            , function (err, res, body) {
                expect(err).to.be.null;
                expect(body).to.have.all.keys(['data', '_meta']);
                expect(body.data).to.have.all.keys(['success']);
                const lifecycle = JSON.parse(res.headers.lifecycle);
                expect(lifecycle).to.be.an('object');
                expect(lifecycle).to.have.all.keys(['auth', 'before', 'before_custom', 'after', 'after_custom']);
                expect(lifecycle.auth).to.be.true;
                expect(lifecycle.before).to.be.true;
                expect(lifecycle.before_custom).to.be.false;
                expect(lifecycle.after).to.be.true;
                expect(lifecycle.after_custom).to.be.false;
                return done();
            })
    );
});