/**
 * 文件处理工具库
 * 提供文件上传、下载、格式验证等功能
 */

/**
 * 文件类型配置
 */
export const FILE_TYPES = {
  // 图片类型
  image: {
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/svg+xml'],
    maxSize: 10 * 1024 * 1024 // 10MB
  },
  // 文档类型
  document: {
    extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'],
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain'
    ],
    maxSize: 50 * 1024 * 1024 // 50MB
  },
  // 音频类型
  audio: {
    extensions: ['mp3', 'wav', 'ogg', 'aac', 'flac'],
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac'],
    maxSize: 100 * 1024 * 1024 // 100MB
  },
  // 视频类型
  video: {
    extensions: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
    mimeTypes: ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-ms-wmv', 'video/x-flv', 'video/webm'],
    maxSize: 500 * 1024 * 1024 // 500MB
  },
  // 压缩文件类型
  archive: {
    extensions: ['zip', 'rar', '7z', 'tar', 'gz'],
    mimeTypes: [
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/x-tar',
      'application/gzip'
    ],
    maxSize: 100 * 1024 * 1024 // 100MB
  }
}

/**
 * 文件验证结果
 * @typedef {Object} FileValidationResult
 * @property {boolean} isValid - 是否验证通过
 * @property {string} [error] - 错误信息
 * @property {string} [code] - 错误代码
 */

/**
 * 文件上传选项
 * @typedef {Object} FileUploadOptions
 * @property {string} [url] - 上传地址
 * @property {string} [method='POST'] - 请求方法
 * @property {Object} [headers={}] - 请求头
 * @property {Object} [data={}] - 额外数据
 * @property {string} [fieldName='file'] - 文件字段名
 * @property {Function} [onProgress] - 进度回调
 * @property {Function} [onSuccess] - 成功回调
 * @property {Function} [onError] - 错误回调
 * @property {number} [timeout=30000] - 超时时间
 * @property {boolean} [withCredentials=false] - 是否携带凭证
 */

/**
 * 获取文件扩展名
 * @param {string} filename - 文件名
 * @returns {string} 扩展名（小写，不含点）
 */
export const getFileExtension = (filename) => {
  if (!filename || typeof filename !== 'string') {
    return ''
  }
  
  const lastDotIndex = filename.lastIndexOf('.')
  if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
    return ''
  }
  
  return filename.slice(lastDotIndex + 1).toLowerCase()
}

/**
 * 获取文件名（不含扩展名）
 * @param {string} filename - 文件名
 * @returns {string} 文件名（不含扩展名）
 */
export const getFileName = (filename) => {
  if (!filename || typeof filename !== 'string') {
    return ''
  }
  
  const lastDotIndex = filename.lastIndexOf('.')
  if (lastDotIndex === -1) {
    return filename
  }
  
  return filename.slice(0, lastDotIndex)
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @param {number} [decimals=2] - 小数位数
 * @returns {string} 格式化后的文件大小
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 B'
  if (!bytes || isNaN(bytes)) return '--'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * 验证文件类型
 * @param {File} file - 文件对象
 * @param {Array<string>|string} allowedTypes - 允许的文件类型
 * @returns {FileValidationResult} 验证结果
 */
export const validateFileType = (file, allowedTypes) => {
  if (!file || !(file instanceof File)) {
    return {
      isValid: false,
      error: '无效的文件对象',
      code: 'INVALID_FILE'
    }
  }
  
  if (!allowedTypes) {
    return { isValid: true }
  }
  
  const types = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes]
  const fileExtension = getFileExtension(file.name)
  const fileMimeType = file.type
  
  // 检查扩展名和MIME类型
  for (const type of types) {
    if (typeof type === 'string') {
      // 直接字符串比较（扩展名）
      if (type.toLowerCase() === fileExtension) {
        return { isValid: true }
      }
      
      // MIME类型比较
      if (type === fileMimeType) {
        return { isValid: true }
      }
    } else if (FILE_TYPES[type]) {
      // 预定义类型
      const typeConfig = FILE_TYPES[type]
      if (typeConfig.extensions.includes(fileExtension) || 
          typeConfig.mimeTypes.includes(fileMimeType)) {
        return { isValid: true }
      }
    }
  }
  
  return {
    isValid: false,
    error: `不支持的文件类型：${fileExtension || fileMimeType}`,
    code: 'UNSUPPORTED_FILE_TYPE'
  }
}

