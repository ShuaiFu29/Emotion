/**
 * 事件总线库
 * 提供全局事件发布订阅功能，用于组件间通信
 */

/**
 * 事件监听器信息
 * @typedef {Object} EventListener
 * @property {Function} handler - 事件处理函数
 * @property {Object} [options] - 监听器选项
 * @property {boolean} [options.once=false] - 是否只执行一次
 * @property {number} [options.priority=0] - 优先级（数字越大优先级越高）
 * @property {string} [options.namespace] - 命名空间
 * @property {Object} [options.context] - 执行上下文
 */

/**
 * 事件总线类
 */
class EventBus {
  constructor() {
    // 事件监听器映射
    this.events = new Map()
    // 最大监听器数量
    this.maxListeners = 100
    // 调试模式
    this.debug = false
    // 事件历史记录
    this.history = []
    // 最大历史记录数量
    this.maxHistory = 50
  }

  /**
   * 设置最大监听器数量
   * @param {number} max - 最大数量
   */
  setMaxListeners(max) {
    this.maxListeners = max
  }

  /**
   * 设置调试模式
   * @param {boolean} enabled - 是否启用
   */
  setDebug(enabled) {
    this.debug = enabled
  }

  /**
   * 添加事件监听器
   * @param {string} event - 事件名称
   * @param {Function} handler - 事件处理函数
   * @param {Object} [options={}] - 监听器选项
   * @returns {Function} 取消监听的函数
   */
  on(event, handler, options = {}) {
    if (typeof event !== 'string' || !event.trim()) {
      throw new Error('事件名称必须是非空字符串')
    }

    if (typeof handler !== 'function') {
      throw new Error('事件处理函数必须是函数')
    }

    // 获取或创建事件监听器数组
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }

    const listeners = this.events.get(event)

    // 检查监听器数量限制
    if (listeners.length >= this.maxListeners) {
      console.warn(`事件 "${event}" 的监听器数量已达到最大限制 ${this.maxListeners}`)
    }

    // 创建监听器对象
    const listener = {
      handler,
      options: {
        once: false,
        priority: 0,
        namespace: null,
        context: null,
        ...options
      },
      id: this._generateId()
    }

    // 按优先级插入
    const insertIndex = listeners.findIndex(l => l.options.priority < listener.options.priority)
    if (insertIndex === -1) {
      listeners.push(listener)
    } else {
      listeners.splice(insertIndex, 0, listener)
    }

    if (this.debug) {
      // console.log(`[EventBus] 添加监听器: ${event}`, listener)
    }

