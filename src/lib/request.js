/**
 * HTTP请求封装库
 * 基于fetch API，提供拦截器、缓存、重试等功能
 */

import { get as cacheGet, set as cacheSet } from './cache.js'
import { emit } from './eventBus.js'

/**
 * 请求配置
 * @typedef {Object} RequestConfig
 * @property {string} url - 请求URL
 * @property {string} [method='GET'] - 请求方法
 * @property {Object} [headers={}] - 请求头
 * @property {any} [data] - 请求数据
 * @property {Object} [params] - URL参数
 * @property {number} [timeout=10000] - 超时时间（毫秒）
 * @property {boolean} [cache=false] - 是否缓存
 * @property {number} [cacheTTL=300000] - 缓存时间（毫秒）
 * @property {number} [retry=0] - 重试次数
 * @property {number} [retryDelay=1000] - 重试延迟（毫秒）
 * @property {Function} [retryCondition] - 重试条件函数
 * @property {AbortSignal} [signal] - 取消信号
 * @property {Function} [onUploadProgress] - 上传进度回调
 * @property {Function} [onDownloadProgress] - 下载进度回调
 * @property {string} [responseType='json'] - 响应类型
 * @property {boolean} [withCredentials=false] - 是否携带凭证
 * @property {Object} [validateStatus] - 状态验证
 */

/**
 * 响应对象
 * @typedef {Object} Response
 * @property {any} data - 响应数据
 * @property {number} status - 状态码
 * @property {string} statusText - 状态文本
 * @property {Headers} headers - 响应头
 * @property {RequestConfig} config - 请求配置
 * @property {Request} request - 请求对象
 */

/**
 * 拦截器函数
 * @typedef {Function} Interceptor
 * @param {RequestConfig|Response} config - 请求配置或响应对象
 * @returns {RequestConfig|Response|Promise} 处理后的配置或响应
 */

/**
 * HTTP请求类
 */
class HttpClient {
  constructor(config = {}) {
    // 默认配置
    this.defaults = {
      baseURL: '',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      },
      responseType: 'json',
      withCredentials: false,
      cache: false,
      cacheTTL: 300000, // 5分钟
      retry: 0,
      retryDelay: 1000,
      validateStatus: (status) => status >= 200 && status < 300,
      ...config
    }

    // 拦截器
    this.interceptors = {
      request: [],
      response: []
    }

    // 请求队列
    this.requestQueue = new Map()
    
