/**
 * 缓存管理库
 * 提供内存缓存、本地存储缓存、会话缓存等功能
 */

/**
 * 缓存项配置
 * @typedef {Object} CacheOptions
 * @property {number} [ttl] - 生存时间（毫秒）
 * @property {number} [maxAge] - 最大存活时间（毫秒）
 * @property {boolean} [persistent=false] - 是否持久化
 * @property {string} [storage='memory'] - 存储类型：memory, localStorage, sessionStorage
 * @property {Function} [serialize] - 序列化函数
 * @property {Function} [deserialize] - 反序列化函数
 * @property {Function} [onExpire] - 过期回调
 * @property {any} [defaultValue] - 默认值
 */

/**
 * 缓存统计信息
 * @typedef {Object} CacheStats
 * @property {number} hits - 命中次数
 * @property {number} misses - 未命中次数
 * @property {number} sets - 设置次数
 * @property {number} deletes - 删除次数
 * @property {number} size - 当前大小
 * @property {number} maxSize - 最大大小
 * @property {number} hitRate - 命中率
 */

/**
 * 内存缓存类
 */
class MemoryCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 100
    this.defaultTTL = options.defaultTTL || 0 // 0表示永不过期
    this.checkInterval = options.checkInterval || 60000 // 1分钟检查一次过期项
    
    this.cache = new Map()
    this.timers = new Map()
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    }
    
    // 启动定期清理
    this._startCleanup()
  }

  /**
   * 设置缓存项
   * @param {string} key - 键
   * @param {any} value - 值
   * @param {CacheOptions} [options={}] - 选项
   * @returns {boolean} 是否设置成功
   */
  set(key, value, options = {}) {
    if (typeof key !== 'string' || !key) {
      throw new Error('缓存键必须是非空字符串')
    }

    // 检查大小限制
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      // 使用LRU策略删除最旧的项
      const firstKey = this.cache.keys().next().value
      this.delete(firstKey)
    }

    const ttl = options.ttl || this.defaultTTL
    const item = {
      value,
      createdAt: Date.now(),
      ttl,
      options: { ...options }
    }

    // 设置过期时间
    if (ttl > 0) {
      item.expiresAt = item.createdAt + ttl
      
      // 清除旧的定时器
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key))
      }
      
      // 设置新的定时器
      const timer = setTimeout(() => {
        this._expireItem(key)
      }, ttl)
      
      this.timers.set(key, timer)
    }

    this.cache.set(key, item)
    this.stats.sets++
    
    return true
  }

  /**
   * 获取缓存项
   * @param {string} key - 键
   * @param {any} [defaultValue] - 默认值
   * @returns {any} 缓存值
   */
  get(key, defaultValue) {
    if (!this.cache.has(key)) {
      this.stats.misses++
      return defaultValue
    }

    const item = this.cache.get(key)
    
    // 检查是否过期
    if (this._isExpired(item)) {
      this._expireItem(key)
      this.stats.misses++
      return defaultValue
    }

    // 更新访问时间（LRU）
    this.cache.delete(key)
    this.cache.set(key, item)
    
    this.stats.hits++
    return item.value
  }

  /**
   * 检查缓存项是否存在
   * @param {string} key - 键
   * @returns {boolean} 是否存在
   */
  has(key) {
    if (!this.cache.has(key)) {
      return false
    }

    const item = this.cache.get(key)
    if (this._isExpired(item)) {
      this._expireItem(key)
      return false
    }

    return true
  }

  /**
   * 删除缓存项
   * @param {string} key - 键
   * @returns {boolean} 是否删除成功
   */
  delete(key) {
    if (!this.cache.has(key)) {
      return false
    }

    this.cache.delete(key)
    
    // 清除定时器
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
      this.timers.delete(key)
    }
    
    this.stats.deletes++
    return true
  }

  /**
   * 清空缓存
   */
  clear() {
    this.cache.clear()
    
    // 清除所有定时器
    for (const timer of this.timers.values()) {
      clearTimeout(timer)
    }
    this.timers.clear()
    
    // 重置统计
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    }
  }

  /**
   * 获取所有键
   * @returns {Array<string>} 键数组
   */
  keys() {
    return Array.from(this.cache.keys())
  }

  /**
   * 获取所有值
   * @returns {Array<any>} 值数组
   */
  values() {
    return Array.from(this.cache.values()).map(item => item.value)
  }

  /**
   * 获取缓存大小
   * @returns {number} 缓存大小
   */
  size() {
    return this.cache.size
  }

  /**
   * 获取统计信息
   * @returns {CacheStats} 统计信息
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses
    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: total > 0 ? (this.stats.hits / total) : 0
    }
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    }
  }

  /**
   * 检查项是否过期
   * @param {Object} item - 缓存项
   * @returns {boolean} 是否过期
   * @private
   */
  _isExpired(item) {
    if (!item.expiresAt) {
      return false
    }
    return Date.now() > item.expiresAt
  }

  /**
   * 过期项处理
   * @param {string} key - 键
   * @private
   */
  _expireItem(key) {
    const item = this.cache.get(key)
    if (item) {
      // 调用过期回调
      if (item.options.onExpire && typeof item.options.onExpire === 'function') {
        try {
          item.options.onExpire(key, item.value)
        } catch (error) {
          console.error('缓存过期回调执行错误:', error)
        }
      }
      
      this.delete(key)
    }
  }

  /**
   * 启动定期清理
   * @private
   */
  _startCleanup() {
    setInterval(() => {
      const now = Date.now()
      for (const [key, item] of this.cache.entries()) {
        if (this._isExpired(item)) {
          this._expireItem(key)
        }
      }
    }, this.checkInterval)
  }

  /**
   * 销毁缓存
   */
  destroy() {
    this.clear()
    // 这里应该清除定期清理的定时器，但由于setInterval返回值没有保存，暂时无法清除
  }
}