/**
 * 验证文件大小
 * @param {File} file - 文件对象
 * @param {number} maxSize - 最大文件大小（字节）
 * @returns {FileValidationResult} 验证结果
 */
export const validateFileSize = (file, maxSize) => {
  if (!file || !(file instanceof File)) {
    return {
      isValid: false,
      error: '无效的文件对象',
      code: 'INVALID_FILE'
    }
  }
  
  if (!maxSize || maxSize <= 0) {
    return { isValid: true }
  }
  
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `文件大小超出限制，最大允许 ${formatFileSize(maxSize)}`,
      code: 'FILE_TOO_LARGE'
    }
  }
  
  return { isValid: true }
}

/**
 * 综合验证文件
 * @param {File} file - 文件对象
 * @param {Object} [options={}] - 验证选项
 * @returns {FileValidationResult} 验证结果
 */
export const validateFile = (file, options = {}) => {
  const {
    allowedTypes,
    maxSize,
    minSize = 0,
    allowEmpty = false
  } = options
  
  // 基础验证
  if (!file || !(file instanceof File)) {
    return {
      isValid: false,
      error: '无效的文件对象',
      code: 'INVALID_FILE'
    }
  }
  
  // 空文件验证
  if (file.size === 0 && !allowEmpty) {
    return {
      isValid: false,
      error: '不允许上传空文件',
      code: 'EMPTY_FILE'
    }
  }
  
  // 最小大小验证
  if (minSize > 0 && file.size < minSize) {
    return {
      isValid: false,
      error: `文件大小不能小于 ${formatFileSize(minSize)}`,
      code: 'FILE_TOO_SMALL'
    }
  }
  
  // 文件类型验证
  if (allowedTypes) {
    const typeResult = validateFileType(file, allowedTypes)
    if (!typeResult.isValid) {
      return typeResult
    }
  }
  
  // 文件大小验证
  if (maxSize) {
    const sizeResult = validateFileSize(file, maxSize)
    if (!sizeResult.isValid) {
      return sizeResult
    }
  }
  
  return { isValid: true }
}

/**
 * 读取文件内容
 * @param {File} file - 文件对象
 * @param {string} [readAs='text'] - 读取方式：text, dataURL, arrayBuffer, binaryString
 * @returns {Promise<string|ArrayBuffer>} 文件内容
 */
