//node 内置child_process模块
const execSync = require('child_process').execSync
//node 内置path模块
const path = require('path')

//获取vue-cli-service物理地址
const buildPath = path.join(__dirname,'../node_modules/@vue/cli-service/bin/vue-cli-service')
//获取命令行参数
const params = process.argv
//判断当前运行模式（development）
let mode = ''
let paramsArr = []
let open = false
if(params.includes('--open')){
    open = true
}else{
    open = false
}

if(params.includes('--mode')){
    mode = open? params[4] : params[3]
    paramsArr =open? params.slice(5):params.slice(4)
}else{
    paramsArr =open? params.slice(3):params.slice(2)
}


//将参数添加--
let resultArr = paramsArr.map(_ => {
    return '---'+_
})
// let resultStr = resultArr.join(' ')
// console.log(`node ${buildPath} ${resultStr} ${mode?`--mode ${mode}`:''}`)
execSync(`node ${buildPath} serve ${resultArr} ${open?`--open`:''} ${mode?`--mode ${mode}`:''}`,{ stdio: 'inherit'})