import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * 拖拽配置选项
 * @typedef {Object} DraggableOptions
 * @property {boolean} [disabled=false] - 是否禁用拖拽
 * @property {Object} [bounds] - 拖拽边界限制
 * @property {number} [bounds.left] - 左边界
 * @property {number} [bounds.right] - 右边界
 * @property {number} [bounds.top] - 上边界
 * @property {number} [bounds.bottom] - 下边界
 * @property {number} [threshold=5] - 拖拽触发阈值（像素）
 * @property {Function} [onDragStart] - 拖拽开始回调
 * @property {Function} [onDrag] - 拖拽中回调
 * @property {Function} [onDragEnd] - 拖拽结束回调
 * @property {boolean} [preventClick=true] - 拖拽后是否阻止点击事件
 * @property {number} [clickDelay=100] - 点击事件延迟时间（毫秒）
 */

/**
 * 位置信息
 * @typedef {Object} Position
 * @property {number} x - X坐标
 * @property {number} y - Y坐标
 */

/**
 * 拖拽状态
 * @typedef {Object} DragState
 * @property {boolean} isDragging - 是否正在拖拽
 * @property {Position} position - 当前位置
 * @property {Position} startPosition - 开始位置
 * @property {Position} offset - 偏移量
 */

/**
 * 可拖拽元素Hook
 * 提供拖拽功能的通用逻辑，支持鼠标和触摸事件
 * 
 * @param {DraggableOptions} [options={}] - 配置选项
 * @returns {Object} 拖拽管理对象
 * @returns {React.RefObject} returns.dragRef - 拖拽元素的ref
 * @returns {DragState} returns.dragState - 拖拽状态
 * @returns {Function} returns.setPosition - 设置位置
 * @returns {Function} returns.resetPosition - 重置位置
 * @returns {Object} returns.dragHandlers - 拖拽事件处理器
 */