export const readFile = (file, readAs = 'text') => {
  return new Promise((resolve, reject) => {
    if (!file || !(file instanceof File)) {
      reject(new Error('无效的文件对象'))
      return
    }
    
    const reader = new FileReader()
    
    reader.onload = (event) => {
      resolve(event.target.result)
    }
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    
    reader.onabort = () => {
      reject(new Error('文件读取被中断'))
    }
    
    try {
      switch (readAs.toLowerCase()) {
        case 'text':
          reader.readAsText(file)
          break
        case 'dataurl':
        case 'data-url':
          reader.readAsDataURL(file)
          break
        case 'arraybuffer':
        case 'array-buffer':
          reader.readAsArrayBuffer(file)
          break
        case 'binarystring':
        case 'binary-string':
          reader.readAsBinaryString(file)
          break
        default:
          reader.readAsText(file)
      }
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 读取图片文件并获取尺寸信息
 * @param {File} file - 图片文件
 * @returns {Promise<Object>} 图片信息
 */
export const readImageFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file || !(file instanceof File)) {
      reject(new Error('无效的文件对象'))
      return
    }
    
    // 验证是否为图片文件
    const typeResult = validateFileType(file, 'image')
    if (!typeResult.isValid) {
      reject(new Error(typeResult.error))
      return
    }
    
    const reader = new FileReader()
    
    reader.onload = (event) => {
      const img = new Image()
      
      img.onload = () => {
        resolve({
          file,
          dataURL: event.target.result,
          width: img.width,
          height: img.height,
          size: file.size,
          type: file.type,
          name: file.name,
          lastModified: file.lastModified
        })
      }
      
      img.onerror = () => {
        reject(new Error('图片加载失败'))
      }
      
      img.src = event.target.result
    }
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * 压缩图片
 * @param {File} file - 图片文件
 * @param {Object} [options={}] - 压缩选项
 * @returns {Promise<File>} 压缩后的文件
 */
export const compressImage = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      quality = 0.8,
      maxWidth = 1920,
      maxHeight = 1080,
      outputFormat = 'image/jpeg',
      fileName
    } = options
    
    if (!file || !(file instanceof File)) {
      reject(new Error('无效的文件对象'))
      return
    }
    
    // 验证是否为图片文件
    const typeResult = validateFileType(file, 'image')
    if (!typeResult.isValid) {
      reject(new Error(typeResult.error))
      return
    }
    
    const reader = new FileReader()
    
    reader.onload = (event) => {
      const img = new Image()
      
      img.onload = () => {
        // 计算压缩后的尺寸
        let { width, height } = img
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.floor(width * ratio)
          height = Math.floor(height * ratio)
        }
        
        // 创建canvas进行压缩
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        canvas.width = width
        canvas.height = height
        
        // 绘制图片
        ctx.drawImage(img, 0, 0, width, height)
        
        // 转换为Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File(
                [blob],
                fileName || file.name,
                {
                  type: outputFormat,
                  lastModified: Date.now()
                }
              )
              resolve(compressedFile)
            } else {
              reject(new Error('图片压缩失败'))
            }
          },
          outputFormat,
          quality
        )
      }
      
      img.onerror = () => {
        reject(new Error('图片加载失败'))
      }
      
      img.src = event.target.result
    }
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * 上传文件
 * @param {File} file - 文件对象
 * @param {FileUploadOptions} options - 上传选项
 * @returns {Promise<any>} 上传结果
 */
export const uploadFile = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      url,
      method = 'POST',
      headers = {},
      data = {},
      fieldName = 'file',
      onProgress,
      onSuccess,
      onError,
      timeout = 30000,
      withCredentials = false
    } = options
    
    if (!url) {
      reject(new Error('上传地址不能为空'))
      return
    }
    
    if (!file || !(file instanceof File)) {
      reject(new Error('无效的文件对象'))
      return
    }
    
    const xhr = new XMLHttpRequest()
    const formData = new FormData()
    
    // 添加文件
    formData.append(fieldName, file)
    
    // 添加额外数据
    for (const [key, value] of Object.entries(data)) {
      formData.append(key, value)
    }
    
    // 设置上传进度回调
    if (onProgress && typeof onProgress === 'function') {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percent: percentComplete
          })
        }
      })
    }
    
    // 设置响应处理
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = xhr.responseText ? JSON.parse(xhr.responseText) : {}
          
          if (onSuccess && typeof onSuccess === 'function') {
            onSuccess(response)
          }
          
          resolve(response)
        } catch {
          const parseError = new Error('响应解析失败')
          
          if (onError && typeof onError === 'function') {
            onError(parseError)
          }
          
          reject(parseError)
        }
      } else {
        const statusError = new Error(`上传失败，状态码：${xhr.status}`)
        
        if (onError && typeof onError === 'function') {
          onError(statusError)
        }
        
        reject(statusError)
      }
    })
    
    // 设置错误处理
    xhr.addEventListener('error', () => {
      const networkError = new Error('网络错误')
      
      if (onError && typeof onError === 'function') {
        onError(networkError)
      }
      
      reject(networkError)
    })
    
    // 设置超时处理
    xhr.addEventListener('timeout', () => {
      const timeoutError = new Error('上传超时')
      
      if (onError && typeof onError === 'function') {
        onError(timeoutError)
      }
      
      reject(timeoutError)
    })
    
    // 设置中断处理
    xhr.addEventListener('abort', () => {
      const abortError = new Error('上传被中断')
      
      if (onError && typeof onError === 'function') {
        onError(abortError)
      }
      
      reject(abortError)
    })
    
    // 配置请求
    xhr.open(method.toUpperCase(), url)
    xhr.timeout = timeout
    xhr.withCredentials = withCredentials
    
    // 设置请求头
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value)
    }
    
    // 发送请求
    xhr.send(formData)
    
    // 返回取消函数
    const cancel = () => {
      xhr.abort()
    }
    
    // 将取消函数附加到Promise上
    resolve.cancel = cancel
  })
}

