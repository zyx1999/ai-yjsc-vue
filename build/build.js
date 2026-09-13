//node 内置child_process模块
const execSync = require('child_process').execSync
//node 内置path模块
const path = require('path')

//获取vue-cli-service物理地址
const buildPath = path.join(__dirname,'../node_modules/@vue/cli-service/bin/vue-cli-service')
//获取命令行参数
const params = process.argv
//判断当前运行模式（stage、test、local等）
let mode = ''
let paramsArr = []
if(params.includes('--mode')){
    mode = params[3]
    paramsArr = params.slice(4)
}else{
    paramsArr = params.slice(2)
}

//将参数添加--
let resultArr = paramsArr.map(_ => {
    return '---'+_
})
// let resultStr = resultArr.join(' ')
// console.log(`node ${buildPath} ${resultStr} ${mode?`--mode ${mode}`:''}`)
execSync(`node ${buildPath} build ${resultArr} ${mode?`--mode ${mode}`:''}`,{ stdio: 'inherit'})