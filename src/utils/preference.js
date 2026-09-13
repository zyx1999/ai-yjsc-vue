import Cookies from 'js-cookie'

// body上设置字体样式
export function setFontSize(val) {
  const fontClass = `fontSize${val}`
  const bodyClass = document.body.className
  if (!bodyClass) {
    document.body.className = fontClass
  } else {
    const fontClassLength = fontClass.length
    const bgClass = bodyClass.slice(fontClassLength)
    document.body.className = `${fontClass}${bgClass}`
  }
}
// 判断是否重置vant样式
export function resetVantStyle(resetFlg) {
  const styleClass = 'resetVantStyle'
  if (resetFlg) {
    document.body.classList.add(styleClass)
  } else {
    document.body.classList.remove(styleClass)
  }
}
export function setBgColor(color) {
  const colorList = ['#ffffff', '#339999', '#12b993', '#14589f', '#4381e6']
  const colorCalssList = ['colorDefault', 'colorDarkGreen', 'colorLightGreen', 'colorDarkBlue', 'colorLightBlue']
  let colorClass = ''
  colorList.forEach((item, index) => {
    if (item == color) {
      colorClass = colorCalssList[index]
    }
  })
  const bodyClass = document.body.className
  if (bodyClass.indexOf(' ') == -1) {
    document.body.className = `${bodyClass} ${colorClass}`
  } else {
    const spacePosition = bodyClass.indexOf(' ')
    const fontClass = bodyClass.slice(0, spacePosition)
    document.body.className = `${fontClass} ${colorClass}`
  }
}
// cookies存储，30天
export function setCookies(name, value, day) {
  if (day !== 0) {
    var expires = day * 24 * 60 * 60 * 1000
    var date = new Date(+new Date() + expires)
    document.cookie = name + '=' + escape(value) + ';expires=' + date.toUTCString()
  } else {
    document.cookie = name + '=' + escape(value)
  }
}

// 根据字段获取cookies值
export function getCookies(name) {
  return Cookies.get(name)
}

export default setFontSize
