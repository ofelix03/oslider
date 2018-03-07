  const path = require('path');

  module.exports = {
    entry: './src/oslider.ts',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'awesome-typescript-loader',
          exclude: /node_modules/
        }
      ]
    },
    resolve: {
      extensions: [ '.tsx', '.ts', '.js' ]
    },
    output: {
      filename: 'oslider.js',
      path: path.resolve(__dirname, 'dist')
    }
  };
