import { expect } from 'chai';

import rs from '../src';


describe('Base app creation', () => {

    it('checks if the app has default values', () => {
        const app = rs();
        expect(app._options).to.have.all.keys(['port', 'dataKey', 'errorKey', 'log', 'logStack', 'logger', 'meta', 'requestLimit', 'docs', 'auth', 'before', 'after', 'defaultError', 'validateParams', 'responseStrictValidation']);
        const { port, dataKey, errorKey, log, logStack, logger, meta, requestLimit, docs, auth, before, after, defaultError, validateParams, responseStrictValidation } = app._options;
        expect(port).to.be.equal(8080);
        expect(dataKey).to.be.equal('data');
        expect(errorKey).to.be.equal('error');
        expect(log).to.be.true;
        expect(logStack).to.be.true;
        expect(logger).to.be.a('function');
        expect(meta).to.be.an('object');
        expect(meta.enabled).to.be.true;
        expect(JSON.stringify(meta.data)).to.be.equal('{}');
        expect(requestLimit).to.be.equal('1mb');
        expect(docs).to.be.an('object');
        expect(docs.enabled).to.be.true;
        expect(docs.auth).to.be.false;
        expect(docs.route).to.be.equal('/docs');
        expect(auth).to.be.a('function');
        expect(before).to.be.an('object');
        expect(before['*']).to.be.a('function');
        expect(before).to.have.all.keys(['*']);
        expect(after).to.be.an('object');
        expect(after).to.have.all.keys(['*']);
        expect(after['*']).to.be.a('function');
        expect(defaultError).to.be.an('object');
        expect(defaultError.message).to.be.equal('Server error');
        expect(defaultError.code).to.be.equal('unknown');
        expect(defaultError.statusCode).to.be.equal(500);
        expect(validateParams).to.be.true;
    });

    it('checks if the custom options are properly set', () => {
        const app = rs({
            port: 9000,
            dataKey: '_data',
            errorKey: '_error',
            log: false,
            logStack: false,
            meta: {
                enabled: false,
            },
            requestLimit: '10mb',
            docs: {
                enabled: false,
                auth: true,
                route: '/_docs',
            },
            before: {
                '/test': () => { },
            },
            after: {
                '/test': () => { },
            },
            defaultError: {
                message: 'Some error',
                code: 'some',
                statusCode: 400
            },
            validateParams: false,
        });
        expect(app._options).to.have.all.keys(['port', 'dataKey', 'errorKey', 'log', 'logStack', 'logger', 'meta', 'requestLimit', 'docs', 'auth', 'before', 'after', 'defaultError', 'validateParams', 'responseStrictValidation']);
        const { port, dataKey, errorKey, log, logStack, logger, meta, requestLimit, docs, auth, before, after, defaultError, validateParams, responseStrictValidation } = app._options;
        expect(port).to.be.equal(9000);
        expect(dataKey).to.be.equal('_data');
        expect(errorKey).to.be.equal('_error');
        expect(log).to.be.false;
        expect(logStack).to.be.false;
        expect(logger).to.be.a('function');
        expect(meta).to.be.an('object');
        expect(meta.enabled).to.be.false;
        expect(JSON.stringify(meta.data)).to.be.equal('{}');
        expect(requestLimit).to.be.equal('10mb');
        expect(docs).to.be.an('object');
        expect(docs.enabled).to.be.false;
        expect(docs.auth).to.be.true;
        expect(docs.route).to.be.equal('/_docs');
        expect(auth).to.be.a('function');
        expect(before).to.be.an('object');
        expect(before).to.have.all.keys(['*', '/test']);
        expect(before['*']).to.be.a('function');
        expect(before['/test']).to.be.a('function');
        expect(after).to.be.an('object');
        expect(after).to.have.all.keys(['*', '/test']);
        expect(after['*']).to.be.a('function');
        expect(after['/test']).to.be.a('function');
        expect(defaultError).to.be.an('object');
        expect(defaultError.message).to.be.equal('Some error');
        expect(defaultError.code).to.be.equal('some');
        expect(defaultError.statusCode).to.be.equal(400);
        expect(validateParams).to.be.false;
    })
});