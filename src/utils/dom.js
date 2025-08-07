/**
 * DOM操作工具库
 * 提供常用的DOM操作、事件处理、样式操作等功能
 */

/**
 * 元素选择器选项
 * @typedef {Object} SelectorOptions
 * @property {Element} [context=document] - 查找上下文
 * @property {boolean} [cache=false] - 是否缓存结果
 */

/**
 * 动画选项
 * @typedef {Object} AnimationOptions
 * @property {number} [duration=300] - 动画持续时间（毫秒）
 * @property {string} [easing='ease'] - 缓动函数
 * @property {Function} [onComplete] - 完成回调
 * @property {Function} [onUpdate] - 更新回调
 */

/**
 * 滚动选项
 * @typedef {Object} ScrollOptions
 * @property {string} [behavior='smooth'] - 滚动行为
 * @property {string} [block='start'] - 垂直对齐
 * @property {string} [inline='nearest'] - 水平对齐
 */

// 缓存对象
const elementCache = new Map()
const eventListeners = new WeakMap()

/**
 * 选择单个元素
 * @param {string|Element} selector - 选择器或元素
 * @param {SelectorOptions} [options={}] - 选项
 * @returns {Element|null} 元素
 */
export const $ = (selector, options = {}) => {
  const { context = document, cache = false } = options

  if (!selector) {
    return null
  }

  // 如果已经是元素，直接返回
  if (selector instanceof Element) {
    return selector
  }

  // 检查缓存
  if (cache && elementCache.has(selector)) {
    return elementCache.get(selector)
  }

  try {
    const element = context.querySelector(selector)

    if (cache && element) {
      elementCache.set(selector, element)
    }

    return element
  } catch (error) {
    console.warn(`Invalid selector: ${selector}`, error)
    return null
  }
}

/**
 * 选择多个元素
 * @param {string|NodeList|Array} selector - 选择器或元素列表
 * @param {SelectorOptions} [options={}] - 选项
 * @returns {Array<Element>} 元素数组
 */
export const $$ = (selector, options = {}) => {
  const { context = document, cache = false } = options

  if (!selector) {
    return []
  }

  // 如果已经是数组或NodeList，转换为数组返回
  if (Array.isArray(selector) || selector instanceof NodeList) {
    return Array.from(selector)
  }

  // 如果是单个元素，返回包含该元素的数组
  if (selector instanceof Element) {
    return [selector]
  }

  // 检查缓存
  const cacheKey = `all:${selector}`
  if (cache && elementCache.has(cacheKey)) {
    return elementCache.get(cacheKey)
  }

  try {
    const elements = Array.from(context.querySelectorAll(selector))

    if (cache) {
      elementCache.set(cacheKey, elements)
    }

    return elements
  } catch (error) {
    console.warn(`Invalid selector: ${selector}`, error)
    return []
  }
}

/**
 * 清除选择器缓存
 * @param {string} [selector] - 特定选择器，不传则清除所有
 */
export const clearCache = (selector) => {
  if (selector) {
    elementCache.delete(selector)
    elementCache.delete(`all:${selector}`)
  } else {
    elementCache.clear()
  }
}

/**
 * 检查元素是否存在
 * @param {string|Element} selector - 选择器或元素
 * @param {Element} [context=document] - 查找上下文
 * @returns {boolean} 是否存在
 */
export const exists = (selector, context = document) => {
  return $(selector, { context }) !== null
}

/**
 * 创建元素
 * @param {string} tagName - 标签名
 * @param {Object} [attributes={}] - 属性对象
 * @param {string|Element|Array} [children] - 子元素
 * @returns {Element} 创建的元素
 */
export const createElement = (tagName, attributes = {}, children) => {
  const element = document.createElement(tagName)

  // 设置属性
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'className' || key === 'class') {
      element.className = value
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value)
    } else if (key === 'dataset' && typeof value === 'object') {
      for (const [dataKey, dataValue] of Object.entries(value)) {
        element.dataset[dataKey] = dataValue
      }
    } else if (key.startsWith('on') && typeof value === 'function') {
      // 事件监听器
      const eventType = key.slice(2).toLowerCase()
      element.addEventListener(eventType, value)
    } else {
      element.setAttribute(key, value)
    }
  }

  // 添加子元素
  if (children !== undefined) {
    appendChild(element, children)
  }

  return element
}

