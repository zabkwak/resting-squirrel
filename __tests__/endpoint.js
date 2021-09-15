import { expect } from 'chai';
import Type from 'runtime-type';
import '@babel/polyfill';

import Endpoint, { Param, Field } from '../src/endpoint';

import { ParamParser } from '../src/endpoint/param';

const ENDPOINT_FIELDS = [
	'version',
	'auth',
	'params',
	'response',
	'errors',
	'description',
	'hideDocs',
	'callback',
	'route',
	'deprecated',
	'apiKeyEnabled',
	'excludedApiKeys',
	'timeout',
	'props',
	'args',
	'redirect',
];

describe('Endpoind.Field', () => {

	describe('.Shape', () => {

		it('checks the Field.Shape without a description', () => {
			const shape = new Field.Shape('shape', new Field('string', Type.string), new Field('integer', Type.integer));
			expect(shape).to.have.all.keys(['name', 'fields', 'type', 'description']);
			const { name, fields, type, description } = shape;
			expect(name).to.be.equal('shape');
			expect(description).to.be.null;
			expect(fields).to.be.an.instanceOf(Array);
			expect(fields.length).to.be.equal(2);
			expect(type).to.be.an.instanceOf(Type.Type);
			expect(type.toString()).to.be.equal(`shape(${JSON.stringify({ string: 'string', integer: 'integer' })})`);
			const json = shape.toJSON();
			expect(json).to.have.all.keys(['name', 'description', 'shape', 'type']);
			expect(json).to.deep.equal({
				name: 'shape',
				description: null,
				shape: {
					string: {
						name: 'string',
						key: 'string',
						type: Type.string,
						description: null,
					},
					integer: {
						name: 'integer',
						key: 'integer',
						type: Type.integer,
						description: null,
					},
				},
				type: shape.type.toString(),
			});
		});

		it('checks the Field.Shape with a description', () => {
			const shape = new Field.Shape('shape', 'Description', new Field('string', Type.string, 'String field in the shape.'), new Field('integer', Type.integer));
			expect(shape).to.have.all.keys(['name', 'fields', 'type', 'description']);
			const { name, fields, type, description } = shape;
			expect(name).to.be.equal('shape');
			expect(description).to.be.equal('Description');
			expect(fields).to.be.an.instanceOf(Array);
			expect(fields.length).to.be.equal(2);
			expect(type).to.be.an.instanceOf(Type.Type);
			expect(type.toString()).to.be.equal(`shape(${JSON.stringify({ string: 'string', integer: 'integer' })})`);
			const json = shape.toJSON();
			expect(json).to.have.all.keys(['name', 'description', 'shape', 'type']);
			expect(json).to.deep.equal({
				name: 'shape',
				description: 'Description',
				shape: {
					string: {
						name: 'string',
						key: 'string',
						type: Type.string,
						description: 'String field in the shape.',
					},
					integer: {
						name: 'integer',
						key: 'integer',
						type: Type.integer,
						description: null,
					},
				},
				type: shape.type.toString(),
			});
		});
	});

	describe('.ShapeArray', () => {

		it('checks the Field.ShapeArray without a description', () => {
			const shapeArray = new Field.ShapeArray('shape-array', new Field('string', Type.string), new Field('integer', Type.integer));
			expect(shapeArray).to.have.all.keys(['name', 'description', 'type', 'shape']);
			const { name, description, type, shape } = shapeArray;
			expect(name).to.be.equal('shape-array');
			expect(description).to.be.null;
			expect(type).to.be.an.instanceOf(Type.Type);
			expect(type.toString()).to.be.equal(`shape(${JSON.stringify({ string: 'string', integer: 'integer' })})[]`);
			const json = shapeArray.toJSON();
			expect(json).to.have.all.keys(['name', 'description', 'shape_array', 'type']);
			expect(json).to.deep.equal({
				name: 'shape-array',
				description: null,
				shape_array: {
					string: {
						name: 'string',
						key: 'string',
						type: Type.string,
						description: null,
					},
					integer: {
						name: 'integer',
						key: 'integer',
						type: Type.integer,
						description: null,
					},
				},
				type: shapeArray.type.toString(),
			});
		});

		it('checks the Field.ShapeArray with a description', () => {
			const shapeArray = new Field.ShapeArray('shape-array', 'Description', new Field('string', Type.string, 'String field in the shape.'), new Field('integer', Type.integer));
			expect(shapeArray).to.have.all.keys(['name', 'description', 'type', 'shape']);
			const { name, description, type, shape } = shapeArray;
			expect(name).to.be.equal('shape-array');
			expect(description).to.be.equal('Description');
			expect(shape).to.be.an.instanceOf(Field.Shape);
			expect(type).to.be.an.instanceOf(Type.Type);
			expect(type.toString()).to.be.equal(`shape(${JSON.stringify({ string: 'string', integer: 'integer' })})[]`);
			const json = shapeArray.toJSON();
			expect(json).to.have.all.keys(['name', 'description', 'shape_array', 'type']);
			expect(json).to.deep.equal({
				name: 'shape-array',
				description: 'Description',
				shape_array: {
					string: {
						name: 'string',
						key: 'string',
						type: Type.string,
						description: 'String field in the shape.',
					},
					integer: {
						name: 'integer',
						key: 'integer',
						type: Type.integer,
						description: null,
					},
				},
				type: shapeArray.type.toString(),
			});
		});
	});

});

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

	describe('.Shape', () => {

		it('checks the Param.Shape with a description', () => {
			const shape = new Param.Shape(
				'shape',
				true,
				'Description',
				new Param('string', true, Type.string, 'String field in the shape.'),
				new Param('integer', false, Type.integer),
			);
			expect(shape).to.have.all.keys(['name', 'fields', 'type', 'description', 'required']);
			const { name, fields, type, description, required } = shape;
			expect(name).to.be.equal('shape');
			expect(description).to.be.equal('Description');
			expect(required).to.be.true;
			expect(fields).to.be.an.instanceOf(Array);
			expect(fields.length).to.be.equal(2);
			expect(type).to.be.an.instanceOf(Type.Type);
			expect(type.toString()).to.be.equal(`shape(${JSON.stringify({ string: 'string', 'integer?': 'integer' })})`);
			const json = shape.toJSON();
			expect(json).to.have.all.keys(['name', 'description', 'shape', 'required', 'type']);
			expect(json).to.deep.equal({
				name: 'shape',
				description: 'Description',
				required: true,
				shape: {
					string: {
						name: 'string',
						key: 'string',
						type: Type.string,
						description: 'String field in the shape.',
						required: true,
					},
					integer: {
						name: 'integer',
						key: 'integer',
						type: Type.integer,
						description: null,
						required: false,
					},
				},
				type: shape.type.toString(),
			});
		});
	});

	describe('.ShapeArray', () => {

		it('checks the Param.ShapeArray with a description', () => {
			const shapeArray = new Param.ShapeArray('shape-array', true, 'Description', new Field('string', Type.string, 'String field in the shape.'), new Field('integer', Type.integer));
			expect(shapeArray).to.have.all.keys(['name', 'description', 'type', 'shape', 'required']);
			const { name, description, type, shape, required } = shapeArray;
			expect(name).to.be.equal('shape-array');
			expect(description).to.be.equal('Description');
			expect(type).to.be.an.instanceOf(Type.Type);
			expect(shape).to.be.an.instanceOf(Field.Shape);
			expect(required).to.be.true;
			expect(type.toString()).to.be.equal(`shape(${JSON.stringify({ string: 'string', integer: 'integer' })})[]`);
			const json = shapeArray.toJSON();
			expect(json).to.have.all.keys(['name', 'description', 'shape_array', 'required', 'type']);
			expect(json).to.deep.equal({
				name: 'shape-array',
				description: 'Description',
				required: true,
				shape_array: {
					string: {
						name: 'string',
						key: 'string',
						type: Type.string,
						description: 'String field in the shape.',
						required: true,
					},
					integer: {
						name: 'integer',
						key: 'integer',
						type: Type.integer,
						description: null,
						required: true,
					},
				},
				type: shapeArray.type.toString(),
			});
		});
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
		const endpoint = new Endpoint(null, { version: 0, auth: 0, params: [], response: null, description: null });
		expect(endpoint).to.have.all.keys(ENDPOINT_FIELDS);
		const { version, requiredAuth, params, response, errors, description, hideDocs, callback, route, deprecated, apiKeyEnabled, excludedApiKeys, timeout, props, args, redirect } = endpoint;
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
		expect(apiKeyEnabled).to.be.false;
		expect(excludedApiKeys).to.be.deep.equal([]);
		expect(timeout).to.be.null;
		expect(props).to.be.deep.equal({});
		expect(args).to.be.deep.equal([]);
		expect(endpoint.getAuth()).to.be.equal('DISABLED');
		expect(redirect).to.be.false;
		expect(endpoint.isRedirect()).to.be.false;
	});

	it('creates the endpoint with params defined on the old version of the module', () => {
		const endpoint = new Endpoint(null, {
			version: 0,
			params: ['brand', 'type', 'dimensions', 'dimensions.width', 'dimensions.height', 'dimensions.weight'],
			response: [],
			description: 'Creates new car record',
			hideDocs: true,
			callback: () => { },
			apiKeyEnabled: true,
			excludedApiKeys: ['test'],
			timeout: 15000,
			props: {
				test: 'test',
			},
			args: [new Field('arg', Type.string)],
			redirect: true,
		});
		expect(endpoint).to.have.all.keys(ENDPOINT_FIELDS);
		const { version, requiredAuth, params, response, errors, description, hideDocs, callback, route, deprecated, apiKeyEnabled, excludedApiKeys, timeout, props, args, redirect } = endpoint;
		expect(version).to.be.equal(0);
		expect(requiredAuth).to.be.false;
		expect(params).to.be.an.instanceOf(Array);
		expect(params.length).to.be.equal(3);
		expect(response).to.be.null;
		expect(errors).to.be.an.instanceOf(Array);
		expect(errors.length).to.be.equal(5);

		expect(description).to.be.equal('Creates new car record');
		expect(hideDocs).to.be.true;
		expect(callback).to.be.a('function');
		expect(route).to.be.null;
		expect(deprecated).to.be.false;
		expect(apiKeyEnabled).to.be.true;
		expect(excludedApiKeys).to.be.deep.equal(['test']);
		expect(timeout).to.be.equal(15000);
		expect(props).to.be.deep.equal({ test: 'test' });
		expect(redirect).to.be.true;
		expect(endpoint.isRedirect()).to.be.true;

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

		expect(args).to.an.instanceOf(Array);
		expect(args.length).to.be.equal(1);
		const [arg] = args;
		expect(arg).to.be.an.instanceOf(Field);
		expect(arg.name).to.be.equal('arg');
		expect(arg.type).to.be.equal(Type.string);
		expect(arg.description).to.be.null;
	});
});
