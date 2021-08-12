import { expect } from 'chai';
import HttpSmartError from 'http-smart-error';

import { RSError } from '../src';
import RSBaseError from '../src/error/base';

describe('RSError', () => {

	it('checks the error classes', () => {
		const classes = [
			'InvalidInputType',
			'InvalidArgumentType',
			'InvalidParameterType',
			'MissingParameter',
			'MissingApiKey',
			'InvalidApiKey',
			'MissingAccessToken',
			'InvalidAccessToken',
			'Timeout',
			'NotFound',
		];
		expect(RSError).to.have.all.keys(classes);
		for (const cls of classes) {
			if (cls === 'InvalidInputType') {
				continue;
			}
			expect(new RSError[cls]()).to.be.an.instanceOf(RSBaseError);
			expect(new RSError[cls]()).to.be.an.instanceOf(HttpSmartError);
		}
	});

	it('checks the default error', () => {
		const e = new RSError();
		expect(e).to.be.an.instanceOf(HttpSmartError);
		expect(e).to.have.all.keys(['statusCode', 'code', 'message']);
		expect(e.statusCode).to.be.equal(500);
		expect(e.message).to.be.equal('Internal Server Error');
		expect(e.code).to.be.equal('ERR_INTERNAL_SERVER_ERROR');
		expect(e.getDescription()).to.be.equal(null);
		const f = RSError.toErrorField();
		expect(f).to.have.all.keys(['code', 'description']);
		expect(f.code).to.be.equal(e.code);
		expect(f.description).to.be.equal(e.getDescription());
	});

	it('checks the default error with message and payload', () => {
		const e = new RSError('Test error', { test: 'test' });
		expect(e).to.be.an.instanceOf(HttpSmartError);
		expect(e).to.have.all.keys(['statusCode', 'code', 'message', 'test']);
		expect(e.statusCode).to.be.equal(500);
		expect(e.message).to.be.equal('Test error');
		expect(e.code).to.be.equal('ERR_INTERNAL_SERVER_ERROR');
		expect(e.getDescription()).to.be.equal(null);
		expect(e.test).to.be.equal('test');
		const f = RSError.toErrorField();
		expect(f).to.have.all.keys(['code', 'description']);
		expect(f.code).to.be.equal(e.code);
		expect(f.description).to.be.equal(e.getDescription());
	});

	it('checks the subclass of the RSError', () => {
		class BadRequestError extends RSError {
			
			_getStatusCode() {
				return HttpSmartError.BAD_REQUEST;
			}
		}
		const e = new BadRequestError();
		expect(e).to.be.an.instanceOf(HttpSmartError);
		expect(e).to.be.an.instanceOf(RSError);
		expect(e).to.have.all.keys(['statusCode', 'code', 'message']);
		expect(e.statusCode).to.be.equal(HttpSmartError.BAD_REQUEST);
		expect(e.message).to.be.equal('Bad Request');
		expect(e.code).to.be.equal('ERR_BAD_REQUEST');
		expect(e.getDescription()).to.be.equal(null);
		const f = BadRequestError.toErrorField();
		expect(f).to.have.all.keys(['code', 'description']);
		expect(f.code).to.be.equal(e.code);
		expect(f.description).to.be.equal(e.getDescription());
	});

	it('checks the subclass of the RSError with custom message and code', () => {
		class BadRequestError extends RSError {

			getDescription() {
				return 'Returned if something went wrong.';
			}
			
			_getStatusCode() {
				return HttpSmartError.BAD_REQUEST;
			}

			_getMessage() {
				return 'Custom message error';
			}

			_getCode() {
				return 'wrong_request';
			}
		}
		const e = new BadRequestError();
		expect(e).to.be.an.instanceOf(HttpSmartError);
		expect(e).to.be.an.instanceOf(RSError);
		expect(e).to.have.all.keys(['statusCode', 'code', 'message']);
		expect(e.statusCode).to.be.equal(HttpSmartError.BAD_REQUEST);
		expect(e.message).to.be.equal('Custom message error');
		expect(e.code).to.be.equal('ERR_WRONG_REQUEST');
		expect(e.getDescription()).to.be.equal('Returned if something went wrong.');
		const f = BadRequestError.toErrorField();
		expect(f).to.have.all.keys(['code', 'description']);
		expect(f.code).to.be.equal(e.code);
		expect(f.description).to.be.equal(e.getDescription());
	});
});
