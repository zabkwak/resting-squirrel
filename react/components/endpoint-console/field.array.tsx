import * as React from 'react';
import { Button, Box } from '@material-ui/core';
import CrossIcon from '@material-ui/icons/Cancel';

import Field from './field';

interface IOptionalProps {
	disabled: boolean;
	values: Array<string>;
	onValuesChange: (values: Array<string>) => void;
	level: number;
	params: boolean;
}

interface IProps extends Partial<IOptionalProps> {
	type: string;
}

export default class ArrayField extends React.Component<IProps> {

	public static defaultProps: IOptionalProps = {
		disabled: false,
		values: [''],
		onValuesChange: null,
		level: 0,
		params: false,
	};

	public render(): JSX.Element {
		const { type, disabled, values, onValuesChange, level, params } = this.props;
		return (
			<>
				{
					(values || ['']).map((value, index) => (
						<Box display="flex" flexDirection="row" key={index}>
							<Box flexGrow="1">
								<Field
									name={`Element ${index}`}
									disabled={disabled}
									type={type}
									value={value}
									onValueChanged={(value) => {
										values[index] = value;
										if (typeof onValuesChange === 'function') {
											onValuesChange(values);
										}
									}}
									level={level + 1}
									params={params}
								/>
							</Box>
							{
								values.length > 1 &&
								<Button
									size="small"
									color="secondary"
									onClick={() => {
										values.splice(index, 1);
										if (typeof onValuesChange === 'function') {
											onValuesChange(values);
										}
									}}
									disabled={disabled}
								>
									<CrossIcon />
								</Button>
							}
						</Box>
					))
				}
				<Button
					onClick={() => {
						values.push('');
						if (typeof onValuesChange === 'function') {
							onValuesChange(values);
						}
					}}
					disabled={disabled}
				>
					Add element
				</Button>
			</>
		);
	}
}
