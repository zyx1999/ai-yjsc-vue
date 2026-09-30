// 基准大小
//var baseSize = 32;
// 设置 rem 函数
function setRem () {
  // 当前页面宽度相对于 750 宽的缩放比例（PC 端最大按 750 计，保证 1rem = 100px，样式按设计尺寸 1:1 输出）
  var width = Math.min(document.documentElement.clientWidth, 750)
  var scale = width / 7.5
  // 设置页面根节点字体大小
  //document.documentElement.style.fontSize = (baseSize * Math.min(scale, 2)) + 'px';
  document.documentElement.style.fontSize = scale + 'px';
}
// 初始化
setRem();
// 改变窗口大小时重新设置 rem
window.onresize = function () {
  setRem();
}