    // 返回取消监听的函数
    return () => this.off(event, handler, options)
  }

  /**
   * 添加一次性事件监听器
   * @param {string} event - 事件名称
   * @param {Function} handler - 事件处理函数
   * @param {Object} [options={}] - 监听器选项
   * @returns {Function} 取消监听的函数
   */
  once(event, handler, options = {}) {
    return this.on(event, handler, { ...options, once: true })
  }

  /**
   * 移除事件监听器
   * @param {string} event - 事件名称
   * @param {Function} [handler] - 事件处理函数（不传则移除所有）
   * @param {Object} [options={}] - 监听器选项
   */
  off(event, handler, options = {}) {
    if (!this.events.has(event)) {
      return
    }

    const listeners = this.events.get(event)

    if (!handler) {
      // 移除所有监听器
      listeners.length = 0
      if (this.debug) {
        // console.log(`[EventBus] 移除所有监听器: ${event}`)
      }
      return
    }

    // 移除特定监听器
    for (let i = listeners.length - 1; i >= 0; i--) {
      const listener = listeners[i]
      if (listener.handler === handler) {
        // 检查命名空间匹配
        if (options.namespace && listener.options.namespace !== options.namespace) {
          continue
        }
        
        listeners.splice(i, 1)
        if (this.debug) {
          // console.log(`[EventBus] 移除监听器: ${event}`, listener)
        }
      }
    }

    // 如果没有监听器了，删除事件
    if (listeners.length === 0) {
      this.events.delete(event)
    }
  }

  /**
   * 移除命名空间下的所有监听器
   * @param {string} namespace - 命名空间
   */
  offNamespace(namespace) {
    if (!namespace) {
      return
    }

    for (const [event, listeners] of this.events.entries()) {
      for (let i = listeners.length - 1; i >= 0; i--) {
        if (listeners[i].options.namespace === namespace) {
          listeners.splice(i, 1)
          if (this.debug) {
            // console.log(`[EventBus] 移除命名空间监听器: ${namespace}.${event}`)
          }
        }
      }

      // 如果没有监听器了，删除事件
      if (listeners.length === 0) {
        this.events.delete(event)
      }
    }
  }

  /**
   * 发布事件
   * @param {string} event - 事件名称
   * @param {...any} args - 事件参数
   * @returns {boolean} 是否有监听器处理了事件
   */
  emit(event, ...args) {
    if (typeof event !== 'string' || !event.trim()) {
      throw new Error('事件名称必须是非空字符串')
    }

    // 记录事件历史
    this._recordHistory(event, args)

    if (!this.events.has(event)) {
      if (this.debug) {
        // console.log(`[EventBus] 没有监听器: ${event}`)
      }
      return false
    }

    const listeners = this.events.get(event).slice() // 复制数组避免在执行过程中被修改
    let hasHandled = false

    if (this.debug) {
      // console.log(`[EventBus] 发布事件: ${event}`, args, `监听器数量: ${listeners.length}`)
    }

    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i]
      
      try {
        // 设置执行上下文
        const context = listener.options.context || null
        
        // 执行监听器
        const result = listener.handler.apply(context, args)
        
        // 处理Promise返回值
        if (result instanceof Promise) {
          result.catch(error => {
            console.error(`[EventBus] 异步监听器错误: ${event}`, error)
          })
        }
        
        hasHandled = true

        // 如果是一次性监听器，移除它
        if (listener.options.once) {
          this.off(event, listener.handler, listener.options)
        }
      } catch (error) {
        console.error(`[EventBus] 监听器执行错误: ${event}`, error, listener)
      }
    }

    return hasHandled
  }

  /**
   * 异步发布事件
   * @param {string} event - 事件名称
   * @param {...any} args - 事件参数
   * @returns {Promise<Array>} 所有监听器的执行结果
   */
  async emitAsync(event, ...args) {
    if (typeof event !== 'string' || !event.trim()) {
      throw new Error('事件名称必须是非空字符串')
    }

    // 记录事件历史
    this._recordHistory(event, args)

    if (!this.events.has(event)) {
      if (this.debug) {
        // console.log(`[EventBus] 没有监听器: ${event}`)
      }
      return []
    }

    const listeners = this.events.get(event).slice()
    const results = []

    if (this.debug) {
      // console.log(`[EventBus] 异步发布事件: ${event}`, args, `监听器数量: ${listeners.length}`)
    }

    for (const listener of listeners) {
      try {
        const context = listener.options.context || null
        const result = await listener.handler.apply(context, args)
        results.push({ success: true, result, listener })

        // 如果是一次性监听器，移除它
        if (listener.options.once) {
          this.off(event, listener.handler, listener.options)
        }
      } catch (error) {
        console.error(`[EventBus] 异步监听器错误: ${event}`, error, listener)
        results.push({ success: false, error, listener })
      }
    }

    return results
  }

  /**
   * 获取事件的监听器数量
   * @param {string} event - 事件名称
   * @returns {number} 监听器数量
   */
  listenerCount(event) {
    if (!this.events.has(event)) {
      return 0
    }
    return this.events.get(event).length
  }

  /**
   * 获取所有事件名称
   * @returns {Array<string>} 事件名称数组
   */
  eventNames() {
    return Array.from(this.events.keys())
  }

  /**
   * 获取事件的所有监听器
   * @param {string} event - 事件名称
   * @returns {Array} 监听器数组
   */
  listeners(event) {
    if (!this.events.has(event)) {
      return []
    }
    return this.events.get(event).map(listener => listener.handler)
  }

  /**
   * 检查是否有监听器
   * @param {string} event - 事件名称
   * @param {Function} [handler] - 特定处理函数
   * @returns {boolean} 是否有监听器
   */
  hasListener(event, handler) {
    if (!this.events.has(event)) {
      return false
    }

    if (!handler) {
      return this.events.get(event).length > 0
    }

    return this.events.get(event).some(listener => listener.handler === handler)
  }

  /**
   * 清除所有事件监听器
   */
  clear() {
    this.events.clear()
    this.history.length = 0
    if (this.debug) {
      // console.log('[EventBus] 清除所有监听器')
    }
  }

  /**
   * 获取事件历史记录
   * @param {number} [limit] - 限制数量
   * @returns {Array} 历史记录
   */
  getHistory(limit) {
    if (limit && limit > 0) {
      return this.history.slice(-limit)
    }
    return this.history.slice()
  }

  /**
   * 清除事件历史记录
   */
  clearHistory() {
    this.history.length = 0
  }

  /**
   * 等待事件发生
   * @param {string} event - 事件名称
   * @param {number} [timeout] - 超时时间（毫秒）
   * @returns {Promise} 事件Promise
   */
  waitFor(event, timeout) {
    return new Promise((resolve, reject) => {
      let timeoutId
      
      const cleanup = this.once(event, (...args) => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        resolve(args)
      })

      if (timeout && timeout > 0) {
        timeoutId = setTimeout(() => {
          cleanup()
          reject(new Error(`等待事件 "${event}" 超时`))
        }, timeout)
      }
    })
  }

  /**
   * 创建命名空间事件总线
   * @param {string} namespace - 命名空间
   * @returns {Object} 命名空间事件总线
   */
  namespace(namespace) {
    const self = this
    
    return {
      on(event, handler, options = {}) {
        return self.on(event, handler, { ...options, namespace })
      },
      
      once(event, handler, options = {}) {
        return self.once(event, handler, { ...options, namespace })
      },
      
      off(event, handler, options = {}) {
        return self.off(event, handler, { ...options, namespace })
      },
      
      emit(event, ...args) {
        return self.emit(event, ...args)
      },
      
      emitAsync(event, ...args) {
        return self.emitAsync(event, ...args)
      },
      
      clear() {
        return self.offNamespace(namespace)
      },
      
      listenerCount(event) {
        return self.listenerCount(event)
      },
      
      hasListener(event, handler) {
        return self.hasListener(event, handler)
      },
      
      waitFor(event, timeout) {
        return self.waitFor(event, timeout)
      }
    }
  }

  /**
   * 生成唯一ID
   * @returns {string} 唯一ID
   * @private
   */
  _generateId() {
    return Math.random().toString(36).substr(2, 9)
  }

  /**
   * 记录事件历史
   * @param {string} event - 事件名称
   * @param {Array} args - 事件参数
   * @private
   */
  _recordHistory(event, args) {
    this.history.push({
      event,
      args: args.slice(), // 复制参数数组
      timestamp: Date.now(),
      id: this._generateId()
    })

    // 限制历史记录数量
    if (this.history.length > this.maxHistory) {
      this.history.shift()
    }
  }

  /**
   * 获取调试信息
   * @returns {Object} 调试信息
   */
  getDebugInfo() {
    const info = {
      totalEvents: this.events.size,
      totalListeners: 0,
      events: {},
      maxListeners: this.maxListeners,
      historyCount: this.history.length,
      maxHistory: this.maxHistory
    }

    for (const [event, listeners] of this.events.entries()) {
      info.totalListeners += listeners.length
      info.events[event] = {
        listenerCount: listeners.length,
        listeners: listeners.map(l => ({
          priority: l.options.priority,
          once: l.options.once,
          namespace: l.options.namespace,
          id: l.id
        }))
      }
    }

    return info
  }
}

