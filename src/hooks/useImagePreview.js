import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * 图片预览配置选项
 * @typedef {Object} ImagePreviewOptions
 * @property {boolean} [enableZoom=true] - 是否启用缩放功能
 * @property {boolean} [enableRotate=true] - 是否启用旋转功能
 * @property {number} [minZoom=0.1] - 最小缩放比例
 * @property {number} [maxZoom=5] - 最大缩放比例
 * @property {number} [zoomStep=0.1] - 缩放步长
 * @property {boolean} [enableKeyboard=true] - 是否启用键盘控制
 * @property {boolean} [enableWheel=true] - 是否启用鼠标滚轮缩放
 * @property {boolean} [enableDrag=true] - 是否启用拖拽移动
 * @property {boolean} [resetOnImageChange=true] - 切换图片时是否重置状态
 * @property {Function} [onZoomChange] - 缩放变化回调
 * @property {Function} [onRotateChange] - 旋转变化回调
 * @property {Function} [onPositionChange] - 位置变化回调
 * @property {Function} [onError] - 错误处理回调
 */

/**
 * 图片预览状态
 * @typedef {Object} ImagePreviewState
 * @property {boolean} isVisible - 是否显示预览
 * @property {string|null} currentImage - 当前预览的图片
 * @property {number} currentIndex - 当前图片索引
 * @property {number} zoom - 缩放比例
 * @property {number} rotation - 旋转角度
 * @property {Object} position - 图片位置 {x, y}
 * @property {boolean} isLoading - 是否正在加载
 * @property {Error|null} error - 错误信息
 * @property {boolean} isDragging - 是否正在拖拽
 */

/**
 * 图片预览Hook
 * 提供图片预览、缩放、旋转、拖拽等功能
 * 
 * @param {Array<string>} [images=[]] - 图片数组
 * @param {ImagePreviewOptions} [options={}] - 配置选项
 * @returns {Object} 图片预览管理对象
 * @returns {ImagePreviewState} returns.state - 预览状态
 * @returns {Function} returns.showPreview - 显示预览
 * @returns {Function} returns.hidePreview - 隐藏预览
 * @returns {Function} returns.nextImage - 下一张图片
 * @returns {Function} returns.prevImage - 上一张图片
 * @returns {Function} returns.zoomIn - 放大
 * @returns {Function} returns.zoomOut - 缩小
 * @returns {Function} returns.rotateLeft - 向左旋转
 * @returns {Function} returns.rotateRight - 向右旋转
 * @returns {Function} returns.resetTransform - 重置变换
 * @returns {Function} returns.setZoom - 设置缩放比例
 * @returns {Function} returns.setRotation - 设置旋转角度
 * @returns {Function} returns.setPosition - 设置位置
 * @returns {Object} returns.handlers - 事件处理器
 */
