import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * 无限滚动配置选项
 * @typedef {Object} InfiniteScrollOptions
 * @property {number} [threshold=0.1] - 触发加载的阈值（0-1之间）
 * @property {number} [rootMargin='0px'] - 根边距
 * @property {HTMLElement} [root=null] - 滚动容器
 * @property {boolean} [enabled=true] - 是否启用无限滚动
 * @property {number} [debounceMs=300] - 防抖延迟时间
 * @property {Function} [onLoadMore] - 加载更多回调
 * @property {Function} [onError] - 错误处理回调
 * @property {boolean} [resetOnPropsChange=true] - 当依赖项变化时是否重置状态
 */

/**
 * 无限滚动状态
 * @typedef {Object} InfiniteScrollState
 * @property {boolean} isLoading - 是否正在加载
 * @property {boolean} hasMore - 是否还有更多数据
 * @property {Error|null} error - 错误信息
 * @property {number} page - 当前页码
 * @property {number} totalLoaded - 已加载的总数
 */

/**
 * 无限滚动Hook
 * 提供无限滚动加载功能，支持IntersectionObserver和手动触发
 * 
 * @param {Function} loadMore - 加载更多数据的函数
 * @param {InfiniteScrollOptions} [options={}] - 配置选项
 * @param {Array} [deps=[]] - 依赖项数组，变化时重置状态
 * @returns {Object} 无限滚动管理对象
 * @returns {React.RefObject} returns.loadMoreRef - 触发元素的ref
 * @returns {InfiniteScrollState} returns.state - 滚动状态
 * @returns {Function} returns.loadMoreManually - 手动触发加载
 * @returns {Function} returns.reset - 重置状态
 * @returns {Function} returns.setHasMore - 设置是否还有更多数据
 */
