const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  
  configureWebpack: {
    performance: {
      hints: false
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',  // 使用固定名称
            chunks: 'all',
          }
        }
      }
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
  
  publicPath: '/cpc/',
  lintOnSave: false
})