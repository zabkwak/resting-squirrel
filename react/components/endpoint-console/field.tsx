import * as React from 'react';
import { TextField, Select, FormControl, InputLabel } from '@material-ui/core';
import Type, { ArrayOf, BooleanType, Enum } from 'runtime-type';

import { IField, IParam } from '../../typings';
import ArrayField from './field.array';
import ShapeField from './field.shape';
import ShapeArrayField from './field.shape-array';

interface IOptionalProps<T> {
	required: boolean;
	shape: IField['shape'];
	shapeArray: IField['shape_array'];
	disabled: boolean;
	value: T;
	onValueChanged: (value: T) => void;
	params: boolean;
	level: number;
}

interface IProps<T> extends Partial<IOptionalProps<T>> {
	name: string;
	type: IField['type'];
}

interface IState<T> {
	value: T;
}

export default class Field<T> extends React.Component<IProps<T>, IState<T>> {

	public static defaultProps: IOptionalProps<any> = {
		required: false,
		shape: null,
		shapeArray: null,
		disabled: false,
		value: '',
		onValueChanged: null,
		params: false,
		level: 0,
	};

	public state: IState<any> = {
		value: '',
	};

	public render(): JSX.Element {
		const { level } = this.props;
		return (
			<div
				style={{ marginLeft: level * 10 }}
			>
				{this.renderField()}
			</div>
		);
	}

	public renderField(): JSX.Element {
		const { name, type, required, shape, shapeArray, disabled, value, onValueChanged, params, level } = this.props;
		if (shape) {
			return (
				<>
					<InputLabel disabled={disabled} required={required}>{name}</InputLabel>
					<ShapeField
						shape={shape}
						value={value as any || {}}
						onValueChange={(value) => this._setValue(value as any)}
						disabled={disabled}
						params={params}
					/>
				</>
			);
		}
		if (shapeArray) {
			return (
				<>
					<InputLabel disabled={disabled} required={required}>{name}</InputLabel>
					<ShapeArrayField
						shape={shapeArray}
						values={value as any || [{}]}
						onValuesChange={(values) => this._setValue(values as any)}
						disabled={disabled}
						params={params}
					/>
				</>
			);
		}
		const t = Type.fromString(type);
		if (t instanceof ArrayOf) {
			return (
				<>
					<InputLabel disabled={disabled} required={required}>{name}</InputLabel>
					<ArrayField
						// @ts-ignore
						type={t._type.toString()}
						values={value as any || ['']}
						onValuesChange={(values: any) => {
							this._setValue(values);
						}}
						disabled={disabled}
					/>
				</>
			);
		}
		if (t instanceof BooleanType) {
			return (
				<FormControl fullWidth required={required} disabled={disabled}>
					<InputLabel>{name}</InputLabel>
					<Select native value={value} onChange={(e) => this._setValue(e.target.value as any)}>
						<option aria-label="None" value="" />
						<option value="true">True</option>
						<option value="false">False</option>
					</Select>
				</FormControl>
			);
		}
		if (t instanceof Enum) {
			return (
				<FormControl fullWidth required={required} disabled={disabled}>
					<InputLabel>{name}</InputLabel>
					<Select native value={value} onChange={(e) => this._setValue(e.target.value as any)}>
						<option aria-label="None" value="" />
						{
							// @ts-ignore Hack for reading enum values from runtime-type
							t.values.map((value: string) => (
								<option value={value} key={value}>{value}</option>
							))
						}
					</Select>
				</FormControl>
			);
		}
		// TODO handle shape, shape array
		// TODO info button for description
		return (
			<TextField
				fullWidth
				label={`${name} (${type})`}
				required={required}
				disabled={disabled}
				value={value}
				onChange={(e) => {
					this._setValue(e.target.value as any);
				}}
			/>
		);
	}

	private _setValue(value: T): void {
		const { onValueChanged } = this.props;
		this.setState({ value });
		if (typeof onValueChanged === 'function') {
			onValueChanged(value as any);
		}
	}
}
