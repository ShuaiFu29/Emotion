/**
 * 表单验证工具库
 * 提供常用的表单验证规则和验证器
 */

/**
 * 验证结果对象
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - 是否验证通过
 * @property {string} [message] - 错误消息
 * @property {string} [code] - 错误代码
 */

/**
 * 验证规则配置
 * @typedef {Object} ValidationRule
 * @property {boolean} [required] - 是否必填
 * @property {number} [minLength] - 最小长度
 * @property {number} [maxLength] - 最大长度
 * @property {number} [min] - 最小值
 * @property {number} [max] - 最大值
 * @property {RegExp|string} [pattern] - 正则表达式
 * @property {Function} [custom] - 自定义验证函数
 * @property {string} [message] - 自定义错误消息
 */

/**
 * 表单验证配置
 * @typedef {Object} FormValidationConfig
 * @property {Object<string, ValidationRule>} rules - 字段验证规则
 * @property {boolean} [validateOnChange=true] - 是否在值改变时验证
 * @property {boolean} [validateOnBlur=true] - 是否在失焦时验证
 * @property {boolean} [stopOnFirstError=false] - 是否在第一个错误时停止验证
 * @property {Function} [onValidate] - 验证回调
 * @property {Function} [onError] - 错误回调
 */

// 常用正则表达式
export const REGEX_PATTERNS = {
  // 邮箱
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  // 手机号（中国大陆）
  phone: /^1[3-9]\d{9}$/,
  // 身份证号（中国大陆）
  idCard: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/,
  // 密码（至少8位，包含字母和数字）
  password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
  // 强密码（至少8位，包含大小写字母、数字和特殊字符）
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  // URL
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  // IPv4地址
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  // 中文字符
  chinese: /^[\u4e00-\u9fa5]+$/,
  // 数字
  number: /^\d+$/,
  // 小数
  decimal: /^\d+(\.\d+)?$/,
  // 整数（包括负数）
  integer: /^-?\d+$/,
  // 字母
  letter: /^[a-zA-Z]+$/,
  // 字母和数字
  alphanumeric: /^[a-zA-Z0-9]+$/,
  // 用户名（字母、数字、下划线，3-20位）
  username: /^[a-zA-Z0-9_]{3,20}$/,
  // 银行卡号
  bankCard: /^[1-9]\d{12,19}$/,
  // 邮政编码（中国）
  zipCode: /^[1-9]\d{5}$/,
  // QQ号
  qq: /^[1-9][0-9]{4,10}$/,
  // 微信号
  wechat: /^[a-zA-Z][-_a-zA-Z0-9]{5,19}$/
}

// 错误消息模板
export const ERROR_MESSAGES = {
  required: '此字段为必填项',
  minLength: '长度不能少于{min}个字符',
  maxLength: '长度不能超过{max}个字符',
  min: '值不能小于{min}',
  max: '值不能大于{max}',
  pattern: '格式不正确',
  email: '请输入有效的邮箱地址',
  phone: '请输入有效的手机号码',
  idCard: '请输入有效的身份证号码',
  password: '密码至少8位，包含字母和数字',
  strongPassword: '密码至少8位，包含大小写字母、数字和特殊字符',
  url: '请输入有效的URL地址',
  ipv4: '请输入有效的IPv4地址',
  chinese: '只能输入中文字符',
  number: '只能输入数字',
  decimal: '请输入有效的数字',
  integer: '请输入有效的整数',
  letter: '只能输入字母',
  alphanumeric: '只能输入字母和数字',
  username: '用户名只能包含字母、数字、下划线，长度3-20位',
  bankCard: '请输入有效的银行卡号',
  zipCode: '请输入有效的邮政编码',
  qq: '请输入有效的QQ号',
  wechat: '请输入有效的微信号'
}

/**
 * 格式化错误消息
 * @param {string} template - 消息模板
 * @param {Object} params - 参数对象
 * @returns {string} 格式化后的消息
 */
const formatMessage = (template, params = {}) => {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? params[key] : match
  })
}

/**
 * 基础验证器
 */
