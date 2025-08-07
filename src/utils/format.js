/**
 * 数据格式化工具库
 * 提供常用的数据格式化功能
 */

/**
 * 格式化选项
 * @typedef {Object} FormatOptions
 * @property {string} [locale='zh-CN'] - 地区设置
 * @property {string} [currency='CNY'] - 货币类型
 * @property {string} [timezone='Asia/Shanghai'] - 时区
 * @property {number} [precision=2] - 精度
 * @property {boolean} [showSymbol=true] - 是否显示符号
 * @property {string} [separator=','] - 分隔符
 * @property {string} [placeholder='--'] - 占位符
 */

/**
 * 数字格式化
 */
export const number = {
  /**
   * 格式化数字为千分位格式
   * @param {number|string} value - 数值
   * @param {Object} [options={}] - 格式化选项
   * @returns {string} 格式化后的字符串
   */
  toThousands: (value, options = {}) => {
    const {
      precision = 2,
      separator = ',',
      placeholder = '--'
    } = options

    if (value === null || value === undefined || value === '') {
      return placeholder
    }

    const num = Number(value)
    if (isNaN(num)) {
      return placeholder
    }

    try {
      // 处理精度
      const fixedNum = precision >= 0 ? num.toFixed(precision) : num.toString()
      
      // 分割整数和小数部分
      const [integerPart, decimalPart] = fixedNum.split('.')
      
      // 添加千分位分隔符
      const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
      
      // 组合结果
      return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger
    } catch (error) {
      console.error('Number formatting error:', error)
      return placeholder
    }
  },

  /**
   * 格式化为百分比
   * @param {number|string} value - 数值（0-1之间或0-100之间）
   * @param {Object} [options={}] - 格式化选项
   * @returns {string} 格式化后的百分比字符串
   */
  toPercent: (value, options = {}) => {
    const {
      precision = 2,
      isDecimal = true, // 输入值是否为小数形式（0-1）
      showSymbol = true,
      placeholder = '--'
    } = options

    if (value === null || value === undefined || value === '') {
      return placeholder
    }

    const num = Number(value)
    if (isNaN(num)) {
      return placeholder
    }

    try {
      const percentage = isDecimal ? num * 100 : num
      const formatted = percentage.toFixed(precision)
      return showSymbol ? `${formatted}%` : formatted
    } catch (error) {
      console.error('Percentage formatting error:', error)
      return placeholder
    }
  },

  /**
   * 格式化文件大小
   * @param {number} bytes - 字节数
   * @param {Object} [options={}] - 格式化选项
   * @returns {string} 格式化后的文件大小
   */
  toFileSize: (bytes, options = {}) => {
    const {
      precision = 2,
      binary = false, // 是否使用二进制单位（1024）
      placeholder = '--'
    } = options

    if (bytes === null || bytes === undefined || bytes === '') {
      return placeholder
    }

    const num = Number(bytes)
    if (isNaN(num) || num < 0) {
      return placeholder
    }

    const units = binary 
      ? ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']
      : ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    
    const base = binary ? 1024 : 1000
    
    if (num === 0) return '0 B'
    
    try {
      const unitIndex = Math.floor(Math.log(num) / Math.log(base))
      const clampedIndex = Math.min(unitIndex, units.length - 1)
      const value = num / Math.pow(base, clampedIndex)
      
      return `${value.toFixed(precision)} ${units[clampedIndex]}`
    } catch (error) {
      console.error('File size formatting error:', error)
      return placeholder
    }
  },

  /**
   * 格式化为货币
   * @param {number|string} value - 数值
   * @param {Object} [options={}] - 格式化选项
   * @returns {string} 格式化后的货币字符串
   */
  toCurrency: (value, options = {}) => {
    const {
      currency = 'CNY',
      locale = 'zh-CN',
      precision = 2,
      showSymbol = true,
      placeholder = '--'
    } = options

    if (value === null || value === undefined || value === '') {
      return placeholder
    }

    const num = Number(value)
    if (isNaN(num)) {
      return placeholder
    }

    try {
      if (showSymbol && Intl && Intl.NumberFormat) {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: precision,
          maximumFractionDigits: precision
        }).format(num)
      } else {
        // 降级处理
        const formatted = number.toThousands(num, { precision })
        const symbols = {
          CNY: '¥',
          USD: '$',
          EUR: '€',
          JPY: '¥',
          GBP: '£'
        }
        const symbol = showSymbol ? (symbols[currency] || currency) : ''
        return `${symbol}${formatted}`
      }
    } catch (error) {
      console.error('Currency formatting error:', error)
      return placeholder
    }
  }
}

/**
 * 日期时间格式化
 */
