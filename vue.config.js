const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,

  configureWebpack: {
    performance: {
      hints: false
    }
  },

  devServer: {
    hot: true,
    client: {
      overlay: false,
    },
    compress: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    }
  },

  publicPath: process.env.VUE_APP_PUBLIC_PATH || '/cpc/',
  lintOnSave: false
})