export const validators = {
  /**
   * 必填验证
   * @param {any} value - 待验证的值
   * @param {string} [message] - 自定义错误消息
   * @returns {ValidationResult} 验证结果
   */
  required: (value, message) => {
    const isEmpty = value === null || value === undefined ||
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0)

    return {
      isValid: !isEmpty,
      message: isEmpty ? (message || ERROR_MESSAGES.required) : undefined,
      code: isEmpty ? 'REQUIRED' : undefined
    }
  },

  /**
   * 最小长度验证
   * @param {string|Array} value - 待验证的值
   * @param {number} minLength - 最小长度
   * @param {string} [message] - 自定义错误消息
   * @returns {ValidationResult} 验证结果
   */
  minLength: (value, minLength, message) => {
    if (value === null || value === undefined) {
      return { isValid: true }
    }

    const length = typeof value === 'string' ? value.length :
      Array.isArray(value) ? value.length : 0
    const isValid = length >= minLength

    return {
      isValid,
      message: !isValid ? (message || formatMessage(ERROR_MESSAGES.minLength, { min: minLength })) : undefined,
      code: !isValid ? 'MIN_LENGTH' : undefined
    }
  },

  /**
   * 最大长度验证
   * @param {string|Array} value - 待验证的值
   * @param {number} maxLength - 最大长度
   * @param {string} [message] - 自定义错误消息
   * @returns {ValidationResult} 验证结果
   */
  maxLength: (value, maxLength, message) => {
    if (value === null || value === undefined) {
      return { isValid: true }
    }

    const length = typeof value === 'string' ? value.length :
      Array.isArray(value) ? value.length : 0
    const isValid = length <= maxLength

    return {
      isValid,
      message: !isValid ? (message || formatMessage(ERROR_MESSAGES.maxLength, { max: maxLength })) : undefined,
      code: !isValid ? 'MAX_LENGTH' : undefined
    }
  },

  /**
   * 最小值验证
   * @param {number} value - 待验证的值
   * @param {number} min - 最小值
   * @param {string} [message] - 自定义错误消息
   * @returns {ValidationResult} 验证结果
   */
  min: (value, min, message) => {
    if (value === null || value === undefined || value === '') {
      return { isValid: true }
    }

    const numValue = Number(value)
    const isValid = !isNaN(numValue) && numValue >= min

    return {
      isValid,
      message: !isValid ? (message || formatMessage(ERROR_MESSAGES.min, { min })) : undefined,
      code: !isValid ? 'MIN_VALUE' : undefined
    }
  },

  /**
   * 最大值验证
   * @param {number} value - 待验证的值
   * @param {number} max - 最大值
   * @param {string} [message] - 自定义错误消息
   * @returns {ValidationResult} 验证结果
   */
  max: (value, max, message) => {
    if (value === null || value === undefined || value === '') {
      return { isValid: true }
    }

    const numValue = Number(value)
    const isValid = !isNaN(numValue) && numValue <= max

    return {
      isValid,
      message: !isValid ? (message || formatMessage(ERROR_MESSAGES.max, { max })) : undefined,
      code: !isValid ? 'MAX_VALUE' : undefined
    }
  },

  /**
   * 正则表达式验证
   * @param {string} value - 待验证的值
   * @param {RegExp|string} pattern - 正则表达式
   * @param {string} [message] - 自定义错误消息
   * @returns {ValidationResult} 验证结果
   */
  pattern: (value, pattern, message) => {
    if (value === null || value === undefined || value === '') {
      return { isValid: true }
    }

    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
    const isValid = regex.test(String(value))

    return {
      isValid,
      message: !isValid ? (message || ERROR_MESSAGES.pattern) : undefined,
      code: !isValid ? 'PATTERN_MISMATCH' : undefined
    }
  },

  /**
   * 邮箱验证
   * @param {string} value - 待验证的值
   * @param {string} [message] - 自定义错误消息
   * @returns {ValidationResult} 验证结果
   */
  email: (value, message) => {
    return validators.pattern(value, REGEX_PATTERNS.email, message || ERROR_MESSAGES.email)
  },

  /**
   * 手机号验证
   * @param {string} value - 待验证的值
   * @param {string} [message] - 自定义错误消息
   * @returns {ValidationResult} 验证结果
   */
  phone: (value, message) => {
    return validators.pattern(value, REGEX_PATTERNS.phone, message || ERROR_MESSAGES.phone)
  },

  /**
   * 身份证号验证
   * @param {string} value - 待验证的值
   * @param {string} [message] - 自定义错误消息
   * @returns {ValidationResult} 验证结果
   */
  idCard: (value, message) => {
    return validators.pattern(value, REGEX_PATTERNS.idCard, message || ERROR_MESSAGES.idCard)
  },

  /**
   * 密码验证
   * @param {string} value - 待验证的值
   * @param {boolean} [strong=false] - 是否使用强密码规则
   * @param {string} [message] - 自定义错误消息
   * @returns {ValidationResult} 验证结果
   */
  password: (value, strong = false, message) => {
    const pattern = strong ? REGEX_PATTERNS.strongPassword : REGEX_PATTERNS.password
    const defaultMessage = strong ? ERROR_MESSAGES.strongPassword : ERROR_MESSAGES.password
    return validators.pattern(value, pattern, message || defaultMessage)
  },

  /**
   * URL验证
   * @param {string} value - 待验证的值
   * @param {string} [message] - 自定义错误消息
   * @returns {ValidationResult} 验证结果
   */
  url: (value, message) => {
    return validators.pattern(value, REGEX_PATTERNS.url, message || ERROR_MESSAGES.url)
  },

  /**
   * 自定义验证
   * @param {any} value - 待验证的值
   * @param {Function} validator - 验证函数
   * @param {string} [message] - 自定义错误消息
   * @returns {ValidationResult} 验证结果
   */
  custom: (value, validator, message) => {
    try {
      const result = validator(value)

      if (typeof result === 'boolean') {
        return {
          isValid: result,
          message: !result ? message : undefined,
          code: !result ? 'CUSTOM_VALIDATION_FAILED' : undefined
        }
      }

      if (typeof result === 'object' && result !== null) {
        return {
          isValid: Boolean(result.isValid),
          message: result.message || (!result.isValid ? message : undefined),
          code: result.code || (!result.isValid ? 'CUSTOM_VALIDATION_FAILED' : undefined)
        }
      }

      return { isValid: true }
    } catch (error) {
      console.error('Custom validator error:', error)
      return {
        isValid: false,
        message: message || '验证过程中发生错误',
        code: 'VALIDATION_ERROR'
      }
    }
  }
}