/**
 * 添加子元素
 * @param {Element} parent - 父元素
 * @param {string|Element|Array} children - 子元素
 */
export const appendChild = (parent, children) => {
  if (!parent || !(parent instanceof Element)) {
    return
  }

  if (typeof children === 'string') {
    parent.textContent = children
  } else if (children instanceof Element) {
    parent.appendChild(children)
  } else if (Array.isArray(children)) {
    children.forEach(child => appendChild(parent, child))
  }
}

/**
 * 移除元素
 * @param {string|Element|Array} selector - 选择器、元素或元素数组
 */
export const remove = (selector) => {
  const elements = Array.isArray(selector) ? selector : $$(selector)

  elements.forEach(element => {
    if (element && element.parentNode) {
      // 清理事件监听器
      const listeners = eventListeners.get(element)
      if (listeners) {
        listeners.forEach(({ type, handler, options }) => {
          element.removeEventListener(type, handler, options)
        })
        eventListeners.delete(element)
      }

      element.parentNode.removeChild(element)
    }
  })
}

/**
 * 添加CSS类
 * @param {string|Element|Array} selector - 选择器、元素或元素数组
 * @param {string|Array} classNames - 类名
 */
export const addClass = (selector, classNames) => {
  const elements = Array.isArray(selector) ? selector : $$(selector)
  const classes = Array.isArray(classNames) ? classNames : [classNames]

  elements.forEach(element => {
    if (element && element.classList) {
      element.classList.add(...classes)
    }
  })
}

/**
 * 移除CSS类
 * @param {string|Element|Array} selector - 选择器、元素或元素数组
 * @param {string|Array} classNames - 类名
 */
export const removeClass = (selector, classNames) => {
  const elements = Array.isArray(selector) ? selector : $$(selector)
  const classes = Array.isArray(classNames) ? classNames : [classNames]

  elements.forEach(element => {
    if (element && element.classList) {
      element.classList.remove(...classes)
    }
  })
}

/**
 * 切换CSS类
 * @param {string|Element|Array} selector - 选择器、元素或元素数组
 * @param {string} className - 类名
 * @param {boolean} [force] - 强制添加或移除
 * @returns {boolean} 是否添加了类
 */
export const toggleClass = (selector, className, force) => {
  const elements = Array.isArray(selector) ? selector : $$(selector)
  let result = false

  elements.forEach(element => {
    if (element && element.classList) {
      result = element.classList.toggle(className, force)
    }
  })

  return result
}

/**
 * 检查是否包含CSS类
 * @param {string|Element} selector - 选择器或元素
 * @param {string} className - 类名
 * @returns {boolean} 是否包含类
 */
export const hasClass = (selector, className) => {
  const element = $(selector)
  return element && element.classList && element.classList.contains(className)
}

/**
 * 设置或获取元素属性
 * @param {string|Element|Array} selector - 选择器、元素或元素数组
 * @param {string|Object} attr - 属性名或属性对象
 * @param {any} [value] - 属性值
 * @returns {any} 获取时返回属性值
 */
export const attr = (selector, attr, value) => {
  const elements = Array.isArray(selector) ? selector : $$(selector)

  if (elements.length === 0) {
    return undefined
  }

  // 获取属性
  if (typeof attr === 'string' && value === undefined) {
    return elements[0].getAttribute(attr)
  }

  // 设置属性
  elements.forEach(element => {
    if (typeof attr === 'object') {
      // 批量设置
      for (const [key, val] of Object.entries(attr)) {
        element.setAttribute(key, val)
      }
    } else {
      // 单个设置
      element.setAttribute(attr, value)
    }
  })

  return elements
}

/**
 * 移除元素属性
 * @param {string|Element|Array} selector - 选择器、元素或元素数组
 * @param {string|Array} attributes - 属性名
 */
