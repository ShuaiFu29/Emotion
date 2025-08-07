import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * 序列化选项
 * @typedef {Object} SerializerOptions
 * @property {Function} serialize - 序列化函数
 * @property {Function} deserialize - 反序列化函数
 */

/**
 * useLocalStorage配置选项
 * @typedef {Object} UseLocalStorageOptions
 * @property {SerializerOptions} [serializer] - 自定义序列化器
 * @property {boolean} [syncAcrossTabs=false] - 是否跨标签页同步
 * @property {Function} [onError] - 错误处理回调
 * @property {*} [defaultValue] - 默认值
 */

/**
 * 默认序列化器
 */
const defaultSerializer = {
  serialize: JSON.stringify,
  deserialize: JSON.parse
}

/**
 * localStorage操作封装Hook
 * 提供类型安全的localStorage读写，支持自动序列化、跨标签页同步等功能
 * 
 * @template T
 * @param {string} key - localStorage键名
 * @param {T} [initialValue] - 初始值
 * @param {UseLocalStorageOptions} [options={}] - 配置选项
 * @returns {Array} [value, setValue, removeValue, isLoading, error]
 */
const useLocalStorage = (key, initialValue, options = {}) => {
  const {
    serializer = defaultSerializer,
    syncAcrossTabs = false,
    onError,
    defaultValue = initialValue
  } = options

  const [storedValue, setStoredValue] = useState(initialValue)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const isInitializedRef = useRef(false)

  /**
   * 错误处理函数
   * @param {Error} err - 错误对象
   * @param {string} operation - 操作类型
   */
  const handleError = useCallback((err, operation) => {
    const errorMessage = `localStorage ${operation} error for key "${key}": ${err.message}`
    console.error(errorMessage, err)
    
    setError(err)
    
    if (onError && typeof onError === 'function') {
      try {
        onError(err, operation, key)
      } catch (callbackError) {
        console.error('useLocalStorage: onError callback failed:', callbackError)
      }
    }
  }, [key, onError])

  /**
   * 从localStorage读取值
   * @returns {*} 读取的值
   */
  const readValue = useCallback(() => {
    if (typeof window === 'undefined') {
      return defaultValue
    }

    try {
      const item = window.localStorage.getItem(key)
      
      if (item === null) {
        return defaultValue
      }

      return serializer.deserialize(item)
    } catch (err) {
      handleError(err, 'read')
      return defaultValue
    }
  }, [key, defaultValue, serializer, handleError])

  /**
   * 设置localStorage值
   * @param {*} value - 要设置的值或更新函数
   */
  const setValue = useCallback((value) => {
    if (typeof window === 'undefined') {
      console.warn('useLocalStorage: localStorage is not available')
      return
    }

    try {
      // 支持函数式更新
      const newValue = typeof value === 'function' ? value(storedValue) : value
      
      // 更新状态
      setStoredValue(newValue)
      setError(null)

      // 保存到localStorage
      if (newValue === undefined || newValue === null) {
        window.localStorage.removeItem(key)
      } else {
        window.localStorage.setItem(key, serializer.serialize(newValue))
      }

      // 触发storage事件（用于跨标签页同步）
      if (syncAcrossTabs) {
        window.dispatchEvent(new StorageEvent('storage', {
          key,
          newValue: newValue === undefined || newValue === null ? null : serializer.serialize(newValue),
          oldValue: serializer.serialize(storedValue),
          storageArea: window.localStorage
        }))
      }
    } catch (err) {
      handleError(err, 'write')
    }
  }, [key, storedValue, serializer, syncAcrossTabs, handleError])

  /**
   * 删除localStorage值
   */
  const removeValue = useCallback(() => {
    if (typeof window === 'undefined') {
      console.warn('useLocalStorage: localStorage is not available')
      return
    }

    try {
      window.localStorage.removeItem(key)
      setStoredValue(defaultValue)
      setError(null)

      // 触发storage事件
      if (syncAcrossTabs) {
        window.dispatchEvent(new StorageEvent('storage', {
          key,
          newValue: null,
          oldValue: serializer.serialize(storedValue),
          storageArea: window.localStorage
        }))
      }
    } catch (err) {
      handleError(err, 'remove')
    }
  }, [key, defaultValue, storedValue, serializer, syncAcrossTabs, handleError])

  /**
   * 刷新值（从localStorage重新读取）
   */
  const refreshValue = useCallback(() => {
    const newValue = readValue()
    setStoredValue(newValue)
  }, [readValue])

  // 初始化时读取值
  useEffect(() => {
    if (!isInitializedRef.current) {
      const value = readValue()
      setStoredValue(value)
      setIsLoading(false)
      isInitializedRef.current = true
    }
  }, [readValue])

  // 监听storage事件（跨标签页同步）
  useEffect(() => {
    if (!syncAcrossTabs || typeof window === 'undefined') {
      return
    }

    const handleStorageChange = (e) => {
      if (e.key === key && e.storageArea === window.localStorage) {
        try {
          const newValue = e.newValue === null ? defaultValue : serializer.deserialize(e.newValue)
          setStoredValue(newValue)
          setError(null)
        } catch (err) {
          handleError(err, 'sync')
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [key, defaultValue, serializer, syncAcrossTabs, handleError])

  // 监听localStorage的直接变化（同一标签页内）
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    // 创建一个MutationObserver来监听localStorage的变化
    // 注意：这是一个备用方案，主要依赖于setValue方法的正确使用
    const checkForChanges = () => {
      const currentValue = readValue()
      if (JSON.stringify(currentValue) !== JSON.stringify(storedValue)) {
        setStoredValue(currentValue)
      }
    }

    // 定期检查（作为备用方案）
    const interval = setInterval(checkForChanges, 1000)
    
    return () => {
      clearInterval(interval)
    }
  }, [readValue, storedValue])

  return [storedValue, setValue, removeValue, isLoading, error, refreshValue]
}

/**
 * 创建带有特定配置的useLocalStorage Hook
 * @param {UseLocalStorageOptions} defaultOptions - 默认配置
 * @returns {Function} 配置好的useLocalStorage Hook
 */
export const createUseLocalStorage = (defaultOptions = {}) => {
  return (key, initialValue, options = {}) => {
    const mergedOptions = { ...defaultOptions, ...options }
    return useLocalStorage(key, initialValue, mergedOptions)
  }
}

/**
 * 预配置的useLocalStorage变体
 */

/**
 * 跨标签页同步的localStorage Hook
 */
export const useLocalStorageSync = (key, initialValue, options = {}) => {
  return useLocalStorage(key, initialValue, {
    syncAcrossTabs: true,
    ...options
  })
}

/**
 * 用于存储对象的localStorage Hook（带有更好的错误处理）
 */
export const useLocalStorageObject = (key, initialValue = {}, options = {}) => {
  const customSerializer = {
    serialize: (obj) => {
      try {
        return JSON.stringify(obj)
      } catch (err) {
        console.error('Failed to serialize object:', err)
        return JSON.stringify({})
      }
    },
    deserialize: (str) => {
      try {
        const parsed = JSON.parse(str)
        return typeof parsed === 'object' && parsed !== null ? parsed : {}
      } catch (err) {
        console.error('Failed to deserialize object:', err)
        return {}
      }
    }
  }

  return useLocalStorage(key, initialValue, {
    serializer: customSerializer,
    ...options
  })
}

/**
 * 用于存储数组的localStorage Hook
 */
export const useLocalStorageArray = (key, initialValue = [], options = {}) => {
  const customSerializer = {
    serialize: (arr) => {
      try {
        return JSON.stringify(Array.isArray(arr) ? arr : [])
      } catch (err) {
        console.error('Failed to serialize array:', err)
        return JSON.stringify([])
      }
    },
    deserialize: (str) => {
      try {
        const parsed = JSON.parse(str)
        return Array.isArray(parsed) ? parsed : []
      } catch (err) {
        console.error('Failed to deserialize array:', err)
        return []
      }
    }
  }

  return useLocalStorage(key, initialValue, {
    serializer: customSerializer,
    ...options
  })
}

export default useLocalStorage