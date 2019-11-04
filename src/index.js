export default class Scroll {
  constructor ({ el, parent, direction, bar = {} }) {
    this.el = el
    this.parent = parent
    this.direction = direction || 'x'
    // transform init data
    this.translateX = 0
    this.translateY = 0
    this.isTouch = 'ontouchstart' in window
    this.bar = bar
  }

  init () {
    let commonBarCss = `opacity: 0;background-color: ${this.bar.bgc || 'rgba(0, 0, 0, 0.5)'};position: absolute;box-shadow:0 0 10px rgba(0,0,0,0.2);`
    if (this.bar.x) {
      this.xbar = document.createElement('div')
      this.xbar.style.cssText = `${commonBarCss}height: 2px;width:${this.parent.clientWidth ** 2 / this.getTrackLength('x')}px;bottom:0;left:0;`
      this.parent.append(this.xbar)
    }
    if (this.bar.y) {
      this.ybar = document.createElement('div')
      this.ybar.style.cssText = `${commonBarCss}width: 2px;height:${this.parent.clientHeight ** 2 / this.getTrackLength('y')}px;top:0;right:0;`
      this.parent.append(this.ybar)
    }
    this.el.addEventListener(
      this.isTouch ? 'touchstart' : 'mousedown',
      this.downHandle
    )
    if (!this.isTouch) this.el.style.userSelect = 'none'
    this.parent.style.cssText = 'position: relative;overflow: hidden;'
    window.addEventListener('mouseup', this.upHandle)
    window.addEventListener('touchend', this.upHandle)
    window.addEventListener('touchcancel', this.upHandle)
  }
  downHandle = (evt) => {
    // 记录状态
    if (this.bar.x) this.xbar.style.opacity = 1
    if (this.bar.y) this.ybar.style.opacity = 1
    this._startTime = Date.now()
    this._oldMouseX = this._startX = this.getEvt(evt)['clientX']
    this._oldMouseY = this._startY = this.getEvt(evt)['clientY']
    !this.isTouch && evt.preventDefault() // 阻止拖拽|选择文本
    window.addEventListener(
      'ontouchstart' in window ? 'touchmove' : 'mousemove',
      this.moveHandle
    )
  }
  moveHandle = (evt) => {
    this._backX = this._backY = false
    this._lastMoveTime = Date.now() // 处理停留
    if (!this.isTouch) {
      this.el.style.pointerEvents = 'none' // 阻止点击
      evt.preventDefault() // 阻止选择文本
      document.body.style.userSelect = 'none'
    }
    const newMouseX = this.getEvt(evt)['clientX']
    const newMouseY = this.getEvt(evt)['clientY']
    let distanceX = newMouseX - this._oldMouseX
    let distanceY = newMouseY - this._oldMouseY
    this.direction.includes('x') && this.ifDoElseDo((distanceX <= 0 && -this.getTrackLength('x') >= this.translateX) || (distanceX >= 0 && this.translateX > 0), () => {
      this._backX = true
      distanceX *= 0.3
    })
    this.direction.includes('y') && this.ifDoElseDo((distanceY <= 0 && -this.getTrackLength('y') >= this.translateY) || (distanceY >= 0 && this.translateY > 0), () => {
      this._backY = true
      distanceY *= 0.3
    })
    this.translateX += distanceX
    this.translateY += distanceY
    this.scroll(0)
    this._oldMouseX = newMouseX
    this._oldMouseY = newMouseY
  }
  upHandle = (evt) => {
    const stopTime = Date.now() - this._lastMoveTime
    let speedX, speedY
    if (stopTime > 30) { // 没有惯性
      speedX = speedY = 0
      if (this.bar.x) this.xbar.style.opacity = 0
      if (this.bar.y) this.ybar.style.opacity = 0
    } else {
      let distanceX = this.getEvt(evt)['clientX'] - this._startX
      let distanceY = this.getEvt(evt)['clientY'] - this._startY
      const timeCost = Date.now() - this._startTime // 耗时
      speedX = (distanceX / timeCost) * 600 // 速度
      speedY = (distanceY / timeCost) * 600 // 速度
    }
    this.inertiaAnimate(speedX, speedY)
    window.removeEventListener('mousemove', this.moveHandle)
    window.removeEventListener('touchmove', this.moveHandle)
    this.el.style.pointerEvents = 'auto'
    document.body.style.userSelect = 'auto'
  }
  inertiaAnimate (speedX, speedY) {
    let duration = 500
    // 是否x轴
    this.direction.includes('x') && this.ifDoElseDo(this._backX, () => { // 已出界直接回弹
      duration = 800
      this.limitVal(-this.getTrackLength('x'), 0, 'translateX')
    }, () => {
      this.translateX = this.translateX + speedX
      this._backX = this.limitVal(-this.getTrackLength('x') - this.parent.clientWidth * 0.3, this.parent.clientWidth * 0.3, 'translateX')
    })
    // 是否y轴
    this.direction.includes('y') && this.ifDoElseDo(this._backY, () => { // 已出界直接回弹
      duration = 800
      this.limitVal(-this.getTrackLength('y'), 0, 'translateY')
    }, () => {
      this.translateY = this.translateY + speedY
      this._backY = this.limitVal(-this.getTrackLength('y') - this.parent.clientHeight * 0.3, this.parent.clientHeight * 0.3, 'translateY')
    })
    // 均未出界2500ms 否则500ms
    this.scroll((!this._backX && !this._backY) ? 2500 : duration, !this._backX && !this._backY ? '0.23, 1, 0.32, 1' : '0.25, 0.46, 0.45, 0.94')
    this.el.addEventListener('transitionend', this.animateEnd)
  }
  animateEnd = () => {
    this.limitVal(-this.getTrackLength('x'), 0, 'translateX')
    this.limitVal(-this.getTrackLength('y'), 0, 'translateY')
    this.scroll()
    if (this.bar.x) this.xbar.style.opacity = 0
    if (this.bar.y) this.ybar.style.opacity = 0
    this.el.removeEventListener('transitionend', this.animateEnd)
  }
  scroll (duration = 800, bezier = '0.165, 0.84, 0.44, 1') {
    this.el.style['transition-timing-function'] = `cubic-bezier(${bezier})`
    this.el.style['transition-duration'] = duration + 'ms'
    let str
    if (this.direction === 'x') str = `${this.translateX}px,0`
    if (this.direction === 'y') str = `0,${this.translateY}px`
    if (this.direction === 'xy') str = `${this.translateX}px,${this.translateY}px`
    this.el.style.transform = `translate3d(${str},0) scale(1)`
    // bar move
    if (this.bar.y) {
      this.ybar.style['transition-timing-function'] = `cubic-bezier(${bezier})`
      this.ybar.style['transition-duration'] = duration + 'ms'
      this.ybar.style.top = -this.translateY / this.getTrackLength('y') * (this.parent.clientHeight - this.ybar.clientHeight) + 'px'
    }
    if (this.bar.x) {
      this.xbar.style['transition-timing-function'] = `cubic-bezier(${bezier})`
      this.xbar.style['transition-duration'] = duration + 'ms'
      this.xbar.style.left = -this.translateX / this.getTrackLength('x') * (this.parent.clientWidth - this.xbar.clientWidth) + 'px'
    }
  }
  getEvt = (evt) => {
    return this.isTouch ? evt.changedTouches[0] : evt
  }
  getTrackLength (axis) {
    return axis === 'x' ? this.el.scrollWidth - this.parent.clientWidth
      : this.el.scrollHeight - this.parent.clientHeight
  }
  limitVal (min, max, translate) {
    if (this[translate] >= max) this[translate] = max
    if (this[translate] <= min) this[translate] = min
    return (-this.getTrackLength(translate === 'translateX' ? 'x' : 'y') > this[translate] || this[translate] > 0)
  }
  ifDoElseDo (condition, trueCb, falseCb = () => {}) {
    condition ? trueCb() : falseCb()
  }
}