// 创建全局事件总线实例
const globalEventBus = new EventBus()

// 便捷方法
export const on = globalEventBus.on.bind(globalEventBus)
export const once = globalEventBus.once.bind(globalEventBus)
export const off = globalEventBus.off.bind(globalEventBus)
export const emit = globalEventBus.emit.bind(globalEventBus)
export const emitAsync = globalEventBus.emitAsync.bind(globalEventBus)
export const clear = globalEventBus.clear.bind(globalEventBus)
export const listenerCount = globalEventBus.listenerCount.bind(globalEventBus)
export const eventNames = globalEventBus.eventNames.bind(globalEventBus)
export const listeners = globalEventBus.listeners.bind(globalEventBus)
export const hasListener = globalEventBus.hasListener.bind(globalEventBus)
export const waitFor = globalEventBus.waitFor.bind(globalEventBus)
export const namespace = globalEventBus.namespace.bind(globalEventBus)
export const getHistory = globalEventBus.getHistory.bind(globalEventBus)
export const clearHistory = globalEventBus.clearHistory.bind(globalEventBus)
export const getDebugInfo = globalEventBus.getDebugInfo.bind(globalEventBus)
export const setDebug = globalEventBus.setDebug.bind(globalEventBus)
export const setMaxListeners = globalEventBus.setMaxListeners.bind(globalEventBus)

// 导出类和实例
export { EventBus }
export default globalEventBus

// 常用事件名称常量
export const EVENTS = {
  // 用户相关
  USER_LOGIN: 'user:login',
  USER_LOGOUT: 'user:logout',
  USER_UPDATE: 'user:update',
  
  // 数据相关
  DATA_LOADED: 'data:loaded',
  DATA_ERROR: 'data:error',
  DATA_UPDATED: 'data:updated',
  
  // UI相关
  MODAL_OPEN: 'modal:open',
  MODAL_CLOSE: 'modal:close',
  TOAST_SHOW: 'toast:show',
  TOAST_HIDE: 'toast:hide',
  
  // 路由相关
  ROUTE_CHANGE: 'route:change',
  ROUTE_BEFORE_CHANGE: 'route:before-change',
  
  // 网络相关
  NETWORK_ONLINE: 'network:online',
  NETWORK_OFFLINE: 'network:offline',
  
  // 主题相关
  THEME_CHANGE: 'theme:change',
  
  // 语言相关
  LANGUAGE_CHANGE: 'language:change'
}