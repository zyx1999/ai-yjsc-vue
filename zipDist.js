/*
 * @FileName: ./zipDist.js
 * @Version: 5.0.0-apha1
 * @Description: 压缩构建后生成的dist目录
 * @Author: LIU Jiajie
 * @Company: 中国农业银行
 * @Date: 2019-04-11 15:33:31
 * @LastEditors: LIU Jiajie
 * @LastEditTime: 2019-04-25 22:37:04
 */
const zipdir = require('zip-dir')

// 压缩参数
const configs = {
  dir: {
    distFolder: 'dist_stage', // 待压缩的目录（相对路径），应根据需要将该字段修改为 npm run build 后生成的生产包路径
    fileName: process.env.npm_package_name, // 待生成的压缩文件名（相对路径）
    fileExtension: 'war' // 待生成的压缩文件类型（）
  }
}

// 执行压缩操作
zipdir(
  `${__dirname}\\${configs.dir.distFolder}`,
  {
    saveTo: `${__dirname}\\${configs.dir.fileName}.${configs.dir.fileExtension}`
  },
  function(err) {
    if (err) {
      console.log(err)
    } else {
      console.log(`Compressed file saved at ${__dirname}\\${configs.dir.fileName}.${configs.dir.fileExtension}`)
    }
  }
)
