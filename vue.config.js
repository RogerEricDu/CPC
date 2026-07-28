const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,

  chainWebpack(config) {
    const svgRule = config.module.rule('svg')
    svgRule.delete('type')
    svgRule.delete('generator')
    svgRule.oneOf('source')
      .resourceQuery(/source/)
      .type('asset/source')
    svgRule.oneOf('resource')
      .type('asset/resource')
      .set('generator', { filename: 'img/[name].[hash:8][ext]' })
  },

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
