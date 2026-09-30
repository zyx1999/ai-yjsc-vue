'use strict'

const BundleAnaltzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin  // 引入图形化信息插件
/**
 * vue.config.js
 * @vue/cli-service 配置文件
 * 可选参数请参考外网 https://cli.vuejs.org/zh/config/
 */
const path = require('path')
const pkg = require('./package.json')

function resolve(dir) {
  return path.join(__dirname, dir)
}

const name = pkg.name || process.env.VUE_APP_NAME // 主页标题
const port = process.env.VUE_APP_PORT // dev port
const rawArgv = process.argv.slice(2)

//获取env参数（未传附加参数时不注入，避免 JSON.parse(undefined) 报错）
const rawEnvArg = process.argv[3] || ''
let resultEnvArr = []
if (rawEnvArg) {
  const envArr = JSON.parse(JSON.stringify(rawEnvArg)).split(',')
  resultEnvArr = envArr.map(_env => {
    return _env.slice(3)
  })
}
function getEnvOptions(options){
  let envObj = {}
  for(var i=0;i<options.length;i++){
    let kv = options[i].split('=')
    let key = 'VUE_APP_QC_'+kv[0].toUpperCase()
    let value = `"${kv[1]}"`
    envObj[key] = value
  }
  return envObj
}
let setEnvObj = getEnvOptions(resultEnvArr)

// 读取从命令行传递的 HOST 参数，若未传递则为 undefined
const cmdPort = setEnvObj['VUE_APP_QC_PORT'] ? Number(setEnvObj['VUE_APP_QC_PORT'].slice(1, setEnvObj['VUE_APP_QC_PORT'].length  - 1)) : undefined

// All configuration item explanations can be find in https://cli.vuejs.org/config/
module.exports = {
  /**
   * You will need to set publicPath if you plan to deploy your site under a sub path,
   * for example GitHub Pages. If you plan to deploy your site to https://foo.github.io/bar/,
   * then publicPath should be set to "/bar/".
   * In most cases please use '/' !!!
   * Detail: https://cli.vuejs.org/config/#publicpath
   */
  publicPath: process.env.VUE_APP_PUBLIC_PATH, // 部署应用包时的上下文根，默认值为'/'
  outputDir: process.env.VUE_APP_OUTPUT_DIR, // 运行 npm run build 时生成的生产环境构建文件目录
  assetsDir: process.env.VUE_APP_ASSETS_DIR, // 放置生成的静态资源的(相对于outputDir)目录
  lintOnSave: process.env.NODE_ENV === 'development' ? 'error' : false, // 在生产构建时禁用eslint-loader
  productionSourceMap: false, // 在生产构建时禁用sourceMap
  devServer: {
    port: cmdPort || port,  // 优先读取从命令行传递的 PORT 参数，若未设置则读取 .env.development 的 VUE_APP_PORT 值
    // open: true,
    overlay: {
      warnings: false,
      errors: true
    },
    proxy: {
      // change xxx-api/login => mock/login
      // detail: https://cli.vuejs.org/config/#devserver-proxy
      [process.env.VUE_APP_BASE_API]: {
        // 对接 Java 后端时在 .env 配置 VUE_APP_PROXY_TARGET（默认 18080），未配置时回落到本地 mock
        target: process.env.VUE_APP_PROXY_TARGET || `http://localhost:${port}/mock`,
        changeOrigin: true,
        pathRewrite: {
          ['^' + process.env.VUE_APP_BASE_API]: ''
        }
      }
    },
    after(app) {
      require('@babel/register')
      const bodyParser = require('body-parser')

      // parse app.body
      // http://expressjs.com/en/4x/api.html#req.body
      app.use(bodyParser.json())
      app.use(bodyParser.urlencoded({
        extended: true
      }))

      // const { default: mocks } = require('./mock')
      // for (const mock of mocks) {
      //   app[mock.type](mock.url, mock.response)
      // }
    }
  },
  configureWebpack: {
    // provide the app's title in webpack's name field, so that
    // it can be accessed in index.html to inject the correct title.
    name: name,
    resolve: {
      alias: {
        '@': resolve('src')
      }
    }
  },
  chainWebpack(config) {
    config.plugins.delete('preload') // TODO: need test
    config.plugins.delete('prefetch') // TODO: need test
    //set env
    config.plugin('define').tap(definitions => {
      Object.assign(definitions[0]['process.env'],setEnvObj)
      return definitions
    })
    // set svg-sprite-loader
    config.module
      .rule('svg')
      .exclude.add(resolve('src/icons'))
      .end()
    config.module
      .rule('icons')
      .test(/\.svg$/)
      .include.add(resolve('src/icons'))
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({
        symbolId: 'icon-[name]'
      })
      .end()

    // set preserveWhitespace
    config.module
      .rule('vue')
      .use('vue-loader')
      .loader('vue-loader')
      .tap(options => {
        options.compilerOptions.preserveWhitespace = true
        return options
      })
      .end()

    config
      .when(process.env.NODE_ENV === 'development',
        config => config.devtool('source-map')
      )

    config
      .when(process.env.NODE_ENV !== 'development',
        config => {
          config
            .plugin('ScriptExtHtmlWebpackPlugin')
            .after('html')
            .use('script-ext-html-webpack-plugin', [{
            // `runtime` must same as runtimeChunk name. default is `runtime`
              inline: /runtime\..*\.js$/
            }])
            .end()
          config
            .optimization.splitChunks({
              chunks: 'all',
              cacheGroups: {
                libs: {
                  name: 'chunk-libs',
                  test: /[\\/]node_modules[\\/]/,
                  priority: 10,
                  chunks: 'initial' // only package third parties that are initially dependent
                },
                commons: {
                  name: 'chunk-commons',
                  test: resolve('src/components'), // can customize your rules
                  minChunks: 3, //  minimum common number
                  priority: 5,
                  reuseExistingChunk: true
                }
              }
            })
            config // 网页显示图形化信息,仅在analyzer模式下展示
            .when(rawArgv.includes('--analyzer') === true,
            config => config
            .plugin('webpack-bundle-analyzer')
            .use(BundleAnaltzerPlugin)
          )        
          config.optimization.runtimeChunk('single')
        }
      )
  },
  css: {
    loaderOptions: {
      stylus: {
        'resolve url': true,
        'import': [
          './src/theme' // cube-ui的stylus样式
        ]
      },
      sass:{
        implementation:require('sass')
      },
      scss:{
          implementation:require('sass')
      }
    }
  },
  pluginOptions: {
    'cube-ui': {
      postCompile: true,
      theme: true
    }
  }
}
