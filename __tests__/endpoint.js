import { expect } from 'chai';
import Type from 'runtime-type';

import Endpoint, { Param, Field } from '../src/endpoint';

import { ParamParser } from '../src/endpoint/param';

describe('Endpoint.Param', () => {

    it('checks the default values', () => {
        const param = new Param('test');
        expect(param).to.have.all.keys(['key', 'name', 'required', 'type', 'description']);
        const { name, key, required, type, description } = param;
        expect(name).to.be.equal('test');
        expect(key).to.be.equal('test');
        expect(required).to.be.false;
        expect(type).to.be.equal(Type.any);
        expect(description).to.be.null;
    });

    it('checks the set values', () => {
        const param = new Param('test', true, Type.integer, 'Some description');
        expect(param).to.have.all.keys(['key', 'name', 'required', 'type', 'description']);
        const { name, key, required, type, description } = param;
        expect(name).to.be.equal('test');
        expect(key).to.be.equal('test');
        expect(required).to.be.true;
        expect(type).to.be.equal(Type.integer);
        expect(description).to.be.equal('Some description');
    });

    it('sets the type as string', () => {
        const param = new Param('test', true, 'float');
        expect(param).to.have.all.keys(['key', 'name', 'required', 'type', 'description']);
        const { name, key, required, type, description } = param;
        expect(name).to.be.equal('test');
        expect(key).to.be.equal('test');
        expect(required).to.be.true;
        expect(type).to.be.equal(Type.float);
        expect(description).to.be.null;
    });

    it('tries to set invalid type', () => {
        expect(() => new Param('test', true, 'invalid-type')).to.throw(Error);
    });

    it('creates the param from the string', () => {
        const param = Param.create('test');
        expect(param).to.have.all.keys(['key', 'name', 'required', 'type', 'description']);
        const { name, key, required, type, description } = param;
        expect(name).to.be.equal('test');
        expect(key).to.be.equal('test');
        expect(required).to.be.true;
        expect(type).to.be.equal(Type.any);
        expect(description).to.be.null;
    });

    it('tries to create the param with dot notation', () => {
        expect(() => Param.create('test.test')).to.throw(Error).that.has.property('code', 'ERR_NO_SHAPE');
    });

    it('creates the param from field instance', () => {
        const field = new Field('id', Type.integer, "Identificator");
        const param = Param.createFromField(field, true);
        expect(param).to.have.all.keys(['key', 'name', 'required', 'type', 'description']);
        const { name, key, required, type, description } = param;
        expect(name).to.be.equal('id');
        expect(key).to.be.equal('id');
        expect(required).to.be.true;
        expect(type).to.be.equal(Type.integer);
        expect(description).to.be.equal('Identificator');
    });
});

describe('ParamParser', () => {

    it('parses the shape from the dot notations', () => {
        const params = ParamParser.parse(['test', 'test.test']);
        expect(params).to.be.an.instanceOf(Array);
        expect(params.length).to.be.equal(1);
        const [param] = params;
        const { name, key, required, type, description } = param;
        expect(name).to.be.equal('test');
        expect(key).to.be.equal('test');
        expect(required).to.be.true;
        expect(type.toString()).to.be.equal(Type.shape({ test: Type.any }).toString());
        expect(description).to.be.null;
    });
});

describe('Endpoint', () => {

    it('creates the endpoint with null response', () => {
        const endpoint = new Endpoint(null, { version: 0, requireAuth: false, params: [], response: null, description: null });
        expect(endpoint).to.have.all.keys(['version', 'requiredAuth', 'params', 'response', 'errors', 'description', 'hideDocs', 'callback', 'route', 'deprecated']);
        const { version, requiredAuth, params, response, errors, description, hideDocs, callback, route, deprecated } = endpoint;
        expect(version).to.be.equal(0);
        expect(requiredAuth).to.be.false;
        expect(params).to.be.an.instanceOf(Array);
        expect(params.length).to.be.equal(0);
        expect(errors).to.be.an.instanceOf(Array);
        expect(errors.length).to.be.equal(0);
        expect(response).to.be.null;
        expect(description).to.be.null;
        expect(hideDocs).to.be.false;
        expect(route).to.be.nul;
        expect(deprecated).to.be.false;
    });

    it('creates the endpoint with params defined on the old version of the module', () => {
        const endpoint = new Endpoint(null, {
            version: 0,
            params: ['brand', 'type', 'dimensions', 'dimensions.width', 'dimensions.height', 'dimensions.weight'],
            response: [],
            description: 'Creates new car record',
            hideDocs: true,
            callback: () => { },
        });
        expect(endpoint).to.have.all.keys(['version', 'requiredAuth', 'params', 'response', 'errors', 'description', 'hideDocs', 'callback', 'route', 'deprecated']);
        const { version, requiredAuth, params, response, errors, description, hideDocs, callback, route, deprecated } = endpoint;
        expect(version).to.be.equal(0);
        expect(requiredAuth).to.be.false;
        expect(params).to.be.an.instanceOf(Array);
        expect(params.length).to.be.equal(3);
        expect(response).to.be.an.instanceOf(Array);
        expect(response.length).to.be.equal(0);
        expect(errors).to.be.an.instanceOf(Array);
        expect(errors.length).to.be.equal(2);

        expect(description).to.be.equal('Creates new car record');
        expect(hideDocs).to.be.true;
        expect(callback).to.be.a('function');
        expect(route).to.be.null;
        expect(deprecated).to.be.false;

        const [brand, type, dimensions] = params;
        expect(brand).to.be.an.instanceOf(Param);
        expect(brand.name).to.be.equal('brand')
        expect(brand.type).to.be.equal(Type.any);
        expect(brand.required).to.be.true;
        expect(brand.description).to.be.null;

        expect(type).to.be.an.instanceOf(Param);
        expect(type.name).to.be.equal('type')
        expect(type.type).to.be.equal(Type.any);
        expect(type.required).to.be.true;
        expect(type.description).to.be.null;

        expect(dimensions).to.be.an.instanceOf(Param);
        expect(dimensions.name).to.be.equal('dimensions')
        expect(dimensions.type.toString()).to.be.equal(Type.shape({ width: Type.any, height: Type.any, weight: Type.any }).toString());
        expect(dimensions.required).to.be.true;
        expect(dimensions.description).to.be.null;
    });
});