/**
 * 下载文件
 * @param {string} url - 文件URL
 * @param {string} [filename] - 文件名
 * @param {Object} [options={}] - 下载选项
 * @returns {Promise<void>} 下载Promise
 */
export const downloadFile = (url, filename, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      method = 'GET',
      headers = {},
      timeout = 30000
    } = options
    
    if (!url) {
      reject(new Error('下载地址不能为空'))
      return
    }
    
    try {
      // 尝试直接下载（适用于同源文件）
      const link = document.createElement('a')
      link.href = url
      
      if (filename) {
        link.download = filename
      }
      
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      resolve()
    } catch {
      // 如果直接下载失败，尝试通过fetch下载
      fetch(url, {
        method,
        headers,
        signal: AbortSignal.timeout(timeout)
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`下载失败，状态码：${response.status}`)
          }
          return response.blob()
        })
        .then(blob => {
          const objectURL = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = objectURL
          
          if (filename) {
            link.download = filename
          }
          
          link.style.display = 'none'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          // 清理对象URL
          URL.revokeObjectURL(objectURL)
          
          resolve()
        })
        .catch(reject)
    }
  })
}

/**
 * 创建文件选择器
 * @param {Object} [options={}] - 选择器选项
 * @returns {Promise<FileList>} 选择的文件列表
 */
export const selectFiles = (options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      accept,
      multiple = false,
      capture
    } = options
    
    try {
      const input = document.createElement('input')
      input.type = 'file'
      input.style.display = 'none'
      
      if (accept) {
        input.accept = accept
      }
      
      if (multiple) {
        input.multiple = true
      }
      
      if (capture) {
        input.capture = capture
      }
      
      input.addEventListener('change', (event) => {
        const files = event.target.files
        document.body.removeChild(input)
        
        if (files && files.length > 0) {
          resolve(files)
        } else {
          reject(new Error('未选择文件'))
        }
      })
      
      input.addEventListener('cancel', () => {
        document.body.removeChild(input)
        reject(new Error('用户取消选择'))
      })
      
      document.body.appendChild(input)
      input.click()
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 批量处理文件
 * @param {FileList|Array<File>} files - 文件列表
 * @param {Function} processor - 处理函数
 * @param {Object} [options={}] - 处理选项
 * @returns {Promise<Array>} 处理结果
 */
export const batchProcessFiles = async (files, processor, options = {}) => {
  const {
    concurrency = 3, // 并发数
    onProgress,
    onError
  } = options
  
  if (!files || files.length === 0) {
    return []
  }
  
  const fileArray = Array.from(files)
  const results = []
  const errors = []
  
  // 分批处理
  for (let i = 0; i < fileArray.length; i += concurrency) {
    const batch = fileArray.slice(i, i + concurrency)
    
    const batchPromises = batch.map(async (file, index) => {
      try {
        const result = await processor(file, i + index)
        
        if (onProgress && typeof onProgress === 'function') {
          onProgress({
            completed: results.length + 1,
            total: fileArray.length,
            current: file,
            result
          })
        }
        
        return result
      } catch (error) {
        const errorInfo = {
          file,
          index: i + index,
          error
        }
        
        errors.push(errorInfo)
        
        if (onError && typeof onError === 'function') {
          onError(errorInfo)
        }
        
        return null
      }
    })
    
    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
  }
  
  return {
    results: results.filter(result => result !== null),
    errors,
    total: fileArray.length,
    success: results.filter(result => result !== null).length,
    failed: errors.length
  }
}

export default {
  FILE_TYPES,
  getFileExtension,
  getFileName,
  formatFileSize,
  validateFileType,
  validateFileSize,
  validateFile,
  readFile,
  readImageFile,
  compressImage,
  uploadFile,
  downloadFile,
  selectFiles,
  batchProcessFiles
}