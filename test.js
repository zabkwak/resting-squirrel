const RS = require('./');

const app = RS.default({
    name: 'RS DEV API',
    apiKey: {
        enabled: true,
    },
    logStack: false,
});

const { Field, Param, Type } = RS;

app.get(0, '/endpoint', {
    requireAuth: true,
    params: [
        new Param('integer', true, Type.integer, 'Integer param'),
    ],
    response: [
        new Field('integer', Type.integer, 'Integer field'),
    ],
    description: 'Test endpoint',
}, (req, res, next) => {
    next(null, req.query);
});

app.get(1, '/endpoint', {
    requireAuth: false,
    params: [
        new Param('integer', true, Type.integer, 'Integer param'),
    ],
    response: [
        new Field('integer', Type.integer, 'Integer field'),
    ],
    description: 'Test endpoint',
}, (req, res, next) => {
    next(null, req.query);
});

app.get(0, '/empty-params', {
    description: 'Endpoint with empty params',
    response: [
        new Field('success', Type.boolean),
    ],
}, (req, res, next) => next(null, { success: true }));

app.get(0, '/empty-response', {
    description: 'Endpoint with 204 response',
    response: null,
}, (req, res, next) => next());

app.post(0, '/post-data', {
    description: 'Validates the data and returns it.',
    params: [
        new Param('integer', true, Type.integer, 'Integer param'),
        new Param('float', true, Type.float, 'Float param'),
    ],
    response: [
        new Field('integer', Type.integer, 'Integer field'),
        new Field('float', Type.float, 'Float field'),
    ],
}, (req, res, next) => next(null, req.body));

app.get(0, '/args/:id', {
    description: 'Validates the arguments and returns it.',
    args: [
        new Field('id', Type.integer, 'Integer argument'),
    ],
    response: [
        new Field('id', Type.integer, 'Integer field'),
    ],
}, (req, res, next) => next(null, req.params));

app.get(0, '/response-shape', {
    description: 'Defines response as a Shape',
    response: [
        new Field('shape', Type.shape({ string: Type.string }), 'Field defined as Type.shape.'),
        new Field('shape_array', Type.arrayOf(Type.shape({ string: Type.string })), 'Array of shapes.'),
    ],
}, (req, res, next) => next(null, { shape: { string: 'test' }, shape_array: [{ string: 'string' }] }));

app.get(1, '/response-shape', {
    description: 'Defines response as a Field.Shape',
    response: [
        new Field.Shape(
            'shape',
            'Field defined as Field.Shape.',
            new Field('string', Type.string, 'String field as part of the shape.'),
            new Field('integer', Type.integer, 'Integer field as part of the shape.'),
            new Field.Shape('shape', 'Nested shape', new Field('string', Type.string, 'String field as part of the nested shape.')),
        ),
        new Field.ShapeArray('shape_array', 'Array of shapes defined as Field.ShapeArray.', new Field('string', Type.string, 'String field as part of the shape.')),
    ],
}, (req, res, next) => next(null, { shape: { string: 'test', integer: 5, shape: { string: 'string' } }, shape_array: [{ string: 'string' }] }));

app.post(0, '/param-shape', {
    description: 'Defines params as a Shape',
    params: [
        new Param('shape', true, Type.shape({ string: Type.string }), 'Field defined as Type.shape.'),
        new Param('shape_array', true, Type.arrayOf(Type.shape({ string: Type.string })), 'Array of shapes.'),
    ],
    response: null,
}, (req, res, next) => next());

app.post(1, '/param-shape', {
    description: 'Defines params as a Shape.',
    params: [
        new Param.Shape(
            'shape',
            true,
            'Field defined as Field.Shape.',
            new Param('string', true, Type.string, 'String field as part of the shape.'),
            new Field('integer', Type.integer, 'Integer field as part of the shape.'),
            new Param.Shape('shape', true, 'Nested shape', new Field('string', Type.string, 'String field as part of the nested shape.')),
        ),
        new Param.ShapeArray('shape_array', true, 'Array of shapes defined as Field.ShapeArray.', new Param('string', false, Type.string, 'String field as part of the shape.')),
    
    ],
    response: null,
}, (req, res, next) => next());

app.post(0, '/param-array', {
    description: 'Defines params as a array.',
    params: [
        new Param('array', true, Type.arrayOf(Type.integer), 'List of numbers'),
    ],
    response: null,
}, (req, res, next) => next());

app.get(0, '/some/fucking/long/endpoint/which/does/exactly/shit', {
    description: 'Well. The route is speaking for itself.',
    response: null,
    requireAuth: true,
}, (req, res, next) => next());

app.start();
