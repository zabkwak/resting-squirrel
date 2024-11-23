import Type, { ArrayOf, Shape } from 'runtime-type';
import { IField, IParam } from '../../typings';

export const getDocsProperty = (key: string, field: IField | IParam): string => {
	const t = Type.fromString(field.type);
	const propertyKey = 'required' in field ? `${key}${field.required ? '' : '?'}` : key;
	if (t instanceof Shape && 'shape' in field) {
		// t.
		return `/**
 * ${field.description}
 */
${propertyKey}: {
${prependTabs(
	Object.entries(field.shape)
		.map(([key, field]) => getDocsProperty(key, field))
		.join('\n'),
	1,
)}
};`;
	}
	// @ts-expect-error
	if (t instanceof ArrayOf && t._type instanceof Shape && 'shape_array' in field) {
		return `/**
 * ${field.description}
 */
${propertyKey}: {
${prependTabs(
	Object.entries(field.shape_array)
		.map(([key, field]) => getDocsProperty(key, field))
		.join('\n'),
	1,
)}	
}[];`;
	}
	return `/**
 * ${field.description}
 */
${propertyKey}: ${t.getTSType(true)};`;
};

const prependTabs = (str: string, tabs: number): string => {
	return str
		.split('\n')
		.map((row) => `${'\t'.repeat(tabs)}${row}`)
		.join('\n');
};