export const removeAttr = (selector, attributes) => {
  const elements = Array.isArray(selector) ? selector : $$(selector)
  const attrs = Array.isArray(attributes) ? attributes : [attributes]

  elements.forEach(element => {
    attrs.forEach(attr => {
      element.removeAttribute(attr)
    })
  })
}

/**
 * 设置或获取元素样式
 * @param {string|Element|Array} selector - 选择器、元素或元素数组
 * @param {string|Object} prop - 样式属性或样式对象
 * @param {string} [value] - 样式值
 * @returns {string} 获取时返回样式值
 */
export const css = (selector, prop, value) => {
  const elements = Array.isArray(selector) ? selector : $$(selector)

  if (elements.length === 0) {
    return undefined
  }

  // 获取样式
  if (typeof prop === 'string' && value === undefined) {
    return getComputedStyle(elements[0])[prop]
  }

  // 设置样式
  elements.forEach(element => {
    if (typeof prop === 'object') {
      // 批量设置
      Object.assign(element.style, prop)
    } else {
      // 单个设置
      element.style[prop] = value
    }
  })

  return elements
}

/**
 * 显示元素
 * @param {string|Element|Array} selector - 选择器、元素或元素数组
 * @param {string} [display='block'] - 显示方式
 */
export const show = (selector, display = 'block') => {
  css(selector, 'display', display)
}

/**
 * 隐藏元素
 * @param {string|Element|Array} selector - 选择器、元素或元素数组
 */
export const hide = (selector) => {
  css(selector, 'display', 'none')
}

/**
 * 切换元素显示/隐藏
 * @param {string|Element|Array} selector - 选择器、元素或元素数组
 * @param {string} [display='block'] - 显示方式
 */
export const toggle = (selector, display = 'block') => {
  const elements = Array.isArray(selector) ? selector : $$(selector)

  elements.forEach(element => {
    const currentDisplay = getComputedStyle(element).display
    if (currentDisplay === 'none') {
      element.style.display = display
    } else {
      element.style.display = 'none'
    }
  })
}

/**
 * 检查元素是否可见
 * @param {string|Element} selector - 选择器或元素
 * @returns {boolean} 是否可见
 */
export const isVisible = (selector) => {
  const element = $(selector)
  if (!element) return false

  const style = getComputedStyle(element)
  return style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0'
}

/**
 * 添加事件监听器
 * @param {string|Element|Array} selector - 选择器、元素或元素数组
 * @param {string} type - 事件类型
 * @param {Function} handler - 事件处理函数
 * @param {Object|boolean} [options] - 事件选项
 */
export const on = (selector, type, handler, options) => {
  const elements = Array.isArray(selector) ? selector : $$(selector)

  elements.forEach(element => {
    element.addEventListener(type, handler, options)

    // 记录事件监听器以便后续清理
    if (!eventListeners.has(element)) {
      eventListeners.set(element, [])
    }
    eventListeners.get(element).push({ type, handler, options })
  })
}

/**
 * 移除事件监听器
 * @param {string|Element|Array} selector - 选择器、元素或元素数组
 * @param {string} type - 事件类型
 * @param {Function} handler - 事件处理函数
 * @param {Object|boolean} [options] - 事件选项
 */
export const off = (selector, type, handler, options) => {
  const elements = Array.isArray(selector) ? selector : $$(selector)

  elements.forEach(element => {
    element.removeEventListener(type, handler, options)

    // 从记录中移除
    const listeners = eventListeners.get(element)
    if (listeners) {
      const index = listeners.findIndex(listener =>
        listener.type === type &&
        listener.handler === handler &&
        listener.options === options
      )
      if (index !== -1) {
        listeners.splice(index, 1)
      }
    }
  })
}

/**
 * 触发事件
 * @param {string|Element|Array} selector - 选择器、元素或元素数组
 * @param {string} type - 事件类型
 * @param {Object} [detail] - 事件详情
 */