const useDraggable = (options = {}) => {
  const {
    disabled = false,
    bounds,
    threshold = 5,
    onDragStart,
    onDrag,
    onDragEnd,
    preventClick = true,
    clickDelay = 100
  } = options

  const dragRef = useRef(null)
  const [dragState, setDragState] = useState({
    isDragging: false,
    position: { x: 0, y: 0 },
    startPosition: { x: 0, y: 0 },
    offset: { x: 0, y: 0 }
  })

  const dragDataRef = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    hasMoved: false,
    clickPrevented: false
  })

  /**
   * 获取事件坐标（兼容鼠标和触摸事件）
   * @param {MouseEvent|TouchEvent} event - 事件对象
   * @returns {Position} 坐标位置
   */
  const getEventPosition = useCallback((event) => {
    if (event.touches && event.touches.length > 0) {
      return {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
      }
    }
    return {
      x: event.clientX,
      y: event.clientY
    }
  }, [])

  /**
   * 应用边界限制
   * @param {Position} position - 目标位置
   * @param {HTMLElement} element - 拖拽元素
   * @returns {Position} 限制后的位置
   */
  const applyBounds = useCallback((position, element) => {
    if (!bounds || !element) return position

    const rect = element.getBoundingClientRect()
    const { left, right, top, bottom } = bounds

    let newX = position.x
    let newY = position.y

    if (typeof left === 'number') {
      newX = Math.max(left, newX)
    }
    if (typeof right === 'number') {
      newX = Math.min(right - rect.width, newX)
    }
    if (typeof top === 'number') {
      newY = Math.max(top, newY)
    }
    if (typeof bottom === 'number') {
      newY = Math.min(bottom - rect.height, newY)
    }

    return { x: newX, y: newY }
  }, [bounds])

  /**
   * 设置位置
   * @param {Position|Function} newPosition - 新位置或位置更新函数
   */
  const setPosition = useCallback((newPosition) => {
    setDragState(prevState => {
      const position = typeof newPosition === 'function' 
        ? newPosition(prevState.position)
        : newPosition
      
      const boundedPosition = applyBounds(position, dragRef.current)
      
      return {
        ...prevState,
        position: boundedPosition
      }
    })
  }, [applyBounds])

  /**
   * 重置位置到初始状态
   */
  const resetPosition = useCallback(() => {
    setDragState(prevState => ({
      ...prevState,
      position: { x: 0, y: 0 },
      offset: { x: 0, y: 0 }
    }))
  }, [])

  /**
   * 开始拖拽
   * @param {MouseEvent|TouchEvent} event - 事件对象
   */
  const handleDragStart = useCallback((event) => {
    if (disabled) return

    const position = getEventPosition(event)
    const currentTime = Date.now()

    dragDataRef.current = {
      startX: position.x,
      startY: position.y,
      startTime: currentTime,
      hasMoved: false,
      clickPrevented: false
    }

    setDragState(prevState => ({
      ...prevState,
      startPosition: position,
      isDragging: false // 还未确定是拖拽
    }))

    // 阻止默认行为（如文本选择）
    if (event.type === 'mousedown') {
      event.preventDefault()
    }
  }, [disabled, getEventPosition])

  /**
   * 拖拽移动
   * @param {MouseEvent|TouchEvent} event - 事件对象
   */
  const handleDragMove = useCallback((event) => {
    if (disabled) return

    const position = getEventPosition(event)
    const deltaX = position.x - dragDataRef.current.startX
    const deltaY = position.y - dragDataRef.current.startY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    // 检查是否超过拖拽阈值
    if (!dragState.isDragging && distance > threshold) {
      dragDataRef.current.hasMoved = true
      
      setDragState(prevState => ({
        ...prevState,
        isDragging: true
      }))

      // 触发拖拽开始回调
      if (onDragStart && typeof onDragStart === 'function') {
        try {
          onDragStart({
            startPosition: dragDataRef.current,
            currentPosition: position,
            element: dragRef.current
          })
        } catch (error) {
          console.error('useDraggable: onDragStart callback error:', error)
        }
      }
    }

    // 如果正在拖拽，更新位置
    if (dragState.isDragging || distance > threshold) {
      // 阻止页面滚动（触摸事件）
      if (event.type.startsWith('touch')) {
        event.preventDefault()
      }

      const newPosition = {
        x: dragState.position.x + deltaX,
        y: dragState.position.y + deltaY
      }

      const boundedPosition = applyBounds(newPosition, dragRef.current)

      setDragState(prevState => ({
        ...prevState,
        position: boundedPosition,
        offset: {
          x: boundedPosition.x - prevState.startPosition.x,
          y: boundedPosition.y - prevState.startPosition.y
        }
      }))

      // 更新起始位置为当前位置，实现连续拖拽
      dragDataRef.current.startX = position.x
      dragDataRef.current.startY = position.y

      // 触发拖拽中回调
      if (onDrag && typeof onDrag === 'function') {
        try {
          onDrag({
            position: boundedPosition,
            offset: { x: deltaX, y: deltaY },
            element: dragRef.current
          })
        } catch (error) {
          console.error('useDraggable: onDrag callback error:', error)
        }
      }
    }
  }, [disabled, getEventPosition, dragState.isDragging, dragState.position, threshold, applyBounds, onDragStart, onDrag])

  /**
   * 结束拖拽
   * @param {MouseEvent|TouchEvent} event - 事件对象
   */
  const handleDragEnd = useCallback((event) => {
    if (disabled) return

    const wasDragging = dragState.isDragging
    const hasMoved = dragDataRef.current.hasMoved

    setDragState(prevState => ({
      ...prevState,
      isDragging: false
    }))

    // 触发拖拽结束回调
    if (wasDragging && onDragEnd && typeof onDragEnd === 'function') {
      try {
        onDragEnd({
          finalPosition: dragState.position,
          hasMoved,
          element: dragRef.current
        })
      } catch (error) {
        console.error('useDraggable: onDragEnd callback error:', error)
      }
    }

    // 如果发生了拖拽且需要阻止点击，则延迟重置状态
    if (hasMoved && preventClick) {
      dragDataRef.current.clickPrevented = true
      setTimeout(() => {
        dragDataRef.current.clickPrevented = false
      }, clickDelay)
    }
  }, [disabled, dragState.isDragging, dragState.position, onDragEnd, preventClick, clickDelay])

  /**
   * 处理点击事件（用于阻止拖拽后的误触点击）
   * @param {MouseEvent} event - 点击事件
   */
  const handleClick = useCallback((event) => {
    if (dragDataRef.current.clickPrevented) {
      event.preventDefault()
      event.stopPropagation()
    }
  }, [])

  // 事件处理器对象
  const dragHandlers = {
    // 鼠标事件
    onMouseDown: handleDragStart,
    onMouseMove: dragState.isDragging ? handleDragMove : undefined,
    onMouseUp: handleDragEnd,
    
    // 触摸事件
    onTouchStart: handleDragStart,
    onTouchMove: dragState.isDragging ? handleDragMove : undefined,
    onTouchEnd: handleDragEnd,
    
    // 点击事件（用于阻止误触）
    onClick: preventClick ? handleClick : undefined
  }

  // 添加全局事件监听器（用于处理拖拽过程中鼠标移出元素的情况）
  useEffect(() => {
    if (!dragState.isDragging) return

    const handleGlobalMouseMove = (event) => handleDragMove(event)
    const handleGlobalMouseUp = (event) => handleDragEnd(event)
    const handleGlobalTouchMove = (event) => handleDragMove(event)
    const handleGlobalTouchEnd = (event) => handleDragEnd(event)

    document.addEventListener('mousemove', handleGlobalMouseMove)
    document.addEventListener('mouseup', handleGlobalMouseUp)
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false })
    document.addEventListener('touchend', handleGlobalTouchEnd)

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('touchmove', handleGlobalTouchMove)
      document.removeEventListener('touchend', handleGlobalTouchEnd)
    }
  }, [dragState.isDragging, handleDragMove, handleDragEnd])

  return {
    dragRef,
    dragState,
    setPosition,
    resetPosition,
    dragHandlers
  }
}

export default useDraggable