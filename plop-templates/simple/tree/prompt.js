const { notEmpty } = require('../../utils.js')

module.exports = {
  description: 'generate a tree',
  prompts: [
    {
      type: 'list',
      name: 'treeType',
      message: '请选择生成的Tree类型',
      choices: [
        {
          name: '按需加载树形视图',
          value: 'onDemandTree'
        }
      ]
    },
    {
      type: 'input',
      name: 'name',
      message: 'view name please',
      validate: notEmpty('name')
    }
  ],
  actions: data => {
    const name = '{{name}}'
    const treeType = data.treeType
    const timestamp = new Date().getTime()
    const actions = [
      {
        type: 'add',
        path: `src/views/${name}/index.vue`,
        templateFile: `plop-templates/simple/tree/${treeType}/index.hbs`,
        data: {
          timestamp
        }
      },
      {
        type: 'add',
        path: `src/api/tree_getData${timestamp}.js`,
        templateFile: `plop-templates/simple/tree/${treeType}/getData.hbs`,
        data: {
          timestamp
        }
      },
      {
        type: 'add',
        path: `mock/tree_of_mockData${timestamp}.js`,
        templateFile: `plop-templates/simple/tree/${treeType}/mockData.hbs`,
        data: {
          timestamp
        }
      }
    ]

    return actions
  }
}
