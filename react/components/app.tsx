import { AppBar, Grid, Toolbar, Typography, IconButton, Box } from '@material-ui/core';
import { Menu as MenuIcon } from '@material-ui/icons';
import * as React from 'react';
import * as ReactDom from 'react-dom';

import { IDocs, IResponse } from '../typings';
import EndpointList from './endpoint-list';

export interface IData {
	name: string;
	apiKey: string;
	rsVersion: string;
	version: string;
	dataKey: string;
	errorKey: string;
	meta: boolean;
	authKey: string;
	authDescription: string;
	docsRoute: string;
}

interface IProps {
	docs: IDocs;
}

interface IState {
	list: boolean;
}

export default class Application extends React.Component<IProps, IState> {

	private static _data: IData;

	public static async start(): Promise<void> {
		const response = await fetch(`${this.getData('docsRoute')}?api_key=${this.getData('apiKey')}`);
		const docs: IResponse<IDocs> = await response.json();
		ReactDom.render(<Application docs={docs.data} />, document.getElementById('app'));
	}

	public static getData<K extends keyof IData>(key: K): IData[K] {
		if (!this._data) {
			const data = document.getElementById('initial-data').getAttribute('data-data');
			this._data = JSON.parse(data);
		}
		return this._data[key];
	}

	public state: IState = {
		list: true,
	};

	public render(): JSX.Element {
		const { docs } = this.props;
		const { list } = this.state;
		return (
			<>
				<AppBar position="static">
					<Toolbar>
						<IconButton
							edge="start"
							color="inherit"
							aria-label="menu"
							onClick={() => {
								this.setState({ list: !list });
							}}
						>
							<MenuIcon />
						</IconButton>
						<Typography variant="h5">
							{Application.getData('name')} documentation
						</Typography>
					</Toolbar>
				</AppBar>
				<main
					style={{
						minHeight: 0,
						flex: '1 1 100%',
					}}
				>
					<Grid container style={{ height: '100%', position: 'relative' }}>
						{
							list &&
							<Grid item xs={2} style={{ height: '100%' }}>
								<EndpointList docs={docs} />
							</Grid>
						}
						<Grid item xs>
							DOCS
						</Grid>
						<Grid item xs={2}>
							CONSOLE
						</Grid>
					</Grid>
				</main>
				<footer>
					FOOTER
				</footer>
				{/*
				<Box display="flex" flexDirection="column" flexGrow={1} style={{ position: 'relative', height: '100%' }}>
					<Box p={1} height="100%">
						<Grid item xs style={{ height: '100%', position: 'relative' }}>
							<Grid container style={{ height: '100%', position: 'relative' }}>
								{
									list &&
									<Grid item xs={2}>
										<EndpointList docs={docs} />
									</Grid>
								}
								<Grid item xs>
									DOCS
						</Grid>
								<Grid item xs={2}>
									CONSOLE
					</Grid>
							</Grid>
						</Grid>
					</Box>
					<Box>FOOTER</Box>
				</Box>
							*/}
			</>
		);
	}
}
