const path = require('path');

module.exports = {
	mode: 'production',
	entry: './react/entry.ts',
	output: {
		path: path.join(__dirname, '../assets'),
		filename: 'bundle.js',
	},
	resolve: {
		extensions: ['.ts', '.tsx', '.js'],
	},
	module: {
		rules: [
			{ test: /\.tsx?$/, loader: 'ts-loader', exclude: /node_modules/ },
			{
				test: /\.s[ac]ss$/i,
				exclude: /node_modules/,
				use: [
					'style-loader',
					'css-loader',
					'sass-loader',
				],
			},
		],
	},
};