export const date = {
  /**
   * 格式化日期
   * @param {Date|string|number} value - 日期值
   * @param {string} [format='YYYY-MM-DD'] - 格式字符串
   * @param {Object} [options={}] - 格式化选项
   * @returns {string} 格式化后的日期字符串
   */
  format: (value, format = 'YYYY-MM-DD', options = {}) => {
    const { placeholder = '--' } = options

    if (value === null || value === undefined || value === '') {
      return placeholder
    }

    try {
      const dateObj = new Date(value)
      if (isNaN(dateObj.getTime())) {
        return placeholder
      }

      const year = dateObj.getFullYear()
      const month = dateObj.getMonth() + 1
      const day = dateObj.getDate()
      const hours = dateObj.getHours()
      const minutes = dateObj.getMinutes()
      const seconds = dateObj.getSeconds()
      const milliseconds = dateObj.getMilliseconds()

      const formatMap = {
        'YYYY': year,
        'YY': year.toString().slice(-2),
        'MM': month.toString().padStart(2, '0'),
        'M': month,
        'DD': day.toString().padStart(2, '0'),
        'D': day,
        'HH': hours.toString().padStart(2, '0'),
        'H': hours,
        'mm': minutes.toString().padStart(2, '0'),
        'm': minutes,
        'ss': seconds.toString().padStart(2, '0'),
        's': seconds,
        'SSS': milliseconds.toString().padStart(3, '0')
      }

      let result = format
      for (const [key, val] of Object.entries(formatMap)) {
        result = result.replace(new RegExp(key, 'g'), val)
      }

      return result
    } catch (error) {
      console.error('Date formatting error:', error)
      return placeholder
    }
  },

  /**
   * 格式化为相对时间
   * @param {Date|string|number} value - 日期值
   * @param {Object} [options={}] - 格式化选项
   * @returns {string} 相对时间字符串
   */
  toRelative: (value, options = {}) => {
    const {
      locale = 'zh-CN',
      placeholder = '--',
      now = new Date()
    } = options

    if (value === null || value === undefined || value === '') {
      return placeholder
    }

    try {
      const dateObj = new Date(value)
      const nowObj = new Date(now)
      
      if (isNaN(dateObj.getTime()) || isNaN(nowObj.getTime())) {
        return placeholder
      }

      const diffMs = nowObj.getTime() - dateObj.getTime()
      const diffSeconds = Math.floor(diffMs / 1000)
      const diffMinutes = Math.floor(diffSeconds / 60)
      const diffHours = Math.floor(diffMinutes / 60)
      const diffDays = Math.floor(diffHours / 24)
      const diffMonths = Math.floor(diffDays / 30)
      const diffYears = Math.floor(diffDays / 365)

      if (locale === 'zh-CN') {
        if (diffSeconds < 60) return '刚刚'
        if (diffMinutes < 60) return `${diffMinutes}分钟前`
        if (diffHours < 24) return `${diffHours}小时前`
        if (diffDays < 30) return `${diffDays}天前`
        if (diffMonths < 12) return `${diffMonths}个月前`
        return `${diffYears}年前`
      } else {
        if (diffSeconds < 60) return 'just now'
        if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
        if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
        if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`
        return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`
      }
    } catch (error) {
      console.error('Relative time formatting error:', error)
      return placeholder
    }
  },

  /**
   * 格式化为友好的日期时间
   * @param {Date|string|number} value - 日期值
   * @param {Object} [options={}] - 格式化选项
   * @returns {string} 友好的日期时间字符串
   */
  toFriendly: (value, options = {}) => {
    const {
      locale = 'zh-CN',
      placeholder = '--',
      now = new Date()
    } = options

    if (value === null || value === undefined || value === '') {
      return placeholder
    }

    try {
      const dateObj = new Date(value)
      const nowObj = new Date(now)
      
      if (isNaN(dateObj.getTime()) || isNaN(nowObj.getTime())) {
        return placeholder
      }

      const diffMs = nowObj.getTime() - dateObj.getTime()
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      
      const isToday = diffDays === 0
      const isYesterday = diffDays === 1
      const isTomorrow = diffDays === -1
      const isThisYear = dateObj.getFullYear() === nowObj.getFullYear()

      if (locale === 'zh-CN') {
        if (isToday) {
          return `今天 ${date.format(dateObj, 'HH:mm')}`
        }
        if (isYesterday) {
          return `昨天 ${date.format(dateObj, 'HH:mm')}`
        }
        if (isTomorrow) {
          return `明天 ${date.format(dateObj, 'HH:mm')}`
        }
        if (isThisYear) {
          return date.format(dateObj, 'MM-DD HH:mm')
        }
        return date.format(dateObj, 'YYYY-MM-DD HH:mm')
      } else {
        if (isToday) {
          return `Today ${date.format(dateObj, 'HH:mm')}`
        }
        if (isYesterday) {
          return `Yesterday ${date.format(dateObj, 'HH:mm')}`
        }
        if (isTomorrow) {
          return `Tomorrow ${date.format(dateObj, 'HH:mm')}`
        }
        if (isThisYear) {
          return date.format(dateObj, 'MM-DD HH:mm')
        }
        return date.format(dateObj, 'YYYY-MM-DD HH:mm')
      }
    } catch (error) {
      console.error('Friendly date formatting error:', error)
      return placeholder
    }
  }
}

