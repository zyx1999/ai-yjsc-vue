// https://github.com/michael-ciniawsky/postcss-load-config

module.exports = {
  "plugins": {
    // to edit target browsers: use "browserslist" field in package.json
    "autoprefixer": {},
    "postcss-pxtorem": {
      "rootValue": 100, // 设计稿宽度的1/10,
      "propList":["*"],// 需要做转化处理的属性，如`hight`、`width`、`margin`等，`*`表示全部
    }
  }
}
