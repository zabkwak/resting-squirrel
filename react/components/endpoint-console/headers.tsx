import * as React from 'react';
import { Box, TextField, Button } from '@material-ui/core';
import uniqid from 'uniqid';
import CrossIcon from '@material-ui/icons/Cancel';

interface IOptionalProps {
	disabled: boolean;
}

interface IProps extends Partial<IOptionalProps> {
	headers: Array<{ key: string, value: string, disabled?: boolean, id: string }>;
	onChange: (headers: Array<{ key: string, value: string, disabled?: boolean, id: string }>) => void;
}

interface IState { }

export default class Headers extends React.Component<IProps, IState> {

	public static defaultProps: IOptionalProps = {
		disabled: false,
	};

	public state: IState = {};

	public render(): JSX.Element {
		const { disabled, headers, onChange } = this.props;
		return (
			<Box>
				{
					headers.map(({ key, value, disabled: labelDisabled, id }, index) => (
						<Box flexDirection="row" display="flex" key={id}>
							<Box flexGrow="1">
								<TextField
									disabled={labelDisabled || disabled}
									fullWidth
									label="Name"
									value={key}
									onChange={(e) => {
										headers[index].key = e.target.value;
										onChange(headers);
									}}
								/>
							</Box>
							<Box flexGrow="1">
								<TextField
									disabled={disabled}
									fullWidth
									label="Value"
									value={value}
									onChange={(e) => {
										headers[index].value = e.target.value;
										onChange(headers);
									}}
								/>
							</Box>
							{
								headers.length > 0 &&
								<Button
									size="small"
									color="secondary"
									onClick={() => {
										headers.splice(index, 1);
										onChange(headers);
									}}
									disabled={labelDisabled || disabled}
								>
									<CrossIcon />
								</Button>
							}
						</Box>
					))
				}
				<Button
					onClick={() => {
						headers.push({ key: '', value: '', id: uniqid() });
						onChange(headers);
					}}
				>
					Add header
				</Button>
			</Box>
		);
	}
}
