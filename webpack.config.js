const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const baseConfig = {
  entry: {
    index: './src/index.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[name].js',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|mp4)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {from: './src/index.html'},
        {from: './src/PokeFont.ttf'},
        {from: './src/PokeFont.otf'},
      ],
    }),
  ],
};

module.exports = ( env ) => {
  if ( env.development ) {
    return Object.assign( baseConfig, {
      mode: 'development',
      devtool: 'inline-source-map',
      devServer: {
        static: [
          path.join(__dirname, 'dist'),
        ],
        port: 9999,
      },
    });
  } else {
    return Object.assign( baseConfig, {
      mode: 'production',
      devtool: false,
    });
  }
};