    // 统计信息
    this.stats = {
      total: 0,
      success: 0,
      error: 0,
      cached: 0,
      retried: 0
    }
  }

  /**
   * 添加请求拦截器
   * @param {Interceptor} fulfilled - 成功处理函数
   * @param {Interceptor} [rejected] - 失败处理函数
   * @returns {number} 拦截器ID
   */
  addRequestInterceptor(fulfilled, rejected) {
    const id = this.interceptors.request.length
    this.interceptors.request.push({ fulfilled, rejected, id })
    return id
  }

  /**
   * 添加响应拦截器
   * @param {Interceptor} fulfilled - 成功处理函数
   * @param {Interceptor} [rejected] - 失败处理函数
   * @returns {number} 拦截器ID
   */
  addResponseInterceptor(fulfilled, rejected) {
    const id = this.interceptors.response.length
    this.interceptors.response.push({ fulfilled, rejected, id })
    return id
  }

  /**
   * 移除请求拦截器
   * @param {number} id - 拦截器ID
   */
  removeRequestInterceptor(id) {
    const index = this.interceptors.request.findIndex(item => item.id === id)
    if (index !== -1) {
      this.interceptors.request.splice(index, 1)
    }
  }

  /**
   * 移除响应拦截器
   * @param {number} id - 拦截器ID
   */
  removeResponseInterceptor(id) {
    const index = this.interceptors.response.findIndex(item => item.id === id)
    if (index !== -1) {
      this.interceptors.response.splice(index, 1)
    }
  }

  /**
   * 发送请求
   * @param {RequestConfig} config - 请求配置
   * @returns {Promise<Response>} 响应Promise
   */
  async request(config) {
    try {
      // 合并配置
      const mergedConfig = this._mergeConfig(config)
      
      // 应用请求拦截器
      const processedConfig = await this._applyRequestInterceptors(mergedConfig)
      
      // 检查缓存
      if (processedConfig.cache && processedConfig.method.toLowerCase() === 'get') {
        const cacheKey = this._generateCacheKey(processedConfig)
        const cachedResponse = cacheGet(cacheKey)
        if (cachedResponse) {
          this.stats.cached++
          emit('request:cache-hit', { config: processedConfig, response: cachedResponse })
          return cachedResponse
        }
      }
      
      // 检查重复请求
      const requestKey = this._generateRequestKey(processedConfig)
      if (this.requestQueue.has(requestKey)) {
        return this.requestQueue.get(requestKey)
      }
      
      // 发送请求
      const requestPromise = this._sendRequest(processedConfig)
      this.requestQueue.set(requestKey, requestPromise)
      
      try {
        const response = await requestPromise
        this.requestQueue.delete(requestKey)
        
        // 缓存响应
        if (processedConfig.cache && processedConfig.method.toLowerCase() === 'get') {
          const cacheKey = this._generateCacheKey(processedConfig)
          cacheSet(cacheKey, response, { ttl: processedConfig.cacheTTL })
        }
        
        // 应用响应拦截器
        const processedResponse = await this._applyResponseInterceptors(response)
        
        this.stats.success++
        emit('request:success', { config: processedConfig, response: processedResponse })
        
        return processedResponse
      } catch (error) {
        this.requestQueue.delete(requestKey)
        throw error
      }
    } catch (error) {
      this.stats.error++
      emit('request:error', { config, error })
      
      // 应用响应拦截器（错误处理）
      for (const interceptor of this.interceptors.response) {
        if (interceptor.rejected) {
          try {
            const result = await interceptor.rejected(error)
            if (result) {
              return result
            }
          } catch (interceptorError) {
            // 记录拦截器错误，但不重新赋值给error参数
            console.error('Response interceptor error:', interceptorError)
          }
        }
      }
      
      throw error
    } finally {
      this.stats.total++
    }
  }

  /**
   * GET请求
   * @param {string} url - 请求URL
   * @param {RequestConfig} [config={}] - 请求配置
   * @returns {Promise<Response>} 响应Promise
   */
  get(url, config = {}) {
    return this.request({ ...config, url, method: 'GET' })
  }

  /**
   * POST请求
   * @param {string} url - 请求URL
   * @param {any} [data] - 请求数据
   * @param {RequestConfig} [config={}] - 请求配置
   * @returns {Promise<Response>} 响应Promise
   */
  post(url, data, config = {}) {
    return this.request({ ...config, url, method: 'POST', data })
  }

  /**
   * PUT请求
   * @param {string} url - 请求URL
   * @param {any} [data] - 请求数据
   * @param {RequestConfig} [config={}] - 请求配置
   * @returns {Promise<Response>} 响应Promise
   */
  put(url, data, config = {}) {
    return this.request({ ...config, url, method: 'PUT', data })
  }

  /**
   * PATCH请求
   * @param {string} url - 请求URL
   * @param {any} [data] - 请求数据
   * @param {RequestConfig} [config={}] - 请求配置
   * @returns {Promise<Response>} 响应Promise
   */
  patch(url, data, config = {}) {
    return this.request({ ...config, url, method: 'PATCH', data })
  }

  /**
   * DELETE请求
   * @param {string} url - 请求URL
   * @param {RequestConfig} [config={}] - 请求配置
   * @returns {Promise<Response>} 响应Promise
   */
  delete(url, config = {}) {
    return this.request({ ...config, url, method: 'DELETE' })
  }

  /**
   * HEAD请求
   * @param {string} url - 请求URL
   * @param {RequestConfig} [config={}] - 请求配置
   * @returns {Promise<Response>} 响应Promise
   */
  head(url, config = {}) {
    return this.request({ ...config, url, method: 'HEAD' })
  }

  /**
   * OPTIONS请求
   * @param {string} url - 请求URL
   * @param {RequestConfig} [config={}] - 请求配置
   * @returns {Promise<Response>} 响应Promise
   */
  options(url, config = {}) {
    return this.request({ ...config, url, method: 'OPTIONS' })
  }

  /**
   * 上传文件
   * @param {string} url - 上传URL
   * @param {FormData|File} data - 文件数据
   * @param {RequestConfig} [config={}] - 请求配置
   * @returns {Promise<Response>} 响应Promise
   */
  upload(url, data, config = {}) {
    const formData = data instanceof FormData ? data : (() => {
      const fd = new FormData()
      if (data instanceof File) {
        fd.append('file', data)
      } else {
        for (const [key, value] of Object.entries(data)) {
          fd.append(key, value)
        }
      }
      return fd
    })()

    return this.request({
      ...config,
      url,
      method: 'POST',
      data: formData,
      headers: {
        ...config.headers
        // 不设置Content-Type，让浏览器自动设置boundary
      }
    })
  }

  /**
   * 下载文件
   * @param {string} url - 下载URL
   * @param {RequestConfig} [config={}] - 请求配置
   * @returns {Promise<Blob>} 文件Blob
   */
  async download(url, config = {}) {
    const response = await this.request({
      ...config,
      url,
      method: 'GET',
      responseType: 'blob'
    })
    
    return response.data
  }

  /**
   * 取消所有请求
   */
  cancelAll() {
    for (const [_key, promise] of this.requestQueue.entries()) {
      if (promise.cancel && typeof promise.cancel === 'function') {
        promise.cancel()
      }
    }
    this.requestQueue.clear()
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.total > 0 ? (this.stats.success / this.stats.total) : 0,
      errorRate: this.stats.total > 0 ? (this.stats.error / this.stats.total) : 0,
      cacheHitRate: this.stats.total > 0 ? (this.stats.cached / this.stats.total) : 0,
      pendingRequests: this.requestQueue.size
    }
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.stats = {
      total: 0,
      success: 0,
      error: 0,
      cached: 0,
      retried: 0
    }
  }

  /**
   * 合并配置
   * @param {RequestConfig} config - 请求配置
   * @returns {RequestConfig} 合并后的配置
   * @private
   */
  _mergeConfig(config) {
    return {
      ...this.defaults,
      ...config,
      headers: {
        ...this.defaults.headers,
        ...config.headers
      }
    }
  }

  /**
   * 应用请求拦截器
   * @param {RequestConfig} config - 请求配置
   * @returns {Promise<RequestConfig>} 处理后的配置
   * @private
   */
  async _applyRequestInterceptors(config) {
    let processedConfig = config
    
    for (const interceptor of this.interceptors.request) {
      if (interceptor.fulfilled) {
        try {
          processedConfig = await interceptor.fulfilled(processedConfig)
        } catch (error) {
          if (interceptor.rejected) {
            processedConfig = await interceptor.rejected(error)
          } else {
            throw error
          }
        }
      }
    }
    
    return processedConfig
  }

  /**
   * 应用响应拦截器
   * @param {Response} response - 响应对象
   * @returns {Promise<Response>} 处理后的响应
   * @private
   */
  async _applyResponseInterceptors(response) {
    let processedResponse = response
    
    for (const interceptor of this.interceptors.response) {
      if (interceptor.fulfilled) {
        try {
          processedResponse = await interceptor.fulfilled(processedResponse)
        } catch (error) {
          if (interceptor.rejected) {
            processedResponse = await interceptor.rejected(error)
          } else {
            throw error
          }
        }
      }
    }
    
    return processedResponse
  }

  /**
   * 发送请求
   * @param {RequestConfig} config - 请求配置
   * @returns {Promise<Response>} 响应Promise
   * @private
   */
  async _sendRequest(config) {
    const { retry = 0, retryDelay = 1000, retryCondition } = config
    let lastError
    
    for (let attempt = 0; attempt <= retry; attempt++) {
      try {
        if (attempt > 0) {
          this.stats.retried++
          await this._delay(retryDelay * attempt)
        }
        
        return await this._performRequest(config)
      } catch (error) {
        lastError = error
        
        // 检查是否应该重试
        if (attempt < retry) {
          const shouldRetry = retryCondition 
            ? retryCondition(error, attempt)
            : this._defaultRetryCondition(error)
          
          if (!shouldRetry) {
            break
          }
        }
      }
    }
    
    throw lastError
  }

  /**
   * 执行请求
   * @param {RequestConfig} config - 请求配置
   * @returns {Promise<Response>} 响应Promise
   * @private
   */
  async _performRequest(config) {
    const {
      url,
      method = 'GET',
      headers = {},
      data,
      params,
      timeout = 10000,
      signal,
      responseType = 'json',
      withCredentials = false,
      validateStatus
    } = config

    // 构建完整URL
    const fullURL = this._buildURL(url, params)
    
    // 构建请求选项
    const fetchOptions = {
      method: method.toUpperCase(),
      headers: new Headers(headers),
      credentials: withCredentials ? 'include' : 'same-origin'
    }

    // 添加请求体
    if (data && !['GET', 'HEAD'].includes(method.toUpperCase())) {
      if (data instanceof FormData) {
        fetchOptions.body = data
      } else if (typeof data === 'object') {
        fetchOptions.body = JSON.stringify(data)
      } else {
        fetchOptions.body = data
      }
    }

    // 设置超时和取消信号
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    if (signal) {
      signal.addEventListener('abort', () => controller.abort())
    }
    
    fetchOptions.signal = controller.signal

    try {
      emit('request:start', { config, url: fullURL })
      
      const response = await fetch(fullURL, fetchOptions)
      
      clearTimeout(timeoutId)
      
      // 验证状态码
      if (validateStatus && !validateStatus(response.status)) {
        throw new Error(`请求失败，状态码: ${response.status}`)
      }

      // 解析响应数据
      let responseData
      switch (responseType.toLowerCase()) {
        case 'json':
          responseData = await response.json()
          break
        case 'text':
          responseData = await response.text()
          break
        case 'blob':
          responseData = await response.blob()
          break
        case 'arraybuffer':
          responseData = await response.arrayBuffer()
          break
        case 'formdata':
          responseData = await response.formData()
          break
        default:
          responseData = await response.json()
      }

      const result = {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config,
        request: response
      }
      
      emit('request:end', { config, response: result })
      
      return result
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        throw new Error('请求超时或被取消')
      }
      
      emit('request:error', { config, error })
      throw error
    }
  }

  /**
   * 构建URL
   * @param {string} url - 基础URL
   * @param {Object} [params] - 查询参数
   * @returns {string} 完整URL
   * @private
   */
  _buildURL(url, params) {
    let fullURL = url
    
    // 添加baseURL
    if (this.defaults.baseURL && !url.startsWith('http')) {
      fullURL = this.defaults.baseURL.replace(/\/$/, '') + '/' + url.replace(/^\//, '')
    }
    
    // 添加查询参数
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams()
      for (const [key, value] of Object.entries(params)) {
        if (value !== null && value !== undefined) {
          searchParams.append(key, value)
        }
      }
      
      const separator = fullURL.includes('?') ? '&' : '?'
      fullURL += separator + searchParams.toString()
    }
    
    return fullURL
  }

  /**
   * 生成缓存键
   * @param {RequestConfig} config - 请求配置
   * @returns {string} 缓存键
   * @private
   */
  _generateCacheKey(config) {
    const { url, method, params, data } = config
    const key = {
      url,
      method: method.toLowerCase(),
      params,
      data: method.toLowerCase() === 'get' ? undefined : data
    }
    return `request:${JSON.stringify(key)}`
  }

  /**
   * 生成请求键（用于防重复）
   * @param {RequestConfig} config - 请求配置
   * @returns {string} 请求键
   * @private
   */
  _generateRequestKey(config) {
    return this._generateCacheKey(config)
  }

  /**
   * 默认重试条件
   * @param {Error} error - 错误对象
   * @returns {boolean} 是否重试
   * @private
   */
  _defaultRetryCondition(error) {
    // 网络错误或5xx服务器错误时重试
    return error.name === 'TypeError' || 
           (error.response && error.response.status >= 500)
  }

  /**
   * 延迟函数
   * @param {number} ms - 延迟毫秒数
   * @returns {Promise} 延迟Promise
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 创建默认实例
const defaultClient = new HttpClient()

// 便捷方法
export const request = defaultClient.request.bind(defaultClient)
export const get = defaultClient.get.bind(defaultClient)
export const post = defaultClient.post.bind(defaultClient)
export const put = defaultClient.put.bind(defaultClient)
export const patch = defaultClient.patch.bind(defaultClient)
export const del = defaultClient.delete.bind(defaultClient)
export const head = defaultClient.head.bind(defaultClient)
export const options = defaultClient.options.bind(defaultClient)
export const upload = defaultClient.upload.bind(defaultClient)
export const download = defaultClient.download.bind(defaultClient)

// 拦截器方法
export const addRequestInterceptor = defaultClient.addRequestInterceptor.bind(defaultClient)
export const addResponseInterceptor = defaultClient.addResponseInterceptor.bind(defaultClient)
export const removeRequestInterceptor = defaultClient.removeRequestInterceptor.bind(defaultClient)
export const removeResponseInterceptor = defaultClient.removeResponseInterceptor.bind(defaultClient)

// 工具方法
export const cancelAll = defaultClient.cancelAll.bind(defaultClient)
export const getStats = defaultClient.getStats.bind(defaultClient)
export const resetStats = defaultClient.resetStats.bind(defaultClient)

// 导出类和默认实例
export { HttpClient }
export default defaultClient

// 常用拦截器
export const interceptors = {
  /**
   * 认证拦截器
   * @param {Function} getToken - 获取token的函数
   * @returns {Function} 拦截器函数
   */
  auth(getToken) {
    return (config) => {
      const token = getToken()
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`
        }
      }
      return config
    }
  },

  /**
   * 错误处理拦截器
   * @param {Object} handlers - 错误处理器
   * @returns {Function} 拦截器函数
   */
  errorHandler(handlers = {}) {
    return (error) => {
      const status = error.response?.status
      
      if (handlers[status]) {
        handlers[status](error)
      } else if (handlers.default) {
        handlers.default(error)
      }
      
      throw error
    }
  },

  /**
   * 加载状态拦截器
   * @param {Function} setLoading - 设置加载状态的函数
   * @returns {Object} 请求和响应拦截器
   */
  loading(setLoading) {
    let requestCount = 0
    
    return {
      request: (config) => {
        requestCount++
        setLoading(true)
        return config
      },
      response: (response) => {
        requestCount--
        if (requestCount === 0) {
          setLoading(false)
        }
        return response
      },
      error: (error) => {
        requestCount--
        if (requestCount === 0) {
          setLoading(false)
        }
        throw error
      }
    }
  },

  /**
   * 日志拦截器
   * @param {Object} options - 日志选项
   * @returns {Object} 请求和响应拦截器
   */
  logger(options = {}) {
    const { logRequest = true, logResponse = true, logError = true } = options
    
    return {
      request: (config) => {
        if (logRequest) {
          // console.log('🚀 Request:', config)
        }
        return config
      },
      response: (response) => {
        if (logResponse) {
          // console.log('✅ Response:', response)
        }
        return response
      },
      error: (error) => {
        if (logError) {
          console.error('❌ Error:', error)
        }
        throw error
      }
    }
  }
}

// 创建实例的工厂函数
export const createHttpClient = (config) => {
  return new HttpClient(config)
}