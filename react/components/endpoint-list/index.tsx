import * as React from 'react';
import { List, Switch, FormControlLabel, Grid } from '@material-ui/core';

import { IDocs } from '../../typings';

import Item from './item';

interface IProps {
	docs: IDocs;
}

interface IState {
	showDeprecated: boolean;
	active: string;
}

export default class EndpointList extends React.Component<IProps, IState> {

	public state: IState = {
		showDeprecated: true,
		active: null,
	};

	public render(): JSX.Element {
		const { docs } = this.props;
		const { showDeprecated, active } = this.state;
		return (
			<div className="container">
				<FormControlLabel
					control={
						<Switch
							checked={showDeprecated}
							onChange={() => this.setState({ showDeprecated: !showDeprecated })}
							name="show-deprecated"
							color="primary"
						/>
					}
					label="Show deprecated"
				/>
				<List className="list">
					{
						Object
							.entries(docs)
							.filter(([name, endpoint]) => {
								if (showDeprecated) {
									return true;
								}
								return !endpoint.deprecated;
							})
							.map(([name, endpoint]) => (
								<Item
									key={name}
									name={name}
									deprecated={endpoint.deprecated}
									auth={endpoint.auth}
									selected={active === name}
									onClick={() => {
										this.setState({ active: name });
									}}
								/>
							))
					}
				</List>
			</div>
		);
	}
}
