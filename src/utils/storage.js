/**
 * 存储工具类
 * 提供localStorage和sessionStorage的统一管理
 * 支持数据加密、过期时间、命名空间等功能
 */

/**
 * 存储配置选项
 * @typedef {Object} StorageOptions
 * @property {number} [expires] - 过期时间（毫秒）
 * @property {string} [namespace] - 命名空间
 * @property {boolean} [encrypt=false] - 是否加密
 * @property {Function} [serializer] - 自定义序列化器
 * @property {Function} [deserializer] - 自定义反序列化器
 */

/**
 * 存储项结构
 * @typedef {Object} StorageItem
 * @property {*} value - 存储的值
 * @property {number} [timestamp] - 存储时间戳
 * @property {number} [expires] - 过期时间戳
 * @property {string} [version] - 数据版本
 */

/**
 * 简单的加密/解密函数（仅用于基础混淆，不适用于敏感数据）
 */
const simpleEncrypt = (text) => {
  return btoa(encodeURIComponent(text))
}

const simpleDecrypt = (encrypted) => {
  try {
    return decodeURIComponent(atob(encrypted))
  } catch (error) {
    console.error('Decrypt failed:', error)
    return null
  }
}

/**
 * 默认序列化器
 */
const defaultSerializer = {
  serialize: JSON.stringify,
  deserialize: JSON.parse
}

/**
 * 存储管理类
 */
class StorageManager {
  /**
   * 构造函数
   * @param {Storage} storage - 存储对象（localStorage或sessionStorage）
   * @param {StorageOptions} [defaultOptions={}] - 默认配置
   */
  constructor(storage, defaultOptions = {}) {
    this.storage = storage
    this.defaultOptions = {
      namespace: '',
      encrypt: false,
      serializer: defaultSerializer.serialize,
      deserializer: defaultSerializer.deserialize,
      ...defaultOptions
    }
  }

  /**
   * 生成带命名空间的键名
   * @param {string} key - 原始键名
   * @param {string} [namespace] - 命名空间
   * @returns {string} 完整键名
   */
  getFullKey(key, namespace) {
    const ns = namespace || this.defaultOptions.namespace
    return ns ? `${ns}:${key}` : key
  }

  /**
   * 检查存储是否可用
   * @returns {boolean} 是否可用
   */
  isAvailable() {
    try {
      const testKey = '__storage_test__'
      this.storage.setItem(testKey, 'test')
      this.storage.removeItem(testKey)
      return true
    } catch (error) {
      console.warn('Storage is not available:', error)
      return false
    }
  }

  /**
   * 设置存储项
   * @param {string} key - 键名
   * @param {*} value - 值
   * @param {StorageOptions} [options={}] - 配置选项
   * @returns {boolean} 是否成功
   */
  setItem(key, value, options = {}) {
    if (!this.isAvailable()) {
      console.warn('Storage is not available')
      return false
    }

    try {
      const config = { ...this.defaultOptions, ...options }
      const fullKey = this.getFullKey(key, config.namespace)
      
      // 构建存储项
      const storageItem = {
        value,
        timestamp: Date.now(),
        version: '1.0'
      }

      // 设置过期时间
      if (config.expires && config.expires > 0) {
        storageItem.expires = Date.now() + config.expires
      }

      // 序列化数据
      let serializedData = config.serializer(storageItem)

      // 加密数据
      if (config.encrypt) {
        serializedData = simpleEncrypt(serializedData)
      }

      // 存储数据
      this.storage.setItem(fullKey, serializedData)
      return true
    } catch (error) {
      console.error('Failed to set storage item:', error)
      return false
    }
  }

