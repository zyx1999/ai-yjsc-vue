const { notEmpty } = require('../../utils.js')

module.exports = {
  description: 'generate a table',
  prompts: [
    {
      type: 'list',
      name: 'tableType',
      message: '请选择生成的Table类型',
      choices: [
        {
          name: '行内编辑表格',
          value: 'inlineTable'
        },
        {
          name: '弹窗编辑表格',
          value: 'popupTable'
        }
      ]
    },
    {
      type: 'input',
      name: 'name',
      message: '请输入文件名',
      validate: notEmpty('name')
    }
  ],
  actions: data => {
    const name = '{{name}}'
    const tableType = data.tableType
    const timestamp = new Date().getTime()
    if (tableType === 'inlineTable') {
      const actions = [
        {
          type: 'add',
          path: `src/views/${name}/index.vue`,
          templateFile: `plop-templates/simple/table/${tableType}/index.hbs`,
          data: {
            timestamp
          }
        },
        {
          type: 'add',
          path: `src/api/article_table${timestamp}.js`,
          templateFile: `plop-templates/simple/table/${tableType}/article.hbs`,
          data: {
            timestamp
          }
        },
        {
          type: 'add',
          path: `mock/mockData_for_inlineTable${timestamp}.js`,
          templateFile: `plop-templates/simple/table/${tableType}/mockData.hbs`,
          data: {
            timestamp
          }
        }
      ]
      return actions
    }
    if (tableType === 'popupTable') {
      const actions = [
        {
          type: 'add',
          path: `src/views/${name}/index.vue`,
          templateFile: `plop-templates/simple/table/${tableType}/index.hbs`,
          data: {
            timestamp
          }
        },
        {
          type: 'add',
          path: `src/api/article_table${timestamp}.js`,
          templateFile: `plop-templates/simple/table/${tableType}/article.hbs`,
          data: {
            timestamp
          }
        },
        {
          type: 'add',
          path: `mock/popupTable_of_mockData${timestamp}.js`,
          templateFile: `plop-templates/simple/table/${tableType}/mockData.hbs`,
          data: {
            timestamp
          }
        }
      ]
      return actions
    }
  }
}
