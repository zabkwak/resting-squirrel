import Type from 'runtime-type';
import Error from 'smart-error';

class Shape {

    name = null;
    description = null;
    /** @type {Field[]} */
    fields = [];
    /** @type {Type.Type} */
    type = Type.any;

    /**
     * @param {string} name
     * @param {string} description
     * @param {Field[]} fields 
     */
    constructor(name, description, ...fields) {
        this.name = name;
        if (description instanceof Field) {
            fields.unshift(description);
            this.description = null;
        } else {
            this.description = description;
        }
        this.fields = fields;
        const shape = {};
        this.fields.forEach((field) => {
            shape[field.name] = field.type;
        });
        this.type = Type.shape(shape);
    }

    toJSON() {
        const o = {
            name: this.name,
            description: this.description,
            shape: {},
        };
        this.fields.forEach((field) => {
            o.shape[field.name] = field;
        });
        return o;
    }
}

class ShapeArray {

    name = null;
    description = null;
    /** @type {Shape} */
    shape = null;
    /** @type {Type.Type} */
    type = Type.any;

    /**
     * 
     * @param {string} name 
     * @param {string} description 
     * @param {Field[]} shape 
     */
    constructor(name, description, ...fields) {
        this.name = name;
        if (description instanceof Field) {
            fields.unshift(description);
            this.description = null;
        } else {
            this.description = description;
        }
        this.shape = new Shape('__shape__', null, ...fields);
        this.type = Type.arrayOf(this.shape.type);
    }

    toJSON() {
        return {
            name: this.name,
            description: this.description,
            shape_array: this.shape.toJSON().shape,
        }; 
    }
}

export default class Field {

    static Shape = Shape;
    static ShapeArray = ShapeArray;

    static create(param) {
        if (typeof param === 'string') {
            if (param.indexOf('.') > 0) {
                throw new Error('Cannot create shape parameter', 'no_shape');
            }
            return new this(param, Type.any, null);
        }
        return new this(param.name, param.type, param.description);
    }

    /** @type {string} */
    key = null;
    /** @type {string} */
    name = null;
    /** @type {Type.Type} */
    type = null;
    /** @type {string} */
    description = null;

    /**
     * 
     * @param {string} name 
     * @param {Type.Type|string} type 
     * @param {string} description 
     */
    constructor(name, type = Type.any, description = null) {
        this.key = name;
        this.name = name;
        this.type = typeof type === 'string' ? Type[type] : type;
        this.description = description;
        if (!(this.type instanceof Type.Type)) {
            throw new Error('Invalid type.');
        }
    }

    toJSON() {
        return {
            name: this.name,
            key: this.key,
            description: this.description,
            type: this.type.toString(),
        };
    }
}
