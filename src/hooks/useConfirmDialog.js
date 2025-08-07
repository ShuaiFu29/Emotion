import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * 确认对话框配置选项
 * @typedef {Object} ConfirmDialogOptions
 * @property {string} [title='确认'] - 对话框标题
 * @property {string} [message='确定要执行此操作吗？'] - 确认消息
 * @property {string} [confirmText='确认'] - 确认按钮文本
 * @property {string} [cancelText='取消'] - 取消按钮文本
 * @property {string} [type='default'] - 对话框类型 (default, warning, danger, info)
 * @property {boolean} [showIcon=true] - 是否显示图标
 * @property {boolean} [closeOnEscape=true] - 是否支持ESC键关闭
 * @property {boolean} [closeOnOverlay=true] - 是否支持点击遮罩关闭
 * @property {boolean} [autoFocus=true] - 是否自动聚焦确认按钮
 * @property {number} [autoCloseDelay=0] - 自动关闭延迟时间（毫秒，0表示不自动关闭）
 * @property {Function} [onConfirm] - 确认回调
 * @property {Function} [onCancel] - 取消回调
 * @property {Function} [onClose] - 关闭回调
 * @property {Object} [customStyles] - 自定义样式
 * @property {React.ReactNode} [customContent] - 自定义内容
 */

/**
 * 确认对话框状态
 * @typedef {Object} ConfirmDialogState
 * @property {boolean} isVisible - 是否显示
 * @property {string} title - 标题
 * @property {string} message - 消息
 * @property {string} confirmText - 确认按钮文本
 * @property {string} cancelText - 取消按钮文本
 * @property {string} type - 对话框类型
 * @property {boolean} showIcon - 是否显示图标
 * @property {boolean} isLoading - 是否正在处理
 * @property {Object} customStyles - 自定义样式
 * @property {React.ReactNode} customContent - 自定义内容
 */

/**
 * 确认对话框Hook
 * 提供确认对话框的状态管理和交互逻辑
 * 
 * @param {ConfirmDialogOptions} [defaultOptions={}] - 默认配置选项
 * @returns {Object} 确认对话框管理对象
 * @returns {ConfirmDialogState} returns.state - 对话框状态
 * @returns {Function} returns.showConfirm - 显示确认对话框
 * @returns {Function} returns.hideConfirm - 隐藏确认对话框
 * @returns {Function} returns.confirm - 确认操作
 * @returns {Function} returns.cancel - 取消操作
 * @returns {Function} returns.setLoading - 设置加载状态
 * @returns {Object} returns.handlers - 事件处理器
 */
