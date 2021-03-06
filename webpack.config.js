const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const SitemapWebpackPlugin = require('sitemap-webpack-plugin').default;
const dotenv = require('dotenv')

module.exports = async (env, argv) => {
    const paths = ['/spotify-charts-generator-static'];
    const isDevelopment = argv.mode === 'development';
    const pre_build = require('./pre_build');

    const config = {
        entry: {
            index: "./src/index.jsx",
        },
        mode: isDevelopment ? 'development' : 'production',
        devtool: isDevelopment ? 'inline-source-map' : 'source-map',
        module: {
            rules: [
                {
                    test: /\.(js|jsx)$/i,
                    exclude: /(node_modules|bower_components)/,
                    use: [
                        {
                            loader: require.resolve('babel-loader'),
                            options: {
                                presets: ["@babel/env"],
                                plugins: [isDevelopment && require.resolve('react-refresh/babel')].filter(Boolean)
                            }
                        }]
                },
                {
                    test: /\.css$/i,
                    use: ["style-loader", "css-loader"]
                },
                {
                    test: /\.s[ac]ss$/i,
                    use: ["style-loader", "css-loader", "sass-loader"]
                },
                {
                    test: /\.(pdf|svg)$/i,
                    loader: 'file-loader',
                    options: {
                        name: '[path][name].[ext]',
                    }
                },
                {
                    test: /\.(txt|html)$/i,
                    use: 'raw-loader'
                }
            ]
        },
        resolve: {extensions: ["*", ".js", ".jsx"]},
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: '[name].bundle.js',
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env': JSON.stringify(dotenv.config().parsed)
            }),
            isDevelopment && new webpack.HotModuleReplacementPlugin(),
            isDevelopment && new ReactRefreshWebpackPlugin(),
            !isDevelopment && new CleanWebpackPlugin(),
            new HtmlWebpackPlugin({
                template: "./src/template.ejs",
                title: "Spotify Charts Generator Static",
                favicon: "./src/images/thinking.svg",
                meta: [
                    {
                        name: 'viewport',
                        content: 'width=device-width, initial-scale=1'
                    }
                ],
                // for Google Analytics
                googleAnalytics: {
                    measurement_id: 'G-E0SFHJ2WPZ'
                },
                // inject environment variables into pages at build time
                window: {
                    env: {
                        client_id: process.env.CLIENT_ID,
                        client_secret: process.env.CLIENT_SECRET,
                        redirect_uri: process.env.REDIRECT_URL,
                        scopes: process.env.SCOPES,
                        charts: isDevelopment ?
                            await pre_build.fetch_regions_only() :
                            await pre_build.fetch_charts()
                    }
                },
            }),
            new SitemapWebpackPlugin('https://graysonliu.github.io', paths,
                {skipgzip: true})
        ].filter(Boolean)
    };

    if (isDevelopment) {
        config.devServer = {
            contentBase: path.join(__dirname, ""),
            port: 3001,
            hotOnly: true
        }
    }

    return config;
};