/**
 * 验证单个字段
 * @param {any} value - 待验证的值
 * @param {ValidationRule} rule - 验证规则
 * @returns {ValidationResult} 验证结果
 */
export const validateField = (value, rule) => {
  if (!rule || typeof rule !== 'object') {
    return { isValid: true }
  }

  // 必填验证
  if (rule.required) {
    const requiredResult = validators.required(value, rule.message)
    if (!requiredResult.isValid) {
      return requiredResult
    }
  }

  // 如果值为空且不是必填，则跳过其他验证
  if (value === null || value === undefined || value === '') {
    return { isValid: true }
  }

  // 长度验证
  if (rule.minLength !== undefined) {
    const result = validators.minLength(value, rule.minLength, rule.message)
    if (!result.isValid) return result
  }

  if (rule.maxLength !== undefined) {
    const result = validators.maxLength(value, rule.maxLength, rule.message)
    if (!result.isValid) return result
  }

  // 数值验证
  if (rule.min !== undefined) {
    const result = validators.min(value, rule.min, rule.message)
    if (!result.isValid) return result
  }

  if (rule.max !== undefined) {
    const result = validators.max(value, rule.max, rule.message)
    if (!result.isValid) return result
  }

  // 正则验证
  if (rule.pattern) {
    const result = validators.pattern(value, rule.pattern, rule.message)
    if (!result.isValid) return result
  }

  // 自定义验证
  if (rule.custom && typeof rule.custom === 'function') {
    const result = validators.custom(value, rule.custom, rule.message)
    if (!result.isValid) return result
  }

  return { isValid: true }
}

/**
 * 验证表单数据
 * @param {Object} data - 表单数据
 * @param {Object<string, ValidationRule>} rules - 验证规则
 * @param {Object} [options={}] - 验证选项
 * @returns {Object} 验证结果
 */
export const validateForm = (data, rules, options = {}) => {
  const {
    stopOnFirstError = false,
    onValidate,
    onError
  } = options

  const errors = {}
  let isValid = true
  const validatedFields = []

  try {
    for (const [fieldName, rule] of Object.entries(rules)) {
      const fieldValue = data[fieldName]
      const result = validateField(fieldValue, rule)

      validatedFields.push({
        field: fieldName,
        value: fieldValue,
        result
      })

      if (!result.isValid) {
        errors[fieldName] = result
        isValid = false

        // 触发错误回调
        if (onError && typeof onError === 'function') {
          try {
            onError(fieldName, result, fieldValue)
          } catch (callbackError) {
            console.error('Validation onError callback failed:', callbackError)
          }
        }

        // 如果设置了在第一个错误时停止，则跳出循环
        if (stopOnFirstError) {
          break
        }
      }
    }

    const validationResult = {
      isValid,
      errors,
      validatedFields,
      errorCount: Object.keys(errors).length
    }

    // 触发验证完成回调
    if (onValidate && typeof onValidate === 'function') {
      try {
        onValidate(validationResult)
      } catch (callbackError) {
        console.error('Validation onValidate callback failed:', callbackError)
      }
    }

    return validationResult

  } catch (error) {
    console.error('Form validation error:', error)
    return {
      isValid: false,
      errors: { _global: { isValid: false, message: '验证过程中发生错误', code: 'VALIDATION_ERROR' } },
      validatedFields,
      errorCount: 1
    }
  }
}