export const trigger = (selector, type, detail) => {
  const elements = Array.isArray(selector) ? selector : $$(selector)

  elements.forEach(element => {
    const event = new CustomEvent(type, {
      detail,
      bubbles: true,
      cancelable: true
    })
    element.dispatchEvent(event)
  })
}

/**
 * 事件委托
 * @param {string|Element} container - 容器选择器或元素
 * @param {string} selector - 目标选择器
 * @param {string} type - 事件类型
 * @param {Function} handler - 事件处理函数
 * @param {Object|boolean} [options] - 事件选项
 */
export const delegate = (container, selector, type, handler, options) => {
  const containerElement = $(container)
  if (!containerElement) return

  const delegateHandler = (event) => {
    const target = event.target.closest(selector)
    if (target && containerElement.contains(target)) {
      handler.call(target, event)
    }
  }

  containerElement.addEventListener(type, delegateHandler, options)

  // 记录委托事件
  if (!eventListeners.has(containerElement)) {
    eventListeners.set(containerElement, [])
  }
  eventListeners.get(containerElement).push({
    type,
    handler: delegateHandler,
    options,
    isDelegate: true,
    originalHandler: handler,
    selector
  })
}

/**
 * 获取元素位置信息
 * @param {string|Element} selector - 选择器或元素
 * @returns {Object} 位置信息
 */
export const getPosition = (selector) => {
  const element = $(selector)
  if (!element) return null

  const rect = element.getBoundingClientRect()
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

  return {
    top: rect.top + scrollTop,
    left: rect.left + scrollLeft,
    right: rect.right + scrollLeft,
    bottom: rect.bottom + scrollTop,
    width: rect.width,
    height: rect.height,
    x: rect.x + scrollLeft,
    y: rect.y + scrollTop
  }
}

/**
 * 获取元素相对于视口的位置
 * @param {string|Element} selector - 选择器或元素
 * @returns {Object} 视口位置信息
 */
export const getViewportPosition = (selector) => {
  const element = $(selector)
  if (!element) return null

  return element.getBoundingClientRect()
}

/**
 * 滚动到元素
 * @param {string|Element} selector - 选择器或元素
 * @param {ScrollOptions} [options={}] - 滚动选项
 */
export const scrollTo = (selector, options = {}) => {
  const element = $(selector)
  if (!element) return

  element.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
    inline: 'nearest',
    ...options
  })
}

/**
 * 滚动到页面顶部
 * @param {ScrollOptions} [options={}] - 滚动选项
 */
export const scrollToTop = (options = {}) => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'smooth',
    ...options
  })
}

/**
 * 滚动到页面底部
 * @param {ScrollOptions} [options={}] - 滚动选项
 */
export const scrollToBottom = (options = {}) => {
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    left: 0,
    behavior: 'smooth',
    ...options
  })
}

/**
 * 检查元素是否在视口中
 * @param {string|Element} selector - 选择器或元素
 * @param {number} [threshold=0] - 阈值（0-1）
 * @returns {boolean} 是否在视口中
 */
export const isInViewport = (selector, threshold = 0) => {
  const element = $(selector)
  if (!element) return false

  const rect = element.getBoundingClientRect()
  const windowHeight = window.innerHeight || document.documentElement.clientHeight
  const windowWidth = window.innerWidth || document.documentElement.clientWidth

  const verticalThreshold = windowHeight * threshold
  const horizontalThreshold = windowWidth * threshold

  return (
    rect.top >= -verticalThreshold &&
    rect.left >= -horizontalThreshold &&
    rect.bottom <= windowHeight + verticalThreshold &&
    rect.right <= windowWidth + horizontalThreshold
  )
}

/**
 * 简单动画函数
 * @param {string|Element} selector - 选择器或元素
 * @param {Object} properties - 动画属性
 * @param {AnimationOptions} [options={}] - 动画选项
 * @returns {Promise} 动画Promise
 */
