import { useState, useCallback, useRef } from 'react'

/**
 * Toast类型定义
 * @typedef {'success' | 'error' | 'warning' | 'info'} ToastType
 */

/**
 * Toast配置选项
 * @typedef {Object} ToastOptions
 * @property {number} [duration=3000] - 显示持续时间（毫秒）
 * @property {boolean} [autoClose=true] - 是否自动关闭
 * @property {string} [position='top'] - 显示位置
 * @property {Function} [onClose] - 关闭回调
 */

/**
 * Toast状态
 * @typedef {Object} ToastState
 * @property {boolean} show - 是否显示
 * @property {string} message - 消息内容
 * @property {ToastType} type - 消息类型
 * @property {string} id - 唯一标识
 */

/**
 * 统一的Toast提示管理Hook
 * 提供显示、隐藏、队列管理等功能
 * 
 * @returns {Object} Toast管理对象
 * @returns {ToastState} returns.toast - 当前Toast状态
 * @returns {Function} returns.showToast - 显示Toast
 * @returns {Function} returns.hideToast - 隐藏Toast
 * @returns {Function} returns.clearToasts - 清空所有Toast
 * @returns {Array<ToastState>} returns.toastQueue - Toast队列
 */
const useToast = () => {
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'info',
    id: ''
  })

  const [toastQueue, setToastQueue] = useState([])
  const timeoutRef = useRef(null)
  const queueTimeoutRef = useRef(null)

  /**
   * 生成唯一ID
   * @returns {string} 唯一标识符
   */
  const generateId = useCallback(() => {
    return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])

  /**
   * 处理队列中的下一个Toast
   */
  const processQueue = useCallback(() => {
    if (queueTimeoutRef.current) {
      clearTimeout(queueTimeoutRef.current)
    }

    queueTimeoutRef.current = setTimeout(() => {
      setToastQueue(prevQueue => {
        setToast(currentToast => {
          if (prevQueue.length > 0 && !currentToast.show) {
            const nextToast = prevQueue[0]
            return nextToast
          }
          return currentToast
        })
        
        if (prevQueue.length > 0) {
          return prevQueue.slice(1)
        }
        return prevQueue
      })
    }, 100)
  }, [])

  /**
   * 显示Toast消息
   * @param {string} message - 消息内容
   * @param {ToastType} [type='info'] - 消息类型
   * @param {ToastOptions} [options={}] - 配置选项
   */
  const showToast = useCallback((message, type = 'info', options = {}) => {
    const {
      duration = 3000,
      autoClose = true,
      onClose
    } = options

    if (!message || typeof message !== 'string') {
      console.warn('useToast: message must be a non-empty string')
      return
    }

    const newToast = {
      show: true,
      message: message.trim(),
      type,
      id: generateId()
    }

    // 检查当前是否有Toast显示，如果有则加入队列
    setToast(currentToast => {
      if (currentToast.show) {
        setToastQueue(prevQueue => [...prevQueue, newToast])
        return currentToast
      }
      
      // 清除之前的定时器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // 自动关闭
      if (autoClose && duration > 0) {
        timeoutRef.current = setTimeout(() => {
          hideToast()
          if (onClose && typeof onClose === 'function') {
            try {
              onClose()
            } catch (error) {
              console.error('useToast: onClose callback error:', error)
            }
          }
        }, duration)
      }
      
      return newToast
    })
  }, [generateId, hideToast])

  /**
   * 隐藏当前Toast
   * @param {string} [toastId] - 指定要隐藏的Toast ID，不传则隐藏当前Toast
   */
  const hideToast = useCallback((toastId) => {
    setToast(currentToast => {
      if (toastId && currentToast.id !== toastId) {
        // 如果指定了ID但不匹配当前Toast，从队列中移除
        setToastQueue(prevQueue => prevQueue.filter(t => t.id !== toastId))
        return currentToast
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      // 处理队列中的下一个Toast
      processQueue()
      
      return {
        show: false,
        message: '',
        type: 'info',
        id: ''
      }
    })
  }, [processQueue])

  /**
   * 清空所有Toast（包括队列）
   */
  const clearToasts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (queueTimeoutRef.current) {
      clearTimeout(queueTimeoutRef.current)
      queueTimeoutRef.current = null
    }

    setToast({
      show: false,
      message: '',
      type: 'info',
      id: ''
    })

    setToastQueue([])
  }, [])

  /**
   * 快捷方法：显示成功消息
   * @param {string} message - 消息内容
   * @param {ToastOptions} [options] - 配置选项
   */
  const success = useCallback((message, options) => {
    showToast(message, 'success', options)
  }, [showToast])

  /**
   * 快捷方法：显示错误消息
   * @param {string} message - 消息内容
   * @param {ToastOptions} [options] - 配置选项
   */
  const error = useCallback((message, options) => {
    showToast(message, 'error', { duration: 4000, ...options })
  }, [showToast])

  /**
   * 快捷方法：显示警告消息
   * @param {string} message - 消息内容
   * @param {ToastOptions} [options] - 配置选项
   */
  const warning = useCallback((message, options) => {
    showToast(message, 'warning', options)
  }, [showToast])

  /**
   * 快捷方法：显示信息消息
   * @param {string} message - 消息内容
   * @param {ToastOptions} [options] - 配置选项
   */
  const info = useCallback((message, options) => {
    showToast(message, 'info', options)
  }, [showToast])

  return {
    toast,
    toastQueue,
    showToast,
    hideToast,
    clearToasts,
    // 快捷方法
    success,
    error,
    warning,
    info
  }
}

export default useToast