  /**
   * 获取存储项
   * @param {string} key - 键名
   * @param {*} [defaultValue=null] - 默认值
   * @param {StorageOptions} [options={}] - 配置选项
   * @returns {*} 存储的值或默认值
   */
  getItem(key, defaultValue = null, options = {}) {
    if (!this.isAvailable()) {
      return defaultValue
    }

    try {
      const config = { ...this.defaultOptions, ...options }
      const fullKey = this.getFullKey(key, config.namespace)
      
      let rawData = this.storage.getItem(fullKey)
      if (rawData === null) {
        return defaultValue
      }

      // 解密数据
      if (config.encrypt) {
        rawData = simpleDecrypt(rawData)
        if (rawData === null) {
          console.warn('Failed to decrypt storage item:', key)
          return defaultValue
        }
      }

      // 反序列化数据
      const storageItem = config.deserializer(rawData)
      
      // 检查数据结构
      if (!storageItem || typeof storageItem !== 'object') {
        console.warn('Invalid storage item structure:', key)
        return defaultValue
      }

      // 检查过期时间
      if (storageItem.expires && Date.now() > storageItem.expires) {
        console.info('Storage item expired:', key)
        this.removeItem(key, options)
        return defaultValue
      }

      return storageItem.value
    } catch (error) {
      console.error('Failed to get storage item:', error)
      return defaultValue
    }
  }

  /**
   * 删除存储项
   * @param {string} key - 键名
   * @param {StorageOptions} [options={}] - 配置选项
   * @returns {boolean} 是否成功
   */
  removeItem(key, options = {}) {
    if (!this.isAvailable()) {
      return false
    }

    try {
      const config = { ...this.defaultOptions, ...options }
      const fullKey = this.getFullKey(key, config.namespace)
      this.storage.removeItem(fullKey)
      return true
    } catch (error) {
      console.error('Failed to remove storage item:', error)
      return false
    }
  }

  /**
   * 检查键是否存在
   * @param {string} key - 键名
   * @param {StorageOptions} [options={}] - 配置选项
   * @returns {boolean} 是否存在
   */
  hasItem(key, options = {}) {
    if (!this.isAvailable()) {
      return false
    }

    const config = { ...this.defaultOptions, ...options }
    const fullKey = this.getFullKey(key, config.namespace)
    return this.storage.getItem(fullKey) !== null
  }

  /**
   * 获取所有键名
   * @param {string} [namespace] - 命名空间过滤
   * @returns {Array<string>} 键名数组
   */
  getAllKeys(namespace) {
    if (!this.isAvailable()) {
      return []
    }

    try {
      const keys = []
      const prefix = namespace ? `${namespace}:` : ''
      
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i)
        if (key && (!prefix || key.startsWith(prefix))) {
          keys.push(prefix ? key.substring(prefix.length) : key)
        }
      }
      
      return keys
    } catch (error) {
      console.error('Failed to get all keys:', error)
      return []
    }
  }

  /**
   * 清空存储（可指定命名空间）
   * @param {string} [namespace] - 命名空间，不指定则清空所有
   * @returns {boolean} 是否成功
   */
  clear(namespace) {
    if (!this.isAvailable()) {
      return false
    }

    try {
      if (!namespace) {
        this.storage.clear()
        return true
      }

      // 清空指定命名空间
      const keys = this.getAllKeys(namespace)
      keys.forEach(key => {
        this.removeItem(key, { namespace })
      })
      
      return true
    } catch (error) {
      console.error('Failed to clear storage:', error)
      return false
    }
  }

  /**
   * 获取存储使用情况
   * @returns {Object} 使用情况统计
   */
  getUsage() {
    if (!this.isAvailable()) {
      return { used: 0, total: 0, available: 0 }
    }

    try {
      let used = 0
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i)
        const value = this.storage.getItem(key)
        if (key && value) {
          used += key.length + value.length
        }
      }

      // 估算总容量（通常为5MB）
      const total = 5 * 1024 * 1024
      const available = total - used

      return {
        used,
        total,
        available,
        usedPercent: (used / total * 100).toFixed(2)
      }
    } catch (error) {
      console.error('Failed to get storage usage:', error)
      return { used: 0, total: 0, available: 0 }
    }
  }

  /**
   * 清理过期项
   * @param {string} [namespace] - 命名空间
   * @returns {number} 清理的项目数量
   */
  cleanExpired(namespace) {
    if (!this.isAvailable()) {
      return 0
    }

    let cleanedCount = 0
    const keys = this.getAllKeys(namespace)
    
    keys.forEach(key => {
      try {
        const config = { namespace }
        const fullKey = this.getFullKey(key, namespace)
        const rawData = this.storage.getItem(fullKey)
        
        if (rawData) {
          let data = rawData
          if (this.defaultOptions.encrypt) {
            data = simpleDecrypt(data)
          }
          
          if (data) {
            const storageItem = this.defaultOptions.deserializer(data)
            if (storageItem && storageItem.expires && Date.now() > storageItem.expires) {
              this.removeItem(key, config)
              cleanedCount++
            }
          }
        }
      } catch (error) {
        console.error('Error cleaning expired item:', key, error)
      }
    })

    return cleanedCount
  }
}