export const animate = (selector, properties, options = {}) => {
  return new Promise((resolve) => {
    const element = $(selector)
    if (!element) {
      resolve()
      return
    }

    const {
      duration = 300,
      easing = 'ease',
      onComplete,
      onUpdate
    } = options

    // 获取初始值
    const startValues = {}
    const endValues = {}

    for (const prop in properties) {
      const currentValue = parseFloat(getComputedStyle(element)[prop]) || 0
      startValues[prop] = currentValue
      endValues[prop] = parseFloat(properties[prop])
    }

    const startTime = performance.now()

    const step = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // 简单的缓动函数
      let easedProgress = progress
      if (easing === 'ease-in') {
        easedProgress = progress * progress
      } else if (easing === 'ease-out') {
        easedProgress = 1 - (1 - progress) * (1 - progress)
      } else if (easing === 'ease-in-out') {
        easedProgress = progress < 0.5
          ? 2 * progress * progress
          : 1 - 2 * (1 - progress) * (1 - progress)
      }

      // 更新样式
      for (const prop in properties) {
        const startValue = startValues[prop]
        const endValue = endValues[prop]
        const currentValue = startValue + (endValue - startValue) * easedProgress

        element.style[prop] = currentValue + (prop.includes('opacity') ? '' : 'px')
      }

      // 调用更新回调
      if (onUpdate && typeof onUpdate === 'function') {
        onUpdate(easedProgress, element)
      }

      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        // 动画完成
        if (onComplete && typeof onComplete === 'function') {
          onComplete(element)
        }
        resolve(element)
      }
    }

    requestAnimationFrame(step)
  })
}

/**
 * 淡入动画
 * @param {string|Element} selector - 选择器或元素
 * @param {AnimationOptions} [options={}] - 动画选项
 * @returns {Promise} 动画Promise
 */
export const fadeIn = (selector, options = {}) => {
  const element = $(selector)
  if (!element) return Promise.resolve()

  element.style.opacity = '0'
  element.style.display = 'block'

  return animate(selector, { opacity: 1 }, options)
}

/**
 * 淡出动画
 * @param {string|Element} selector - 选择器或元素
 * @param {AnimationOptions} [options={}] - 动画选项
 * @returns {Promise} 动画Promise
 */
export const fadeOut = (selector, options = {}) => {
  const originalOnComplete = options.onComplete

  return animate(selector, { opacity: 0 }, {
    ...options,
    onComplete: (element) => {
      element.style.display = 'none'
      if (originalOnComplete) {
        originalOnComplete(element)
      }
    }
  })
}

/**
 * 滑入动画
 * @param {string|Element} selector - 选择器或元素
 * @param {AnimationOptions} [options={}] - 动画选项
 * @returns {Promise} 动画Promise
 */
export const slideDown = (selector, options = {}) => {
  const element = $(selector)
  if (!element) return Promise.resolve()

  const originalHeight = element.scrollHeight
  element.style.height = '0'
  element.style.overflow = 'hidden'
  element.style.display = 'block'

  return animate(selector, { height: originalHeight }, {
    ...options,
    onComplete: (el) => {
      el.style.height = ''
      el.style.overflow = ''
      if (options.onComplete) {
        options.onComplete(el)
      }
    }
  })
}

/**
 * 滑出动画
 * @param {string|Element} selector - 选择器或元素
 * @param {AnimationOptions} [options={}] - 动画选项
 * @returns {Promise} 动画Promise
 */
export const slideUp = (selector, options = {}) => {
  const element = $(selector)
  if (!element) return Promise.resolve()

  element.style.overflow = 'hidden'

  return animate(selector, { height: 0 }, {
    ...options,
    onComplete: (el) => {
      el.style.display = 'none'
      el.style.height = ''
      el.style.overflow = ''
      if (options.onComplete) {
        options.onComplete(el)
      }
    }
  })
}

export default {
  $,
  $$,
  clearCache,
  exists,
  createElement,
  appendChild,
  remove,
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  attr,
  removeAttr,
  css,
  show,
  hide,
  toggle,
  isVisible,
  on,
  off,
  trigger,
  delegate,
  getPosition,
  getViewportPosition,
  scrollTo,
  scrollToTop,
  scrollToBottom,
  isInViewport,
  animate,
  fadeIn,
  fadeOut,
  slideDown,
  slideUp
}