/**
 * 字符串格式化
 */
export const string = {
  /**
   * 截断字符串
   * @param {string} value - 字符串
   * @param {number} [maxLength=50] - 最大长度
   * @param {Object} [options={}] - 格式化选项
   * @returns {string} 截断后的字符串
   */
  truncate: (value, maxLength = 50, options = {}) => {
    const {
      suffix = '...',
      placeholder = '--'
    } = options

    if (value === null || value === undefined) {
      return placeholder
    }

    const str = String(value)
    if (str.length <= maxLength) {
      return str
    }

    return str.slice(0, maxLength - suffix.length) + suffix
  },

  /**
   * 脱敏处理
   * @param {string} value - 字符串
   * @param {Object} [options={}] - 脱敏选项
   * @returns {string} 脱敏后的字符串
   */
  mask: (value, options = {}) => {
    const {
      type = 'auto', // auto, phone, email, idCard, bankCard, custom
      maskChar = '*',
      keepStart = 3,
      keepEnd = 4,
      placeholder = '--'
    } = options

    if (value === null || value === undefined || value === '') {
      return placeholder
    }

    const str = String(value)
    
    try {
      switch (type) {
        case 'phone':
          // 手机号脱敏：138****1234
          if (str.length === 11) {
            return str.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
          }
          break
          
        case 'email':
          // 邮箱脱敏：abc***@example.com
          const emailMatch = str.match(/^(.{1,3}).*(@.+)$/)
          if (emailMatch) {
            return emailMatch[1] + '***' + emailMatch[2]
          }
          break
          
        case 'idCard':
          // 身份证脱敏：110***********1234
          if (str.length === 18) {
            return str.replace(/(\d{3})\d{11}(\d{4})/, '$1***********$2')
          }
          break
          
        case 'bankCard':
          // 银行卡脱敏：6222 **** **** 1234
          return str.replace(/(\d{4})\d*(\d{4})/, '$1 **** **** $2')
          
        case 'custom':
        case 'auto':
        default:
          // 通用脱敏
          if (str.length <= keepStart + keepEnd) {
            return str
          }
          const start = str.slice(0, keepStart)
          const end = str.slice(-keepEnd)
          const maskLength = str.length - keepStart - keepEnd
          return start + maskChar.repeat(maskLength) + end
      }
      
      return str
    } catch (error) {
      console.error('String masking error:', error)
      return placeholder
    }
  },

  /**
   * 首字母大写
   * @param {string} value - 字符串
   * @param {Object} [options={}] - 格式化选项
   * @returns {string} 首字母大写的字符串
   */
  capitalize: (value, options = {}) => {
    const { placeholder = '--' } = options

    if (value === null || value === undefined || value === '') {
      return placeholder
    }

    const str = String(value)
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  },

  /**
   * 驼峰命名转换
   * @param {string} value - 字符串
   * @param {Object} [options={}] - 格式化选项
   * @returns {string} 驼峰命名的字符串
   */
  toCamelCase: (value, options = {}) => {
    const { placeholder = '--' } = options

    if (value === null || value === undefined || value === '') {
      return placeholder
    }

    const str = String(value)
    return str
      .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
      .replace(/^[A-Z]/, char => char.toLowerCase())
  },

  /**
   * 下划线命名转换
   * @param {string} value - 字符串
   * @param {Object} [options={}] - 格式化选项
   * @returns {string} 下划线命名的字符串
   */
  toSnakeCase: (value, options = {}) => {
    const { placeholder = '--' } = options

    if (value === null || value === undefined || value === '') {
      return placeholder
    }

    const str = String(value)
    return str
      .replace(/([A-Z])/g, '_$1')
      .replace(/[-\s]+/g, '_')
      .toLowerCase()
      .replace(/^_/, '')
  }
}

/**
 * 数组格式化
 */
