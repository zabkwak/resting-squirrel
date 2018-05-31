import Type from 'runtime-type';
import Error from 'smart-error';

import Field from './field';

class Param extends Field {

    static create(param) {
        if (typeof param === 'string') {
            if (param.indexOf('.') > 0) {
                throw new Error('Cannot create shape parameter', 'no_shape');
            }
            return new this(param, true, Type.any, null);
        }
        return new this(param.name, param.required, param.type, param.description);
    }

    /** @type {boolean} */
    required = false;

    /**
     * 
     * @param {string} name 
     * @param {boolean} required 
     * @param {Type.Type|string} type 
     * @param {string} description 
     */
    constructor(name, required = false, type = Type.any, description = null) {
        super(name, type, description);
        this.required = required;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            required: this.required,
        };
    }
}

class ParamParser {

    static parse(params) {
        return new this(params).parse();
    }

    params = [];
    _parsed = [];
    _shapeList = [];
    _shapes = {};

    constructor(params) {
        this.params = params;
    }

    parse() {
        this._findShapes();
        this.params.forEach((param) => {
            try {
                if (this._isShape(param)) {
                    return;
                }
                this._addParam(Param.create(param));
            } catch (e) {
                if (e.code === 'ERR_NO_SHAPE') {
                    const name = this._getShapeName(param);
                    const field = param.replace(`${name}.`, '');
                    if (!this._shapes[name]) {
                        this._shapes[name] = [];
                    }
                    this._shapes[name].push(field);
                    return;
                }
                throw e;
            }
        });
        Object.keys(this._shapes).forEach((name) => {
            const shape = {};
            this._shapes[name].forEach(field => shape[field] = Type.any);
            this._addParam(Param.create({ name, type: Type.shape(shape), required: true }));
        });
        return this._parsed;
    }

    _findShapes() {
        this.params.forEach((param) => {
            if (typeof param === 'string' && param.indexOf('.') > 0) {
                this._shapeList.push(this._getShapeName(param));
            }
        });
    }

    _isShape(param) {
        if (typeof param === 'string' && param.indexOf('.') < 0) {
            return this._shapeList.indexOf(param) >= 0;
        }
        return false;
    }

    _getShapeName(shape) {
        return shape.split('.').shift();
    }

    _addParam(param) {
        this._parsed.push(param);
    }
}

export {
    Param as default,
    ParamParser,
};