const useImagePreview = (images = [], options = {}) => {
  const {
    enableZoom = true,
    enableRotate = true,
    minZoom = 0.1,
    maxZoom = 5,
    zoomStep = 0.1,
    enableKeyboard = true,
    enableWheel = true,
    enableDrag = true,
    resetOnImageChange = true,
    onZoomChange,
    onRotateChange,
    onPositionChange,
    onError
  } = options

  const [state, setState] = useState({
    isVisible: false,
    currentImage: null,
    currentIndex: -1,
    zoom: 1,
    rotation: 0,
    position: { x: 0, y: 0 },
    isLoading: false,
    error: null,
    isDragging: false
  })

  const dragStartRef = useRef({ x: 0, y: 0 })
  const _dragPositionRef = useRef({ x: 0, y: 0 })
  const mountedRef = useRef(true)

  /**
   * 错误处理函数
   * @param {Error} error - 错误对象
   */
  const handleError = useCallback((error) => {
    console.error('useImagePreview error:', error)
    
    if (mountedRef.current) {
      setState(prevState => ({
        ...prevState,
        error,
        isLoading: false
      }))
    }

    if (onError && typeof onError === 'function') {
      try {
        onError(error)
      } catch (callbackError) {
        console.error('useImagePreview: onError callback failed:', callbackError)
      }
    }
  }, [onError])

  /**
   * 重置变换状态
   */
  const resetTransform = useCallback(() => {
    const newState = {
      zoom: 1,
      rotation: 0,
      position: { x: 0, y: 0 }
    }

    setState(prevState => ({
      ...prevState,
      ...newState
    }))

    // 触发回调
    if (onZoomChange) onZoomChange(1)
    if (onRotateChange) onRotateChange(0)
    if (onPositionChange) onPositionChange({ x: 0, y: 0 })
  }, [onZoomChange, onRotateChange, onPositionChange])

  /**
   * 显示预览
   * @param {string|number} imageOrIndex - 图片URL或索引
   */
  const showPreview = useCallback((imageOrIndex) => {
    try {
      let targetImage = null
      let targetIndex = -1

      if (typeof imageOrIndex === 'number') {
        // 按索引显示
        if (imageOrIndex >= 0 && imageOrIndex < images.length) {
          targetImage = images[imageOrIndex]
          targetIndex = imageOrIndex
        } else {
          throw new Error(`Invalid image index: ${imageOrIndex}`)
        }
      } else if (typeof imageOrIndex === 'string') {
        // 按URL显示
        targetIndex = images.indexOf(imageOrIndex)
        targetImage = imageOrIndex
      } else {
        throw new Error('Invalid image parameter')
      }

      if (!targetImage) {
        throw new Error('Image not found')
      }

      setState(prevState => {
        const newState = {
          ...prevState,
          isVisible: true,
          currentImage: targetImage,
          currentIndex: targetIndex,
          isLoading: true,
          error: null
        }

        // 如果切换图片时需要重置变换
        if (resetOnImageChange && prevState.currentImage !== targetImage) {
          newState.zoom = 1
          newState.rotation = 0
          newState.position = { x: 0, y: 0 }
        }

        return newState
      })

      // 预加载图片
      const img = new Image()
      img.onload = () => {
        if (mountedRef.current) {
          setState(prevState => ({
            ...prevState,
            isLoading: false
          }))
        }
      }
      img.onerror = () => {
        handleError(new Error(`Failed to load image: ${targetImage}`))
      }
      img.src = targetImage

    } catch (error) {
      handleError(error)
    }
  }, [images, resetOnImageChange, handleError])

  /**
   * 隐藏预览
   */
  const hidePreview = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      isVisible: false,
      isDragging: false
    }))
  }, [])

  /**
   * 下一张图片
   */
  const nextImage = useCallback(() => {
    if (images.length === 0) return
    
    const nextIndex = (state.currentIndex + 1) % images.length
    showPreview(nextIndex)
  }, [images.length, state.currentIndex, showPreview])

  /**
   * 上一张图片
   */
  const prevImage = useCallback(() => {
    if (images.length === 0) return
    
    const prevIndex = state.currentIndex <= 0 ? images.length - 1 : state.currentIndex - 1
    showPreview(prevIndex)
  }, [images.length, state.currentIndex, showPreview])

  /**
   * 设置缩放比例
   * @param {number} newZoom - 新的缩放比例
   */
  const setZoom = useCallback((newZoom) => {
    if (!enableZoom) return
    
    const clampedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom))
    
    setState(prevState => ({
      ...prevState,
      zoom: clampedZoom
    }))

    if (onZoomChange) {
      onZoomChange(clampedZoom)
    }
  }, [enableZoom, minZoom, maxZoom, onZoomChange])

  /**
   * 放大
   */
  const zoomIn = useCallback(() => {
    setZoom(state.zoom + zoomStep)
  }, [state.zoom, zoomStep, setZoom])

  /**
   * 缩小
   */
  const zoomOut = useCallback(() => {
    setZoom(state.zoom - zoomStep)
  }, [state.zoom, zoomStep, setZoom])

  /**
   * 设置旋转角度
   * @param {number} newRotation - 新的旋转角度
   */
  const setRotation = useCallback((newRotation) => {
    if (!enableRotate) return
    
    const normalizedRotation = ((newRotation % 360) + 360) % 360
    
    setState(prevState => ({
      ...prevState,
      rotation: normalizedRotation
    }))

    if (onRotateChange) {
      onRotateChange(normalizedRotation)
    }
  }, [enableRotate, onRotateChange])

  /**
   * 向左旋转
   */
  const rotateLeft = useCallback(() => {
    setRotation(state.rotation - 90)
  }, [state.rotation, setRotation])

  /**
   * 向右旋转
   */
  const rotateRight = useCallback(() => {
    setRotation(state.rotation + 90)
  }, [state.rotation, setRotation])

  /**
   * 设置位置
   * @param {Object} newPosition - 新的位置 {x, y}
   */
  const setPosition = useCallback((newPosition) => {
    if (!enableDrag) return
    
    setState(prevState => ({
      ...prevState,
      position: { ...newPosition }
    }))

    if (onPositionChange) {
      onPositionChange(newPosition)
    }
  }, [enableDrag, onPositionChange])

  /**
   * 鼠标滚轮事件处理
   * @param {WheelEvent} event - 滚轮事件
   */
  const handleWheel = useCallback((event) => {
    if (!enableWheel || !enableZoom) return
    
    event.preventDefault()
    
    const delta = event.deltaY > 0 ? -zoomStep : zoomStep
    setZoom(state.zoom + delta)
  }, [enableWheel, enableZoom, state.zoom, zoomStep, setZoom])

  /**
   * 鼠标按下事件处理
   * @param {MouseEvent} event - 鼠标事件
   */
  const handleMouseDown = useCallback((event) => {
    if (!enableDrag) return
    
    event.preventDefault()
    
    dragStartRef.current = {
      x: event.clientX - state.position.x,
      y: event.clientY - state.position.y
    }
    
    setState(prevState => ({
      ...prevState,
      isDragging: true
    }))
  }, [enableDrag, state.position])

  /**
   * 鼠标移动事件处理
   * @param {MouseEvent} event - 鼠标事件
   */
  const handleMouseMove = useCallback((event) => {
    if (!enableDrag || !state.isDragging) return
    
    event.preventDefault()
    
    const newPosition = {
      x: event.clientX - dragStartRef.current.x,
      y: event.clientY - dragStartRef.current.y
    }
    
    setPosition(newPosition)
  }, [enableDrag, state.isDragging, setPosition])

  /**
   * 鼠标抬起事件处理
   */
  const handleMouseUp = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      isDragging: false
    }))
  }, [])

  /**
   * 键盘事件处理
   * @param {KeyboardEvent} event - 键盘事件
   */
  const handleKeyDown = useCallback((event) => {
    if (!enableKeyboard || !state.isVisible) return
    
    switch (event.key) {
      case 'Escape':
        hidePreview()
        break
      case 'ArrowLeft':
        prevImage()
        break
      case 'ArrowRight':
        nextImage()
        break
      case '+':
      case '=':
        event.preventDefault()
        zoomIn()
        break
      case '-':
        event.preventDefault()
        zoomOut()
        break
      case '0':
        event.preventDefault()
        resetTransform()
        break
      case 'r':
      case 'R':
        event.preventDefault()
        rotateRight()
        break
      default:
        break
    }
  }, [enableKeyboard, state.isVisible, hidePreview, prevImage, nextImage, zoomIn, zoomOut, resetTransform, rotateRight])

  // 键盘事件监听
  useEffect(() => {
    if (enableKeyboard && state.isVisible) {
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [enableKeyboard, state.isVisible, handleKeyDown])

  // 鼠标事件监听
  useEffect(() => {
    if (enableDrag && state.isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [enableDrag, state.isDragging, handleMouseMove, handleMouseUp])

  // 组件卸载时清理
  useEffect(() => {
    mountedRef.current = true
    
    return () => {
      mountedRef.current = false
    }
  }, [])

  // 事件处理器对象
  const handlers = {
    onWheel: handleWheel,
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    onKeyDown: handleKeyDown
  }

  return {
    state,
    showPreview,
    hidePreview,
    nextImage,
    prevImage,
    zoomIn,
    zoomOut,
    rotateLeft,
    rotateRight,
    resetTransform,
    setZoom,
    setRotation,
    setPosition,
    handlers
  }
}

/**
 * 创建带有默认配置的useImagePreview Hook
 * @param {ImagePreviewOptions} defaultOptions - 默认配置
 * @returns {Function} 配置好的useImagePreview Hook
 */
export const createUseImagePreview = (defaultOptions = {}) => {
  return (images = [], options = {}) => {
    const mergedOptions = { ...defaultOptions, ...options }
    return useImagePreview(images, mergedOptions)
  }
}

/**
 * 预配置的useImagePreview变体
 */

/**
 * 简单的图片预览（仅支持基本功能）
 */
export const useImagePreviewSimple = (images = [], options = {}) => {
  return useImagePreview(images, {
    enableZoom: false,
    enableRotate: false,
    enableDrag: false,
    enableKeyboard: true,
    ...options
  })
}

/**
 * 完整功能的图片预览
 */
export const useImagePreviewFull = (images = [], options = {}) => {
  return useImagePreview(images, {
    enableZoom: true,
    enableRotate: true,
    enableDrag: true,
    enableKeyboard: true,
    enableWheel: true,
    minZoom: 0.1,
    maxZoom: 10,
    zoomStep: 0.2,
    ...options
  })
}

/**
 * 移动端优化的图片预览
 */
export const useImagePreviewMobile = (images = [], options = {}) => {
  return useImagePreview(images, {
    enableZoom: true,
    enableRotate: false,
    enableDrag: true,
    enableKeyboard: false,
    enableWheel: false,
    zoomStep: 0.2,
    ...options
  })
}

export default useImagePreview