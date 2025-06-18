const { defineConfig } = require('@vue/cli-service')
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const path = require('path')

let publicPath = '/';
if (process.env.BUILD_MODE === 'webcomponent') {
  if (process.env.NETLIFY_DEV === 'true' || process.env.NODE_ENV === 'development') {
    publicPath = './';
  } else {
    publicPath = 'https://widget.starsystemlabs.com/';
  }
}

module.exports = defineConfig({
  transpileDependencies: true,
  
  outputDir: process.env.BUILD_MODE === 'webcomponent' ? 'widget-dist' : 'dist',
  
  configureWebpack: {
    resolve: {
      alias: {
        'vue$': 'vue/dist/vue.esm-bundler.js'
      }
    },
    plugins: [
      new webpack.DefinePlugin({
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
        __VUE_PROD_DEVTOOLS__: 'false',
        __VUE_OPTIONS_API__: 'true',
        'process.env.VUE_APP_ASSETS_BASE_URL': JSON.stringify(process.env.VUE_APP_ASSETS_BASE_URL || '')
      }),
      new webpack.HotModuleReplacementPlugin()
    ],
    optimization: process.env.BUILD_MODE === 'webcomponent' ? {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            name: 'chunk-vendors',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            chunks: 'initial'
          }
        }
      }
    } : {},
    output: process.env.BUILD_MODE === 'webcomponent' ? {
      filename: 'widget-js/[name].js',
      chunkFilename: 'widget-js/[name].js'
    } : {}
  },
  css: {
    extract: process.env.NODE_ENV === 'production' ? {
      filename: process.env.BUILD_MODE === 'webcomponent' ? 'widget-css/[name].css' : 'css/[name].[contenthash:8].css',
      chunkFilename: process.env.BUILD_MODE === 'webcomponent' ? 'widget-css/[name].css' : 'css/[name].[contenthash:8].css'
    } : false,
    sourceMap: true,
    loaderOptions: {
      css: {
        modules: {
          auto: true,
          localIdentName: '[name]_[local]_[hash:base64:5]'
        }
      },
      postcss: {
        sourceMap: true
      }
    }
  },
  publicPath: publicPath,
  
  filenameHashing: process.env.BUILD_MODE !== 'webcomponent',
  
  chainWebpack: config => {
      config.plugins.delete('copy')
      
    if (process.env.BUILD_MODE === 'webcomponent') {
      config.plugin('html')
        .tap(args => {
          args[0].template = 'src/widget-assets/health-check.html'
          args[0].inject = false
          return args
        })
        
      config.plugin('copy-backward-compatibility')
        .use(CopyWebpackPlugin, [{
          patterns: [
            {
              from: path.resolve(__dirname, 'src/assets'),
              to: 'assets',
              noErrorOnMissing: true
            },
            {
              from: path.resolve(__dirname, 'public'),
              to: '',
              noErrorOnMissing: true,
              globOptions: {
                ignore: ['**/index.html']
              }
            }
          ]
        }])
    }
    
    if (process.env.NODE_ENV === 'production') {
    }
  },
  
  devServer: {
    hot: true,
    liveReload: true,
    client: {
      overlay: true,
      progress: true,
      webSocketURL: {
        hostname: 'localhost'
      }
    },
    watchFiles: ['src/**/*.vue', 'src/**/*.css', 'src/widget-assets/*.html']
  }
})
