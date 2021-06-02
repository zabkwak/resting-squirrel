import { Type } from '../typings/types';
import Field, { FieldShapeArray, FieldShape } from './field';

export class ParamShape extends FieldShape {
	required: boolean;
	constructor(name: string, required: boolean, ...fields: Array<Field | FieldShape | FieldShapeArray | Param | ParamShape | ParamShapeArray>);
	constructor(name: string, required: boolean, description: string, ...fields: Array<Field | FieldShape | FieldShapeArray | Param | ParamShape | ParamShapeArray>);
	toJSON(): { name: string, description: string, shape: { [key: string]: Field }, type: string, required: boolean };
}

export class ParamShapeArray extends FieldShapeArray {
	required: boolean;
	constructor(name: string, required: boolean, ...fields: Array<Field | FieldShape | FieldShapeArray | Param | ParamShape | ParamShapeArray>);
	constructor(name: string, required: boolean, description: string, ...fields: Array<Field | FieldShape | FieldShapeArray | Param | ParamShape | ParamShapeArray>);
	toJSON(): { name: string, description: string, shape: { [key: string]: Field }, type: string, required: boolean };
}

export default class Param /* extends Field */ {

	static Shape: typeof ParamShape;

	static ShapeArray: typeof ParamShapeArray;

	static createFromField(field: Field, required?: boolean): Param;

	static create(param: string | { name: string, type?: Type, description?: string, required?: boolean }): Param;

	key: string;

	name: string;

	type: Type;

	description: string;

	required: boolean;

	constructor(name: string);

	constructor(name: string, required: boolean);

	constructor(name: string, required: boolean, type: Type);

	constructor(name: string, required: boolean, type: Type, description: string);

	toJSON(): { name: string, key: string, description: string, type: string, required: boolean };
}