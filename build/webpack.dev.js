const merge = require('webpack-merge')

const common = require('./webpack.common');

module.exports = merge(common, {
  mode: 'development',
  devServer: {
    contentBase: './dist',
  },
  devtool: 'source-map',
})