const useInfiniteScroll = (loadMore, options = {}, deps = []) => {
  const {
    threshold = 0.1,
    rootMargin = '0px',
    root = null,
    enabled = true,
    debounceMs = 300,
    onLoadMore,
    onError,
    resetOnPropsChange = true
  } = options

  const loadMoreRef = useRef(null)
  const observerRef = useRef(null)
  const debounceTimerRef = useRef(null)
  const isLoadingRef = useRef(false)
  const mountedRef = useRef(true)

  const [state, setState] = useState({
    isLoading: false,
    hasMore: true,
    error: null,
    page: 1,
    totalLoaded: 0
  })

  /**
   * 错误处理函数
   * @param {Error} error - 错误对象
   */
  const handleError = useCallback((error) => {
    console.error('useInfiniteScroll error:', error)
    
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
        console.error('useInfiniteScroll: onError callback failed:', callbackError)
      }
    }
  }, [onError])

  /**
   * 防抖执行函数
   * @param {Function} func - 要执行的函数
   * @param {number} delay - 延迟时间
   */
  const debounce = useCallback((func, delay) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    debounceTimerRef.current = setTimeout(() => {
      if (mountedRef.current) {
        func()
      }
    }, delay)
  }, [])

  /**
   * 执行加载更多操作
   */
  const executeLoadMore = useCallback(async () => {
    if (!enabled || isLoadingRef.current || !state.hasMore) {
      return
    }

    isLoadingRef.current = true
    
    if (mountedRef.current) {
      setState(prevState => ({
        ...prevState,
        isLoading: true,
        error: null
      }))
    }

    try {
      // 调用外部加载函数
      const result = await loadMore(state.page)
      
      if (!mountedRef.current) {
        return
      }

      // 处理加载结果
      if (result && typeof result === 'object') {
        const {
          data = [],
          hasMore: resultHasMore = true,
          total,
          page: resultPage
        } = result

        setState(prevState => {
          const newTotalLoaded = prevState.totalLoaded + (Array.isArray(data) ? data.length : 0)
          const newPage = resultPage || (prevState.page + 1)
          
          return {
            ...prevState,
            isLoading: false,
            hasMore: resultHasMore && (total ? newTotalLoaded < total : true),
            page: newPage,
            totalLoaded: newTotalLoaded,
            error: null
          }
        })
      } else {
        // 如果返回结果不是对象，假设加载完成
        setState(prevState => ({
          ...prevState,
          isLoading: false,
          hasMore: false,
          page: prevState.page + 1
        }))
      }

      // 触发加载完成回调
      if (onLoadMore && typeof onLoadMore === 'function') {
        try {
          onLoadMore(result, state.page)
        } catch (callbackError) {
          console.error('useInfiniteScroll: onLoadMore callback failed:', callbackError)
        }
      }
    } catch (error) {
      handleError(error)
    } finally {
      isLoadingRef.current = false
    }
  }, [enabled, state.hasMore, state.page, state.totalLoaded, loadMore, onLoadMore, handleError])

  /**
   * 手动触发加载更多
   */
  const loadMoreManually = useCallback(() => {
    if (debounceMs > 0) {
      debounce(executeLoadMore, debounceMs)
    } else {
      executeLoadMore()
    }
  }, [executeLoadMore, debounce, debounceMs])

  /**
   * 重置状态
   * @param {Object} [newState={}] - 新的状态值
   */
  const reset = useCallback((newState = {}) => {
    isLoadingRef.current = false
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    setState({
      isLoading: false,
      hasMore: true,
      error: null,
      page: 1,
      totalLoaded: 0,
      ...newState
    })
  }, [])

  /**
   * 设置是否还有更多数据
   * @param {boolean} hasMore - 是否还有更多数据
   */
  const setHasMore = useCallback((hasMore) => {
    setState(prevState => ({
      ...prevState,
      hasMore
    }))
  }, [])

  /**
   * IntersectionObserver回调
   * @param {IntersectionObserverEntry[]} entries - 观察条目
   */
  const handleIntersection = useCallback((entries) => {
    const [entry] = entries
    
    if (entry && entry.isIntersecting && enabled && !isLoadingRef.current && state.hasMore) {
      loadMoreManually()
    }
  }, [enabled, state.hasMore, loadMoreManually])

  // 设置IntersectionObserver
  useEffect(() => {
    if (!enabled || !loadMoreRef.current) {
      return
    }

    // 检查IntersectionObserver支持
    if (!window.IntersectionObserver) {
      console.warn('IntersectionObserver is not supported')
      return
    }

    const observerOptions = {
      root,
      rootMargin,
      threshold
    }

    observerRef.current = new IntersectionObserver(handleIntersection, observerOptions)
    
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [enabled, root, rootMargin, threshold, handleIntersection])

  // 依赖项变化时重置状态
  useEffect(() => {
    if (resetOnPropsChange && deps.length > 0) {
      reset()
    }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  // 组件卸载时清理
  useEffect(() => {
    mountedRef.current = true
    
    return () => {
      mountedRef.current = false
      isLoadingRef.current = false
      
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  return {
    loadMoreRef,
    state,
    loadMoreManually,
    reset,
    setHasMore
  }
}

/**
 * 创建带有默认配置的useInfiniteScroll Hook
 * @param {InfiniteScrollOptions} defaultOptions - 默认配置
 * @returns {Function} 配置好的useInfiniteScroll Hook
 */
export const createUseInfiniteScroll = (defaultOptions = {}) => {
  return (loadMore, options = {}, deps = []) => {
    const mergedOptions = { ...defaultOptions, ...options }
    return useInfiniteScroll(loadMore, mergedOptions, deps)
  }
}

/**
 * 预配置的useInfiniteScroll变体
 */

/**
 * 快速触发的无限滚动（无防抖）
 */
export const useInfiniteScrollFast = (loadMore, options = {}, deps = []) => {
  return useInfiniteScroll(loadMore, {
    debounceMs: 0,
    threshold: 0.1,
    ...options
  }, deps)
}

/**
 * 延迟触发的无限滚动（长防抖）
 */
export const useInfiniteScrollSlow = (loadMore, options = {}, deps = []) => {
  return useInfiniteScroll(loadMore, {
    debounceMs: 800,
    threshold: 0.3,
    ...options
  }, deps)
}

/**
 * 敏感触发的无限滚动（低阈值）
 */
export const useInfiniteScrollSensitive = (loadMore, options = {}, deps = []) => {
  return useInfiniteScroll(loadMore, {
    threshold: 0.05,
    rootMargin: '100px',
    ...options
  }, deps)
}

export default useInfiniteScroll