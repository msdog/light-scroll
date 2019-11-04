'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Scroll = function () {
  function Scroll(_ref) {
    var _this = this;

    var el = _ref.el,
        parent = _ref.parent,
        direction = _ref.direction,
        _ref$bar = _ref.bar,
        bar = _ref$bar === undefined ? {} : _ref$bar;

    _classCallCheck(this, Scroll);

    this.downHandle = function (evt) {
      // 记录状态
      if (_this.bar.x) _this.xbar.style.opacity = 1;
      if (_this.bar.y) _this.ybar.style.opacity = 1;
      _this._startTime = Date.now();
      _this._oldMouseX = _this._startX = _this.getEvt(evt)['clientX'];
      _this._oldMouseY = _this._startY = _this.getEvt(evt)['clientY'];
      !_this.isTouch && evt.preventDefault(); // 阻止拖拽|选择文本
      window.addEventListener('ontouchstart' in window ? 'touchmove' : 'mousemove', _this.moveHandle);
    };

    this.moveHandle = function (evt) {
      _this._backX = _this._backY = false;
      _this._lastMoveTime = Date.now(); // 处理停留
      if (!_this.isTouch) {
        _this.el.style.pointerEvents = 'none'; // 阻止点击
        evt.preventDefault(); // 阻止选择文本
        document.body.style.userSelect = 'none';
      }
      var newMouseX = _this.getEvt(evt)['clientX'];
      var newMouseY = _this.getEvt(evt)['clientY'];
      var distanceX = newMouseX - _this._oldMouseX;
      var distanceY = newMouseY - _this._oldMouseY;
      _this.direction.includes('x') && _this.ifDoElseDo(distanceX <= 0 && -_this.getTrackLength('x') >= _this.translateX || distanceX >= 0 && _this.translateX > 0, function () {
        _this._backX = true;
        distanceX *= 0.3;
      });
      _this.direction.includes('y') && _this.ifDoElseDo(distanceY <= 0 && -_this.getTrackLength('y') >= _this.translateY || distanceY >= 0 && _this.translateY > 0, function () {
        _this._backY = true;
        distanceY *= 0.3;
      });
      _this.translateX += distanceX;
      _this.translateY += distanceY;
      _this.scroll(0);
      _this._oldMouseX = newMouseX;
      _this._oldMouseY = newMouseY;
    };

    this.upHandle = function (evt) {
      var stopTime = Date.now() - _this._lastMoveTime;
      var speedX = void 0,
          speedY = void 0;
      if (stopTime > 30) {
        // 没有惯性
        speedX = speedY = 0;
        if (_this.bar.x) _this.xbar.style.opacity = 0;
        if (_this.bar.y) _this.ybar.style.opacity = 0;
      } else {
        var distanceX = _this.getEvt(evt)['clientX'] - _this._startX;
        var distanceY = _this.getEvt(evt)['clientY'] - _this._startY;
        var timeCost = Date.now() - _this._startTime; // 耗时
        speedX = distanceX / timeCost * 600; // 速度
        speedY = distanceY / timeCost * 600; // 速度
      }
      _this.inertiaAnimate(speedX, speedY);
      window.removeEventListener('mousemove', _this.moveHandle);
      window.removeEventListener('touchmove', _this.moveHandle);
      _this.el.style.pointerEvents = 'auto';
      document.body.style.userSelect = 'auto';
    };

    this.animateEnd = function () {
      _this.limitVal(-_this.getTrackLength('x'), 0, 'translateX');
      _this.limitVal(-_this.getTrackLength('y'), 0, 'translateY');
      _this.scroll();
      if (_this.bar.x) _this.xbar.style.opacity = 0;
      if (_this.bar.y) _this.ybar.style.opacity = 0;
      _this.el.removeEventListener('transitionend', _this.animateEnd);
    };

    this.getEvt = function (evt) {
      return _this.isTouch ? evt.changedTouches[0] : evt;
    };

    this.el = el;
    this.parent = parent;
    this.direction = direction || 'x';
    // transform init data
    this.translateX = 0;
    this.translateY = 0;
    this.isTouch = 'ontouchstart' in window;
    this.bar = bar;
  }

  _createClass(Scroll, [{
    key: 'init',
    value: function init() {
      var commonBarCss = 'opacity: 0;background-color: ' + (this.bar.bgc || 'rgba(0, 0, 0, 0.5)') + ';position: absolute;box-shadow:0 0 10px rgba(0,0,0,0.2);';
      if (this.bar.x) {
        this.xbar = document.createElement('div');
        this.xbar.style.cssText = commonBarCss + 'height: 2px;width:' + Math.pow(this.parent.clientWidth, 2) / this.getTrackLength('x') + 'px;bottom:0;left:0;';
        this.parent.append(this.xbar);
      }
      if (this.bar.y) {
        this.ybar = document.createElement('div');
        this.ybar.style.cssText = commonBarCss + 'width: 2px;height:' + Math.pow(this.parent.clientHeight, 2) / this.getTrackLength('y') + 'px;top:0;right:0;';
        this.parent.append(this.ybar);
      }
      this.el.addEventListener(this.isTouch ? 'touchstart' : 'mousedown', this.downHandle);
      if (!this.isTouch) this.el.style.userSelect = 'none';
      this.parent.style.cssText = 'position: relative;overflow: hidden;';
      window.addEventListener('mouseup', this.upHandle);
      window.addEventListener('touchend', this.upHandle);
      window.addEventListener('touchcancel', this.upHandle);
    }
  }, {
    key: 'inertiaAnimate',
    value: function inertiaAnimate(speedX, speedY) {
      var _this2 = this;

      var duration = 500;
      // 是否x轴
      this.direction.includes('x') && this.ifDoElseDo(this._backX, function () {
        // 已出界直接回弹
        duration = 800;
        _this2.limitVal(-_this2.getTrackLength('x'), 0, 'translateX');
      }, function () {
        _this2.translateX = _this2.translateX + speedX;
        _this2._backX = _this2.limitVal(-_this2.getTrackLength('x') - _this2.parent.clientWidth * 0.3, _this2.parent.clientWidth * 0.3, 'translateX');
      });
      // 是否y轴
      this.direction.includes('y') && this.ifDoElseDo(this._backY, function () {
        // 已出界直接回弹
        duration = 800;
        _this2.limitVal(-_this2.getTrackLength('y'), 0, 'translateY');
      }, function () {
        _this2.translateY = _this2.translateY + speedY;
        _this2._backY = _this2.limitVal(-_this2.getTrackLength('y') - _this2.parent.clientHeight * 0.3, _this2.parent.clientHeight * 0.3, 'translateY');
      });
      // 均未出界2500ms 否则500ms
      this.scroll(!this._backX && !this._backY ? 2500 : duration, !this._backX && !this._backY ? '0.23, 1, 0.32, 1' : '0.25, 0.46, 0.45, 0.94');
      this.el.addEventListener('transitionend', this.animateEnd);
    }
  }, {
    key: 'scroll',
    value: function scroll() {
      var duration = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 800;
      var bezier = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '0.165, 0.84, 0.44, 1';

      this.el.style['transition-timing-function'] = 'cubic-bezier(' + bezier + ')';
      this.el.style['transition-duration'] = duration + 'ms';
      var str = void 0;
      if (this.direction === 'x') str = this.translateX + 'px,0';
      if (this.direction === 'y') str = '0,' + this.translateY + 'px';
      if (this.direction === 'xy') str = this.translateX + 'px,' + this.translateY + 'px';
      this.el.style.transform = 'translate3d(' + str + ',0) scale(1)';
      // bar move
      if (this.bar.y) {
        this.ybar.style['transition-timing-function'] = 'cubic-bezier(' + bezier + ')';
        this.ybar.style['transition-duration'] = duration + 'ms';
        this.ybar.style.top = -this.translateY / this.getTrackLength('y') * (this.parent.clientHeight - this.ybar.clientHeight) + 'px';
      }
      if (this.bar.x) {
        this.xbar.style['transition-timing-function'] = 'cubic-bezier(' + bezier + ')';
        this.xbar.style['transition-duration'] = duration + 'ms';
        this.xbar.style.left = -this.translateX / this.getTrackLength('x') * (this.parent.clientWidth - this.xbar.clientWidth) + 'px';
      }
    }
  }, {
    key: 'getTrackLength',
    value: function getTrackLength(axis) {
      return axis === 'x' ? this.el.scrollWidth - this.parent.clientWidth : this.el.scrollHeight - this.parent.clientHeight;
    }
  }, {
    key: 'limitVal',
    value: function limitVal(min, max, translate) {
      if (this[translate] >= max) this[translate] = max;
      if (this[translate] <= min) this[translate] = min;
      return -this.getTrackLength(translate === 'translateX' ? 'x' : 'y') > this[translate] || this[translate] > 0;
    }
  }, {
    key: 'ifDoElseDo',
    value: function ifDoElseDo(condition, trueCb) {
      var falseCb = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function () {};

      condition ? trueCb() : falseCb();
    }
  }]);

  return Scroll;
}();

exports.default = Scroll;