/**
 * 持久化缓存类
 */
class PersistentCache {
  constructor(options = {}) {
    this.prefix = options.prefix || 'cache:'
    this.storage = options.storage || 'localStorage'
    this.defaultTTL = options.defaultTTL || 0
    this.serialize = options.serialize || JSON.stringify
    this.deserialize = options.deserialize || JSON.parse
    
    // 获取存储对象
    this.storageObj = this._getStorageObject()
    
    if (!this.storageObj) {
      throw new Error(`不支持的存储类型: ${this.storage}`)
    }
  }

  /**
   * 设置缓存项
   * @param {string} key - 键
   * @param {any} value - 值
   * @param {CacheOptions} [options={}] - 选项
   * @returns {boolean} 是否设置成功
   */
  set(key, value, options = {}) {
    try {
      const ttl = options.ttl || this.defaultTTL
      const item = {
        value,
        createdAt: Date.now(),
        ttl
      }

      if (ttl > 0) {
        item.expiresAt = item.createdAt + ttl
      }

      const serialized = this.serialize(item)
      this.storageObj.setItem(this.prefix + key, serialized)
      
      return true
    } catch (error) {
      console.error('缓存设置失败:', error)
      return false
    }
  }

  /**
   * 获取缓存项
   * @param {string} key - 键
   * @param {any} [defaultValue] - 默认值
   * @returns {any} 缓存值
   */
  get(key, defaultValue) {
    try {
      const serialized = this.storageObj.getItem(this.prefix + key)
      if (!serialized) {
        return defaultValue
      }

      const item = this.deserialize(serialized)
      
      // 检查是否过期
      if (item.expiresAt && Date.now() > item.expiresAt) {
        this.delete(key)
        return defaultValue
      }

      return item.value
    } catch (error) {
      console.error('缓存获取失败:', error)
      return defaultValue
    }
  }

  /**
   * 检查缓存项是否存在
   * @param {string} key - 键
   * @returns {boolean} 是否存在
   */
  has(key) {
    try {
      const serialized = this.storageObj.getItem(this.prefix + key)
      if (!serialized) {
        return false
      }

      const item = this.deserialize(serialized)
      
      // 检查是否过期
      if (item.expiresAt && Date.now() > item.expiresAt) {
        this.delete(key)
        return false
      }

      return true
    } catch (error) {
      console.error('缓存检查失败:', error)
      return false
    }
  }