/**
 * 创建表单验证器
 * @param {Object<string, ValidationRule>} rules - 验证规则
 * @param {Object} [defaultOptions={}] - 默认选项
 * @returns {Function} 验证器函数
 */
export const createValidator = (rules, defaultOptions = {}) => {
  return (data, options = {}) => {
    const mergedOptions = { ...defaultOptions, ...options }
    return validateForm(data, rules, mergedOptions)
  }
}

/**
 * 异步验证器
 * @param {any} value - 待验证的值
 * @param {Function} asyncValidator - 异步验证函数
 * @param {number} [timeout=5000] - 超时时间
 * @returns {Promise<ValidationResult>} 验证结果
 */
export const validateAsync = (value, asyncValidator, timeout = 5000) => {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      resolve({
        isValid: false,
        message: '验证超时',
        code: 'VALIDATION_TIMEOUT'
      })
    }, timeout)

    try {
      const result = asyncValidator(value)

      if (result && typeof result.then === 'function') {
        // 处理Promise
        result
          .then((asyncResult) => {
            clearTimeout(timeoutId)

            if (typeof asyncResult === 'boolean') {
              resolve({ isValid: asyncResult })
            } else if (typeof asyncResult === 'object' && asyncResult !== null) {
              resolve({
                isValid: Boolean(asyncResult.isValid),
                message: asyncResult.message,
                code: asyncResult.code
              })
            } else {
              resolve({ isValid: true })
            }
          })
          .catch((error) => {
            clearTimeout(timeoutId)
            console.error('Async validation error:', error)
            resolve({
              isValid: false,
              message: '异步验证失败',
              code: 'ASYNC_VALIDATION_ERROR'
            })
          })
      } else {
        // 处理同步结果
        clearTimeout(timeoutId)

        if (typeof result === 'boolean') {
          resolve({ isValid: result })
        } else if (typeof result === 'object' && result !== null) {
          resolve({
            isValid: Boolean(result.isValid),
            message: result.message,
            code: result.code
          })
        } else {
          resolve({ isValid: true })
        }
      }
    } catch (error) {
      clearTimeout(timeoutId)
      console.error('Async validation error:', error)
      resolve({
        isValid: false,
        message: '验证过程中发生错误',
        code: 'VALIDATION_ERROR'
      })
    }
  })
}

/**
 * 常用验证规则预设
 */
export const commonRules = {
  // 用户名规则
  username: {
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: REGEX_PATTERNS.username,
    message: '用户名只能包含字母、数字、下划线，长度3-20位'
  },

  // 邮箱规则
  email: {
    required: true,
    pattern: REGEX_PATTERNS.email,
    message: '请输入有效的邮箱地址'
  },

  // 手机号规则
  phone: {
    required: true,
    pattern: REGEX_PATTERNS.phone,
    message: '请输入有效的手机号码'
  },

  // 密码规则
  password: {
    required: true,
    minLength: 8,
    pattern: REGEX_PATTERNS.password,
    message: '密码至少8位，包含字母和数字'
  },

  // 强密码规则
  strongPassword: {
    required: true,
    minLength: 8,
    pattern: REGEX_PATTERNS.strongPassword,
    message: '密码至少8位，包含大小写字母、数字和特殊字符'
  },

  // 确认密码规则（需要配合自定义验证使用）
  confirmPassword: (originalPassword) => ({
    required: true,
    custom: (value) => value === originalPassword,
    message: '两次输入的密码不一致'
  }),

  // 身份证号规则
  idCard: {
    required: true,
    pattern: REGEX_PATTERNS.idCard,
    message: '请输入有效的身份证号码'
  },

  // 年龄规则
  age: {
    required: true,
    min: 1,
    max: 150,
    pattern: REGEX_PATTERNS.number,
    message: '请输入有效的年龄（1-150）'
  }
}

export default {
  REGEX_PATTERNS,
  ERROR_MESSAGES,
  validators,
  validateField,
  validateForm,
  createValidator,
  validateAsync,
  commonRules
}