export const array = {
  /**
   * 数组转字符串
   * @param {Array} value - 数组
   * @param {Object} [options={}] - 格式化选项
   * @returns {string} 格式化后的字符串
   */
  join: (value, options = {}) => {
    const {
      separator = ', ',
      lastSeparator = ' 和 ',
      placeholder = '--',
      maxItems = 0, // 0表示不限制
      moreText = '等{count}项'
    } = options

    if (!Array.isArray(value) || value.length === 0) {
      return placeholder
    }

    try {
      let items = value.filter(item => item !== null && item !== undefined)
      
      if (maxItems > 0 && items.length > maxItems) {
        const visibleItems = items.slice(0, maxItems)
        const remainingCount = items.length - maxItems
        const moreTextFormatted = moreText.replace('{count}', remainingCount)
        items = [...visibleItems, moreTextFormatted]
      }

      if (items.length === 0) {
        return placeholder
      }
      
      if (items.length === 1) {
        return String(items[0])
      }
      
      if (items.length === 2) {
        return items.join(lastSeparator)
      }
      
      const allButLast = items.slice(0, -1).join(separator)
      const last = items[items.length - 1]
      return allButLast + lastSeparator + last
    } catch (error) {
      console.error('Array join formatting error:', error)
      return placeholder
    }
  }
}

/**
 * 对象格式化
 */
export const object = {
  /**
   * 对象转查询字符串
   * @param {Object} value - 对象
   * @param {Object} [options={}] - 格式化选项
   * @returns {string} 查询字符串
   */
  toQueryString: (value, options = {}) => {
    const {
      encode = true,
      skipNull = true,
      skipEmpty = true,
      arrayFormat = 'brackets' // brackets, indices, comma
    } = options

    if (!value || typeof value !== 'object') {
      return ''
    }

    try {
      const params = []
      
      for (const [key, val] of Object.entries(value)) {
        if (skipNull && (val === null || val === undefined)) continue
        if (skipEmpty && val === '') continue
        
        if (Array.isArray(val)) {
          switch (arrayFormat) {
            case 'brackets':
              val.forEach(item => {
                const encodedKey = encode ? encodeURIComponent(`${key}[]`) : `${key}[]`
                const encodedVal = encode ? encodeURIComponent(item) : item
                params.push(`${encodedKey}=${encodedVal}`)
              })
              break
            case 'indices':
              val.forEach((item, index) => {
                const encodedKey = encode ? encodeURIComponent(`${key}[${index}]`) : `${key}[${index}]`
                const encodedVal = encode ? encodeURIComponent(item) : item
                params.push(`${encodedKey}=${encodedVal}`)
              })
              break
            case 'comma':
              const encodedKey = encode ? encodeURIComponent(key) : key
              const encodedVal = encode ? encodeURIComponent(val.join(',')) : val.join(',')
              params.push(`${encodedKey}=${encodedVal}`)
              break
          }
        } else {
          const encodedKey = encode ? encodeURIComponent(key) : key
          const encodedVal = encode ? encodeURIComponent(val) : val
          params.push(`${encodedKey}=${encodedVal}`)
        }
      }
      
      return params.join('&')
    } catch (error) {
      console.error('Object to query string formatting error:', error)
      return ''
    }
  }
}

/**
 * 通用格式化函数
 * @param {any} value - 待格式化的值
 * @param {string} type - 格式化类型
 * @param {Object} [options={}] - 格式化选项
 * @returns {string} 格式化后的字符串
 */
export const format = (value, type, options = {}) => {
  try {
    switch (type) {
      // 数字格式化
      case 'number':
      case 'thousands':
        return number.toThousands(value, options)
      case 'percent':
      case 'percentage':
        return number.toPercent(value, options)
      case 'fileSize':
      case 'bytes':
        return number.toFileSize(value, options)
      case 'currency':
      case 'money':
        return number.toCurrency(value, options)
      
      // 日期格式化
      case 'date':
        return date.format(value, options.format, options)
      case 'relative':
      case 'relativeTime':
        return date.toRelative(value, options)
      case 'friendly':
      case 'friendlyDate':
        return date.toFriendly(value, options)
      
      // 字符串格式化
      case 'truncate':
        return string.truncate(value, options.maxLength, options)
      case 'mask':
        return string.mask(value, options)
      case 'capitalize':
        return string.capitalize(value, options)
      case 'camelCase':
        return string.toCamelCase(value, options)
      case 'snakeCase':
        return string.toSnakeCase(value, options)
      
      // 数组格式化
      case 'join':
      case 'arrayJoin':
        return array.join(value, options)
      
      // 对象格式化
      case 'queryString':
        return object.toQueryString(value, options)
      
      default:
        return String(value || options.placeholder || '--')
    }
  } catch (error) {
    console.error('Format error:', error)
    return options.placeholder || '--'
  }
}

/**
 * 创建格式化器
 * @param {string} type - 格式化类型
 * @param {Object} [defaultOptions={}] - 默认选项
 * @returns {Function} 格式化器函数
 */
export const createFormatter = (type, defaultOptions = {}) => {
  return (value, options = {}) => {
    const mergedOptions = { ...defaultOptions, ...options }
    return format(value, type, mergedOptions)
  }
}

export default {
  number,
  date,
  string,
  array,
  object,
  format,
  createFormatter
}