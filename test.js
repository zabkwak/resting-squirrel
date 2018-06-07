const RS = require('./');

const app = RS.default();

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

app.start();