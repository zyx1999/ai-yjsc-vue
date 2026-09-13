const { notEmpty } = require('../../utils.js')

module.exports = {
  description: 'generate a form',
  prompts: [
    {
      type: 'list',
      name: 'formType',
      message: '选择表单形式',
      choices: [
        {
          name: '同步表单',
          value: 'syncForm'
        },
        {
          name: '异步表单',
          value: 'asyncForm'
        }
      ]
    },
    {
      type: 'input',
      name: 'name',
      message: '请填写文件名',
      validate: notEmpty('name')
    }
  ],
  actions: data => {
    const name = '{{name}}'
    const formType = data.formType
    const timestamp = new Date().getTime()
    if (formType === 'syncForm') {
      // TODO:判断src/api/upload.js和src/api/staffSelect.js是否存在
      const actions = [
        {
          type: 'add',
          path: `src/views/${name}/index.vue`,
          templateFile: `plop-templates/simple/form/${formType}/index.hbs`,
          data: {
            timestamp
          }
        },
        {
          type: 'add',
          path: `src/api/upload_demo_for_syncForm${timestamp}.js`,
          templateFile: `plop-templates/simple/form/${formType}/upload.hbs`,
          data: {
            timestamp
          }
        },
        {
          type: 'add',
          path: `src/api/staffSelect_demo_for_syncForm${timestamp}.js`,
          templateFile: `plop-templates/simple/form/${formType}/staffselect.hbs`
        },
        {
          type: 'add',
          path: `mock/uploadData_demo_for_syncForm${timestamp}.js`,
          templateFile: `plop-templates/simple/form/${formType}/uploadData.hbs`,
          data: {
            timestamp
          }
        },
        {
          type: 'add',
          path: `mock/staffSelectData_demo_for_syncForm${timestamp}/index.js`,
          templateFile: `plop-templates/simple/form/${formType}/staffSelectData.hbs`,
          data: {
            timestamp
          }
        },
        {
          type: 'add',
          path: `mock/staffSelectData_demo_for_syncForm${timestamp}/json/allLoadData1.json`,
          templateFile: `plop-templates/simple/form/${formType}/allLoadData1.hbs`
        },
        {
          type: 'add',
          path: `mock/staffSelectData_demo_for_syncForm${timestamp}/json/allLoadData2.json`,
          templateFile: `plop-templates/simple/form/${formType}/allLoadData2.hbs`
        },
        {
          type: 'add',
          path: `mock/staffSelectData_demo_for_syncForm${timestamp}/json/data.json`,
          templateFile: `plop-templates/simple/form/${formType}/data.hbs`
        },
        {
          type: 'add',
          path: `mock/staffSelectData_demo_for_syncForm${timestamp}/json/data1.json`,
          templateFile: `plop-templates/simple/form/${formType}/data1.hbs`
        },
        {
          type: 'add',
          path: `mock/staffSelectData_demo_for_syncForm${timestamp}/json/data2.json`,
          templateFile: `plop-templates/simple/form/${formType}/data2.hbs`
        }
      ]
      return actions
    }

    if (formType === 'asyncForm') {
      const actions = [
        {
          type: 'add',
          path: `src/views/${name}/index.vue`,
          templateFile: `plop-templates/simple/form/${formType}/index.hbs`,
          data: {
            timestamp
          }
        },
        {
          type: 'add',
          path: `src/api/upload_demo_for_asyncForm${timestamp}.js`,
          templateFile: `plop-templates/simple/form/${formType}/upload.hbs`
        },
        {
          type: 'add',
          path: `src/api/staffSelect_demo_for_asyncForm${timestamp}.js`,
          templateFile: `plop-templates/simple/form/${formType}/staffselect.hbs`
        },
        {
          type: 'add',
          path: `mock/uploadData_demo_for_syncForm${timestamp}.js`,
          templateFile: `plop-templates/simple/form/${formType}/uploadData.hbs`,
          data: {
            timestamp
          }
        },
        {
          type: 'add',
          path: `mock/staffSelectData_demo_for_syncForm${timestamp}/index.js`,
          templateFile: `plop-templates/simple/form/${formType}/staffSelectData.hbs`,
          data: {
            timestamp
          }
        },
        {
          type: 'add',
          path: `mock/staffSelectData_demo_for_syncForm${timestamp}/json/allLoadData1.json`,
          templateFile: `plop-templates/simple/form/${formType}/allLoadData1.hbs`
        },
        {
          type: 'add',
          path: `mock/staffSelectData_demo_for_syncForm${timestamp}/json/allLoadData2.json`,
          templateFile: `plop-templates/simple/form/${formType}/allLoadData2.hbs`
        },
        {
          type: 'add',
          path: `mock/staffSelectData_demo_for_syncForm${timestamp}/json/data.json`,
          templateFile: `plop-templates/simple/form/${formType}/data.hbs`
        },
        {
          type: 'add',
          path: `mock/staffSelectData_demo_for_syncForm${timestamp}/json/data1.json`,
          templateFile: `plop-templates/simple/form/${formType}/data1.hbs`
        },
        {
          type: 'add',
          path: `mock/staffSelectData_demo_for_syncForm${timestamp}/json/data2.json`,
          templateFile: `plop-templates/simple/form/${formType}/data2.hbs`
        }
      ]
      return actions
    }
  }
}
