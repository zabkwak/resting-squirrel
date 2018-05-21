import { expect } from 'chai';

import rs from '../src';

const app = rs({ port: 8082, log: false, logStack: false });

describe('Endpoint versions', () => {

    it('creates the endpoints with different versions', () => {
        const v1 = app.get(1, '/', (req, res, next) => next());
        expect(v1.isDeprecated()).to.be.false;

        const v2 = app.get(2, '/', (req, res, next) => next());
        expect(v2.isDeprecated()).to.be.false;

        expect(v1.isDeprecated()).to.be.true;
    });
});