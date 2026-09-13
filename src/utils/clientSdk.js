import Client from '@qcloud/client-sdk'

// SDK调用云函数的参数
const QcHost = process.env.VUE_APP_QC_HOST
const QcAppName = process.env.VUE_APP_QC_APPNAME
const QcBranch = process.env.VUE_APP_QC_BRANCH
const QcDeveloper = process.env.VUE_APP_QC_DEVELOPER
const QcEnv = process.env.VUE_APP_QC_ENV
const QcAccessKey = process.env.VUE_APP_QC_ACCESSKEY
const QcHostLocal = process.env.VUE_APP_QC_HOST_LOCAL  // 调用本地云函数使用
const localurl = process.env.VUE_APP_QC_LOCAL_URL // 调用本地弹性应用
const QcCDNhost = process.env.VUE_APP_QC_CDN_URL //调用cdn加速

let client = {}

/*
 初始化client实例
*/
client = new Client({
  qcHost: QcHost,
  qcAppName: QcAppName,
  accessKey: QcAccessKey,
  branch: QcBranch,
  developer: QcDeveloper,
  env: QcEnv,
  isApp: false, // 在本地开发模式下固定值为 false
  qchost_qc: QcHostLocal, // 调用本地云函数时使用的域名
  localurl: localurl,
  cdnhost: QcCDNhost
})

//调用云函数的公共方法
export function clientFn(funName, params) {
  return new Promise((resolve, reject) => {
    client.invokeFunction({
      functionName: funName,
      event: params,
      success: res => {
        resolve(res)
      },
      fail: err => {
        console.log(err)
        reject(err)
      }
    })
  })
}
//调用云函数的cdn加速（仅限get请求）
export function clientFnGetCDN(funName, params) {
  return new Promise((resolve, reject) => {
    client.invokeFnGetCDN({
      functionName: funName,
      event: params,
      success: res => {
        resolve(res)
      },
      fail: err => {
        console.log(err)
        reject(err)
      }
    })
  })
}

//调用弹性应用的公共方法
export function requestService(srvName, path, params, query, opts, method, isLocal) {
  return new Promise((resolve, reject) => {
    /**
     * 弹性应用调用
     * @param {Object} object，其中object的属性说明如下：
     * 属性         类型      是否必填  参数说明
     * serviceName  String      是     服务名
     * path         String      否     服务path
     * event        Object      否     传递给服务的参数（请求体）
     * query        Object      否     传递给服务的参数（query参数）
     * option       Object      否     传递给服务的请求头
     * success      Function    否     成功回调函数
     * fail         Function    否     失败回调函数
     * complete     Function    否     结束回调函数
     */
    client.invokeService({
      serviceName: srvName,
      method: method,
      path: path,
      event: params,
      query: query,
      options: opts,
      isLocal: isLocal,
      success: res => {
        resolve(res.data)
      },
      fail: err => {
        console.error(err)
        reject(err)
      }
    })
  })
}