const useConfirmDialog = (defaultOptions = {}) => {
  const {
    title: defaultTitle = '确认',
    message: defaultMessage = '确定要执行此操作吗？',
    confirmText: defaultConfirmText = '确认',
    cancelText: defaultCancelText = '取消',
    type: defaultType = 'default',
    showIcon: defaultShowIcon = true,
    closeOnEscape: defaultCloseOnEscape = true,
    closeOnOverlay: defaultCloseOnOverlay = true,
    autoFocus: defaultAutoFocus = true,
    autoCloseDelay: defaultAutoCloseDelay = 0,
    onConfirm: defaultOnConfirm,
    onCancel: defaultOnCancel,
    onClose: defaultOnClose,
    customStyles: defaultCustomStyles = {},
    customContent: defaultCustomContent
  } = defaultOptions

  const [state, setState] = useState({
    isVisible: false,
    title: defaultTitle,
    message: defaultMessage,
    confirmText: defaultConfirmText,
    cancelText: defaultCancelText,
    type: defaultType,
    showIcon: defaultShowIcon,
    isLoading: false,
    customStyles: defaultCustomStyles,
    customContent: defaultCustomContent
  })

  const resolveRef = useRef(null)
  const rejectRef = useRef(null)
  const autoCloseTimerRef = useRef(null)
  const mountedRef = useRef(true)
  const optionsRef = useRef({})

  /**
   * 清理定时器
   */
  const clearAutoCloseTimer = useCallback(() => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current)
      autoCloseTimerRef.current = null
    }
  }, [])

  /**
   * 设置自动关闭定时器
   * @param {number} delay - 延迟时间
   */
  const setAutoCloseTimer = useCallback((delay) => {
    if (delay > 0) {
      clearAutoCloseTimer()
      autoCloseTimerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          cancel()
        }
      }, delay)
    }
  }, [clearAutoCloseTimer])

  /**
   * 显示确认对话框
   * @param {ConfirmDialogOptions|string} options - 配置选项或消息文本
   * @returns {Promise<boolean>} 用户选择结果
   */
  const showConfirm = useCallback((options = {}) => {
    return new Promise((resolve, reject) => {
      try {
        // 如果传入的是字符串，则作为消息处理
        const normalizedOptions = typeof options === 'string' 
          ? { message: options }
          : options

        const {
          title = defaultTitle,
          message = defaultMessage,
          confirmText = defaultConfirmText,
          cancelText = defaultCancelText,
          type = defaultType,
          showIcon = defaultShowIcon,
          closeOnEscape = defaultCloseOnEscape,
          closeOnOverlay = defaultCloseOnOverlay,
          autoFocus = defaultAutoFocus,
          autoCloseDelay = defaultAutoCloseDelay,
          onConfirm,
          onCancel,
          onClose,
          customStyles = defaultCustomStyles,
          customContent = defaultCustomContent
        } = normalizedOptions

        // 保存当前配置和回调
        optionsRef.current = {
          closeOnEscape,
          closeOnOverlay,
          autoFocus,
          onConfirm,
          onCancel,
          onClose
        }

        resolveRef.current = resolve
        rejectRef.current = reject

        setState({
          isVisible: true,
          title,
          message,
          confirmText,
          cancelText,
          type,
          showIcon,
          isLoading: false,
          customStyles,
          customContent
        })

        // 设置自动关闭
        setAutoCloseTimer(autoCloseDelay)

      } catch (error) {
        console.error('useConfirmDialog: showConfirm failed:', error)
        reject(error)
      }
    })
  }, [
    defaultTitle, defaultMessage, defaultConfirmText, defaultCancelText,
    defaultType, defaultShowIcon, defaultCloseOnEscape, defaultCloseOnOverlay,
    defaultAutoFocus, defaultAutoCloseDelay, defaultCustomStyles, defaultCustomContent,
    setAutoCloseTimer
  ])

  /**
   * 隐藏确认对话框
   */
  const hideConfirm = useCallback(() => {
    clearAutoCloseTimer()
    
    setState(prevState => ({
      ...prevState,
      isVisible: false,
      isLoading: false
    }))

    // 触发关闭回调
    const { onClose } = optionsRef.current
    if (onClose && typeof onClose === 'function') {
      try {
        onClose()
      } catch (error) {
        console.error('useConfirmDialog: onClose callback failed:', error)
      }
    }
  }, [clearAutoCloseTimer])

  /**
   * 确认操作
   */
  const confirm = useCallback(async () => {
    try {
      const { onConfirm } = optionsRef.current
      
      // 设置加载状态
      setState(prevState => ({
        ...prevState,
        isLoading: true
      }))

      let result = true

      // 执行确认回调
      if (onConfirm && typeof onConfirm === 'function') {
        try {
          result = await onConfirm()
          // 如果回调返回false，则不关闭对话框
          if (result === false) {
            setState(prevState => ({
              ...prevState,
              isLoading: false
            }))
            return
          }
        } catch (error) {
          console.error('useConfirmDialog: onConfirm callback failed:', error)
          setState(prevState => ({
            ...prevState,
            isLoading: false
          }))
          
          if (rejectRef.current) {
            rejectRef.current(error)
            rejectRef.current = null
          }
          return
        }
      }

      // 关闭对话框
      hideConfirm()

      // 解析Promise
      if (resolveRef.current) {
        resolveRef.current(true)
        resolveRef.current = null
      }

    } catch (error) {
      console.error('useConfirmDialog: confirm failed:', error)
      
      setState(prevState => ({
        ...prevState,
        isLoading: false
      }))

      if (rejectRef.current) {
        rejectRef.current(error)
        rejectRef.current = null
      }
    }
  }, [hideConfirm])

  /**
   * 取消操作
   */
  const cancel = useCallback(() => {
    try {
      const { onCancel } = optionsRef.current
      
      // 执行取消回调
      if (onCancel && typeof onCancel === 'function') {
        try {
          onCancel()
        } catch (error) {
          console.error('useConfirmDialog: onCancel callback failed:', error)
        }
      }

      // 关闭对话框
      hideConfirm()

      // 解析Promise为false
      if (resolveRef.current) {
        resolveRef.current(false)
        resolveRef.current = null
      }

    } catch (error) {
      console.error('useConfirmDialog: cancel failed:', error)
      
      if (rejectRef.current) {
        rejectRef.current(error)
        rejectRef.current = null
      }
    }
  }, [hideConfirm])

  /**
   * 设置加载状态
   * @param {boolean} loading - 是否加载中
   */
  const setLoading = useCallback((loading) => {
    setState(prevState => ({
      ...prevState,
      isLoading: Boolean(loading)
    }))
  }, [])

  /**
   * 键盘事件处理
   * @param {KeyboardEvent} event - 键盘事件
   */
  const handleKeyDown = useCallback((event) => {
    if (!state.isVisible) return

    const { closeOnEscape } = optionsRef.current

    switch (event.key) {
      case 'Escape':
        if (closeOnEscape && !state.isLoading) {
          event.preventDefault()
          cancel()
        }
        break
      case 'Enter':
        if (!state.isLoading) {
          event.preventDefault()
          confirm()
        }
        break
      default:
        break
    }
  }, [state.isVisible, state.isLoading, cancel, confirm])

  /**
   * 遮罩点击事件处理
   * @param {MouseEvent} event - 鼠标事件
   */
  const handleOverlayClick = useCallback((event) => {
    if (!state.isVisible || state.isLoading) return

    const { closeOnOverlay } = optionsRef.current
    
    if (closeOnOverlay && event.target === event.currentTarget) {
      cancel()
    }
  }, [state.isVisible, state.isLoading, cancel])

  /**
   * 确认按钮点击事件处理
   */
  const handleConfirmClick = useCallback((event) => {
    event.preventDefault()
    if (!state.isLoading) {
      confirm()
    }
  }, [state.isLoading, confirm])

  /**
   * 取消按钮点击事件处理
   */
  const handleCancelClick = useCallback((event) => {
    event.preventDefault()
    if (!state.isLoading) {
      cancel()
    }
  }, [state.isLoading, cancel])

  // 键盘事件监听
  useEffect(() => {
    if (state.isVisible) {
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [state.isVisible, handleKeyDown])

  // 自动聚焦处理
  useEffect(() => {
    if (state.isVisible) {
      const { autoFocus } = optionsRef.current
      
      if (autoFocus) {
        // 延迟聚焦，确保DOM已渲染
        const timer = setTimeout(() => {
          const confirmButton = document.querySelector('[data-confirm-dialog-confirm]')
          if (confirmButton && typeof confirmButton.focus === 'function') {
            confirmButton.focus()
          }
        }, 100)
        
        return () => clearTimeout(timer)
      }
    }
  }, [state.isVisible])

  // 组件卸载时清理
  useEffect(() => {
    mountedRef.current = true
    
    return () => {
      mountedRef.current = false
      clearAutoCloseTimer()
      
      // 清理未完成的Promise
      if (rejectRef.current) {
        rejectRef.current(new Error('Component unmounted'))
        rejectRef.current = null
      }
      if (resolveRef.current) {
        resolveRef.current = null
      }
    }
  }, [clearAutoCloseTimer])

  // 事件处理器对象
  const handlers = {
    onKeyDown: handleKeyDown,
    onOverlayClick: handleOverlayClick,
    onConfirmClick: handleConfirmClick,
    onCancelClick: handleCancelClick
  }

  return {
    state,
    showConfirm,
    hideConfirm,
    confirm,
    cancel,
    setLoading,
    handlers
  }
}

/**
 * 创建带有默认配置的useConfirmDialog Hook
 * @param {ConfirmDialogOptions} defaultOptions - 默认配置
 * @returns {Function} 配置好的useConfirmDialog Hook
 */
export const createUseConfirmDialog = (defaultOptions = {}) => {
  return (options = {}) => {
    const mergedOptions = { ...defaultOptions, ...options }
    return useConfirmDialog(mergedOptions)
  }
}

/**
 * 预配置的useConfirmDialog变体
 */

/**
 * 危险操作确认对话框
 */
export const useConfirmDialogDanger = (options = {}) => {
  return useConfirmDialog({
    type: 'danger',
    title: '危险操作',
    message: '此操作不可撤销，确定要继续吗？',
    confirmText: '确认删除',
    cancelText: '取消',
    ...options
  })
}

/**
 * 警告确认对话框
 */
export const useConfirmDialogWarning = (options = {}) => {
  return useConfirmDialog({
    type: 'warning',
    title: '警告',
    message: '请确认您的操作',
    confirmText: '继续',
    cancelText: '取消',
    ...options
  })
}

/**
 * 信息确认对话框
 */
export const useConfirmDialogInfo = (options = {}) => {
  return useConfirmDialog({
    type: 'info',
    title: '提示',
    message: '请确认',
    confirmText: '确定',
    cancelText: '取消',
    ...options
  })
}

/**
 * 简单确认对话框（无图标）
 */
export const useConfirmDialogSimple = (options = {}) => {
  return useConfirmDialog({
    showIcon: false,
    type: 'default',
    ...options
  })
}

export default useConfirmDialog