// 创建默认实例
const localStorage = typeof window !== 'undefined' ? window.localStorage : null
const sessionStorage = typeof window !== 'undefined' ? window.sessionStorage : null

/**
 * 默认的localStorage管理器
 */
export const localStorageManager = new StorageManager(localStorage, {
  namespace: 'app'
})

/**
 * 默认的sessionStorage管理器
 */
export const sessionStorageManager = new StorageManager(sessionStorage, {
  namespace: 'app'
})

/**
 * 加密的localStorage管理器
 */
export const secureLocalStorage = new StorageManager(localStorage, {
  namespace: 'secure',
  encrypt: true
})

/**
 * 便捷方法
 */
export const storage = {
  // localStorage方法
  local: {
    set: (key, value, options) => localStorageManager.setItem(key, value, options),
    get: (key, defaultValue, options) => localStorageManager.getItem(key, defaultValue, options),
    remove: (key, options) => localStorageManager.removeItem(key, options),
    has: (key, options) => localStorageManager.hasItem(key, options),
    clear: (namespace) => localStorageManager.clear(namespace),
    keys: (namespace) => localStorageManager.getAllKeys(namespace),
    usage: () => localStorageManager.getUsage(),
    cleanExpired: (namespace) => localStorageManager.cleanExpired(namespace)
  },
  
  // sessionStorage方法
  session: {
    set: (key, value, options) => sessionStorageManager.setItem(key, value, options),
    get: (key, defaultValue, options) => sessionStorageManager.getItem(key, defaultValue, options),
    remove: (key, options) => sessionStorageManager.removeItem(key, options),
    has: (key, options) => sessionStorageManager.hasItem(key, options),
    clear: (namespace) => sessionStorageManager.clear(namespace),
    keys: (namespace) => sessionStorageManager.getAllKeys(namespace),
    usage: () => sessionStorageManager.getUsage(),
    cleanExpired: (namespace) => sessionStorageManager.cleanExpired(namespace)
  },
  
  // 安全存储方法
  secure: {
    set: (key, value, options) => secureLocalStorage.setItem(key, value, options),
    get: (key, defaultValue, options) => secureLocalStorage.getItem(key, defaultValue, options),
    remove: (key, options) => secureLocalStorage.removeItem(key, options),
    has: (key, options) => secureLocalStorage.hasItem(key, options),
    clear: (namespace) => secureLocalStorage.clear(namespace),
    keys: (namespace) => secureLocalStorage.getAllKeys(namespace)
  }
}

/**
 * 创建自定义存储管理器
 * @param {Storage} storageType - 存储类型
 * @param {StorageOptions} options - 配置选项
 * @returns {StorageManager} 存储管理器实例
 */
export const createStorageManager = (storageType, options = {}) => {
  return new StorageManager(storageType, options)
}

export { StorageManager }
export default storage