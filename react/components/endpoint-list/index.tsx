import * as React from 'react';
import { List, Switch, FormControlLabel, TextField, Typography, Chip } from '@material-ui/core';

import { IDocs } from '../../typings';

import Item from './item';
import Application from '../app';
import Title from '../title';

interface IProps {
	docs: IDocs;
}

interface IState {
	showDeprecated: boolean;
	active: string;
	search: string;
}

export default class EndpointList extends React.Component<IProps, IState> {

	public state: IState = {
		showDeprecated: true,
		active: Application.getParams().endpoint,
		search: '',
	};

	public render(): JSX.Element {
		const { docs } = this.props;
		const { showDeprecated, active, search } = this.state;
		const searchSplitted = search ? search.split(' ').map(item => item.toLowerCase()) : null;
		const filtered = Object
			.entries(docs)
			.filter(([name, endpoint]) => {
				if (showDeprecated) {
					return true;
				}
				return !endpoint.deprecated;
			})
			.filter(([name, endpoint]) => {
				if (searchSplitted) {
					for (const part of searchSplitted) {
						if (name.toLowerCase().indexOf(part) < 0) {
							return false;
						}
					}
				}
				return true;
			});
		return (
			<div className="container">
				<Title component="h2" variant="h4">
					Endpoints
					<div style={{ textAlign: 'right', float: 'right' }}>
						<Chip label={filtered.length} />
					</div>
				</Title>
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
				<TextField
					label="Search"
					onChange={(e) => {
						this.setState({ search: e.target.value });
					}}
				/>
				<List className="list">
					{
						filtered
							.map(([name, endpoint]) => (
								<Item
									key={name}
									name={name}
									deprecated={endpoint.deprecated}
									auth={endpoint.auth}
									selected={active === name}
									onClick={() => {
										this.setState({ active: name });
										Application.navigate({ endpoint: name, anchor: name });
										Application.scrollToRef(name);
										Application.setEndpoint(name);
									}}
								/>
							))
					}
				</List>
			</div>
		);
	}
}
