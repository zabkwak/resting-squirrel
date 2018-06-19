const RS = require('./');

const app = RS.default({
    name: 'RS DEV API',
    apiKey: {
        enabled: true,
    },
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

app.start();
