import Type from 'runtime-type';
import Error from 'smart-error';

import Field from './field';

class Shape extends Field.Shape {

    static createFromFieldShape(shape, required = false) {
        return new this(shape.name, required, shape.description, ...shape.fields);
    }

    required = false;

    /**
     * 
     * @param {string} name 
     * @param {boolean} required 
     * @param {string} description 
     * @param {Field[]|Param[]} fields 
     */
    constructor(name, required, description, ...fields) {
        super(name, description, ...fields);
        this.required = required;
        // force all shape parameters to be required -> temp solution
        this.fields = this.fields.map((field) => {
            if (field instanceof Shape || field instanceof ShapeArray) {
                return field;
            }
            return Param.createFromField(field, typeof field.required === 'boolean' ? field.required : true);
        });
    }

    toJSON() {
        return {
            ...super.toJSON(),
            required: this.required,
        };
    }
}

class ShapeArray extends Field.ShapeArray {

    required = false;

    /**
     * 
     * @param {string} name 
     * @param {boolean} required 
     * @param {string} description 
     * @param {Field[]|Param[]} fields 
     */
    constructor(name, required, description, ...fields) {
        super(name, description, ...fields);
        this.required = required;
        // force all shape parameters to be required -> temp solution
        this.shape.fields = this.shape.fields.map((field) => {
            if (field instanceof Shape || field instanceof ShapeArray) {
                return field;
            }
            return Param.createFromField(field, true);
        });
    }

    toJSON() {
        return {
            ...super.toJSON(),
            required: this.required,
        };
    }
}

class Param extends Field {

    static Shape = Shape;
    static ShapeArray = ShapeArray;

    static create(param) {
        if (typeof param === 'string') {
            if (param.indexOf('.') > 0) {
                throw new Error('Cannot create shape parameter', 'no_shape');
            }
            return new this(param, true, Type.any, null);
        }
        return new this(param.name, param.required, param.type, param.description);
    }

    /**
     * 
     * @param {Field} field 
     * @param {boolean} required 
     */
    static createFromField(field, required = false) {
        return this.create({ ...field, required });
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
                if (param instanceof Param || param instanceof Param.Shape || param instanceof Param.ShapeArray) {
                    this._addParam(param);
                    return;
                }
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
