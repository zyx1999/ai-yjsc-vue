module.exports = {
      "env": {
          "browser": true,
          "es6": true,
          "node": true
      },
      "extends": [
          "plugin:vue/essential" //将检测eslint-plugin-vue官网中essential级别的规范
      ],
      "globals": {
          "Atomics": "readonly",
          "SharedArrayBuffer": "readonly"
      },
      "parser": "vue-eslint-parser",
      "parserOptions": {
           "parser": "babel-eslint",
          "ecmaVersion": 2018,
          "sourceType": "module"
      },
      "plugins": [
          "vue"
      ],
      "rules": {    //对具体某条规范的使用配置
     //以下两条规则为特殊的essential级别，不可删去
       "vue/component-definition-name-casing": ["error", "PascalCase"],
       "vue/require-prop-types": "error"
      }
  };
