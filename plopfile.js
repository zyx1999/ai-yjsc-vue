const viewGenerator = require('./plop-templates/view/prompt')
const componentGenerator = require('./plop-templates/component/prompt')
const table = require('./plop-templates/simple/table/prompt')
const form = require('./plop-templates/simple/form/prompt')
const tree = require('./plop-templates/simple/tree/prompt')

module.exports = function(plop) {
  plop.setGenerator('view', viewGenerator)
  plop.setGenerator('component', componentGenerator)
  plop.setGenerator('table', table)
  plop.setGenerator('form', form)
  plop.setGenerator('tree', tree)
}