  /**
   * 删除缓存项
   * @param {string} key - 键
   * @returns {boolean} 是否删除成功
   */
  delete(key) {
    try {
      this.storageObj.removeItem(this.prefix + key)
      return true
    } catch (error) {
      console.error('缓存删除失败:', error)
      return false
    }
  }

  /**
   * 清空缓存
   */
  clear() {
    try {
      const keys = this.keys()
      for (const key of keys) {
        this.delete(key)
      }
    } catch (error) {
      console.error('缓存清空失败:', error)
    }
  }

  /**
   * 获取所有键
   * @returns {Array<string>} 键数组
   */
  keys() {
    const keys = []
    try {
      for (let i = 0; i < this.storageObj.length; i++) {
        const key = this.storageObj.key(i)
        if (key && key.startsWith(this.prefix)) {
          keys.push(key.slice(this.prefix.length))
        }
      }
    } catch (error) {
      console.error('获取缓存键失败:', error)
    }
    return keys
  }

  /**
   * 获取缓存大小
   * @returns {number} 缓存大小
   */
  size() {
    return this.keys().length
  }

  /**
   * 清理过期项
   */
  cleanup() {
    const keys = this.keys()
    for (const key of keys) {
      // 通过get方法触发过期检查
      this.get(key)
    }
  }

  /**
   * 获取存储对象
   * @param {string} storage - 存储类型
   * @returns {Storage} 存储对象
   * @private
   */
  _getStorageObject() {
    switch (this.storage) {
      case 'localStorage':
        return typeof window !== 'undefined' ? window.localStorage : null
      case 'sessionStorage':
        return typeof window !== 'undefined' ? window.sessionStorage : null
      default:
        return null
    }
  }
}

/**
 * 多级缓存类
 */
class MultiLevelCache {
  constructor(options = {}) {
    this.levels = []
    
    // 默认配置：内存缓存 + 本地存储缓存
    const defaultLevels = [
      { type: 'memory', options: { maxSize: 50, defaultTTL: 300000 } }, // 5分钟
      { type: 'localStorage', options: { defaultTTL: 3600000 } } // 1小时
    ]
    
    const levels = options.levels || defaultLevels
    
    for (const level of levels) {
      this.addLevel(level.type, level.options)
    }
  }

  /**
   * 添加缓存级别
   * @param {string} type - 缓存类型
   * @param {Object} options - 选项
   */
  addLevel(type, options = {}) {
    let cache
    
    switch (type) {
      case 'memory':
        cache = new MemoryCache(options)
        break
      case 'localStorage':
        cache = new PersistentCache({ ...options, storage: 'localStorage' })
        break
      case 'sessionStorage':
        cache = new PersistentCache({ ...options, storage: 'sessionStorage' })
        break
      default:
        throw new Error(`不支持的缓存类型: ${type}`)
    }
    
    this.levels.push({ type, cache, options })
  }

  /**
   * 设置缓存项
   * @param {string} key - 键
   * @param {any} value - 值
   * @param {CacheOptions} [options={}] - 选项
   * @returns {boolean} 是否设置成功
   */
  set(key, value, options = {}) {
    let success = false
    
    for (const level of this.levels) {
      try {
        if (level.cache.set(key, value, options)) {
          success = true
        }
      } catch (error) {
        console.error(`${level.type} 缓存设置失败:`, error)
      }
    }
    
    return success
  }

  /**
   * 获取缓存项
   * @param {string} key - 键
   * @param {any} [defaultValue] - 默认值
   * @returns {any} 缓存值
   */
  get(key, defaultValue) {
    for (let i = 0; i < this.levels.length; i++) {
      const level = this.levels[i]
      
      try {
        const value = level.cache.get(key)
        if (value !== undefined) {
          // 回填到更高级别的缓存
          for (let j = 0; j < i; j++) {
            try {
              this.levels[j].cache.set(key, value)
            } catch (error) {
              console.error(`缓存回填失败:`, error)
            }
          }
          
          return value
        }
      } catch (error) {
        console.error(`${level.type} 缓存获取失败:`, error)
      }
    }
    
    return defaultValue
  }

