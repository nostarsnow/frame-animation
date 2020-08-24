// vue.config.js
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;
const plugins = [];
if (process.env.NODE_ENV === 'production') {
  //plugins.push(new BundleAnalyzerPlugin());
}
const vueConfig = {
  configureWebpack: {
    plugins,
    resolve: {},
  },
  productionSourceMap: false,
  publicPath:
    process.env.NODE_ENV === 'production'
      ? '/'
      : '/',
  outputDir: 'dist/',
  devServer: {
    port: 8008,
    disableHostCheck: true,
    overlay: {
      warnings: false,
      errors: false,
    },
  },
};
module.exports = vueConfig;