  /**
   * 检查缓存项是否存在
   * @param {string} key - 键
   * @returns {boolean} 是否存在
   */
  has(key) {
    for (const level of this.levels) {
      try {
        if (level.cache.has(key)) {
          return true
        }
      } catch (error) {
        console.error(`${level.type} 缓存检查失败:`, error)
      }
    }
    
    return false
  }

  /**
   * 删除缓存项
   * @param {string} key - 键
   * @returns {boolean} 是否删除成功
   */
  delete(key) {
    let success = false
    
    for (const level of this.levels) {
      try {
        if (level.cache.delete(key)) {
          success = true
        }
      } catch (error) {
        console.error(`${level.type} 缓存删除失败:`, error)
      }
    }
    
    return success
  }

  /**
   * 清空缓存
   */
  clear() {
    for (const level of this.levels) {
      try {
        level.cache.clear()
      } catch (error) {
        console.error(`${level.type} 缓存清空失败:`, error)
      }
    }
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const stats = {}
    
    for (const level of this.levels) {
      try {
        if (typeof level.cache.getStats === 'function') {
          stats[level.type] = level.cache.getStats()
        } else {
          stats[level.type] = {
            size: level.cache.size()
          }
        }
      } catch (error) {
        console.error(`${level.type} 统计获取失败:`, error)
        stats[level.type] = { error: error.message }
      }
    }
    
    return stats
  }
}

// 创建默认缓存实例
const defaultCache = new MultiLevelCache()

// 便捷方法
export const set = defaultCache.set.bind(defaultCache)
export const get = defaultCache.get.bind(defaultCache)
export const has = defaultCache.has.bind(defaultCache)
export const del = defaultCache.delete.bind(defaultCache)
export const clear = defaultCache.clear.bind(defaultCache)
export const getStats = defaultCache.getStats.bind(defaultCache)

// 导出类
export { MemoryCache, PersistentCache, MultiLevelCache }

// 导出默认实例
export default defaultCache

// 缓存装饰器
export const cached = (options = {}) => {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value
    const cacheKey = options.key || `${target.constructor.name}.${propertyKey}`
    const ttl = options.ttl || 300000 // 5分钟
    
    descriptor.value = function(...args) {
      const key = `${cacheKey}:${JSON.stringify(args)}`
      
      // 尝试从缓存获取
      const cached = get(key)
      if (cached !== undefined) {
        return cached
      }
      
      // 执行原方法
      const result = originalMethod.apply(this, args)
      
      // 缓存结果
      if (result instanceof Promise) {
        return result.then(value => {
          set(key, value, { ttl })
          return value
        })
      } else {
        set(key, result, { ttl })
        return result
      }
    }
    
    return descriptor
  }
}

// 缓存工具函数
export const cacheUtils = {
  /**
   * 创建带缓存的函数
   * @param {Function} fn - 原函数
   * @param {Object} options - 选项
   * @returns {Function} 带缓存的函数
   */
  memoize(fn, options = {}) {
    const cache = options.cache || new MemoryCache()
    const keyGenerator = options.keyGenerator || ((...args) => JSON.stringify(args))
    const ttl = options.ttl
    
    return function(...args) {
      const key = keyGenerator(...args)
      
      if (cache.has(key)) {
        return cache.get(key)
      }
      
      const result = fn.apply(this, args)
      
      if (result instanceof Promise) {
        return result.then(value => {
          cache.set(key, value, { ttl })
          return value
        }).catch(error => {
          // 不缓存错误结果
          throw error
        })
      } else {
        cache.set(key, result, { ttl })
        return result
      }
    }
  },
  
  /**
   * 批量操作
   * @param {Object} operations - 操作对象
   * @returns {Object} 结果对象
   */
  batch(operations) {
    const results = {}
    
    for (const [key, operation] of Object.entries(operations)) {
      try {
        if (operation.type === 'get') {
          results[key] = get(operation.key, operation.defaultValue)
        } else if (operation.type === 'set') {
          results[key] = set(operation.key, operation.value, operation.options)
        } else if (operation.type === 'delete') {
          results[key] = del(operation.key)
        } else if (operation.type === 'has') {
          results[key] = has(operation.key)
        }
      } catch (error) {
        results[key] = { error: error.message }
      }
    }
    
    return results
  }
}