/**
 * 项目常量定义
 * 统一管理项目中使用的常量，便于维护和修改
 */

// ==================== 应用配置 ====================

/**
 * 应用基础配置
 */
export const APP_CONFIG = {
  NAME: 'Emotion',
  VERSION: '1.0.0',
  DESCRIPTION: '情感分析应用',
  AUTHOR: 'Emotion Team',
  HOMEPAGE: 'https://emotion.app',
  SUPPORT_EMAIL: 'support@emotion.app'
}

/**
 * 环境配置
 */
export const ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
  STAGING: 'staging'
}

/**
 * API配置
 */
export const API_CONFIG = {
  BASE_URL: process.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  TIMEOUT: 10000,
  RETRY_TIMES: 3,
  RETRY_DELAY: 1000
}

// ==================== HTTP状态码 ====================

/**
 * HTTP状态码
 */
export const HTTP_STATUS = {
  // 成功
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  
  // 重定向
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,
  
  // 客户端错误
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  
  // 服务器错误
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
}

/**
 * HTTP方法
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS'
}

// ==================== 存储键名 ====================

/**
 * LocalStorage键名
 */
export const STORAGE_KEYS = {
  // 用户相关
  USER_TOKEN: 'user_token',
  USER_INFO: 'user_info',
  USER_PREFERENCES: 'user_preferences',
  
  // 应用设置
  THEME: 'app_theme',
  LANGUAGE: 'app_language',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
  
  // 缓存
  API_CACHE: 'api_cache',
  FORM_DRAFT: 'form_draft',
  SEARCH_HISTORY: 'search_history',
  
  // 临时数据
  TEMP_DATA: 'temp_data',
  UPLOAD_PROGRESS: 'upload_progress'
}

/**
 * SessionStorage键名
 */
export const SESSION_KEYS = {
  CURRENT_TAB: 'current_tab',
  SCROLL_POSITION: 'scroll_position',
  FORM_STATE: 'form_state',
  NAVIGATION_HISTORY: 'navigation_history'
}

// ==================== 事件名称 ====================

/**
 * 全局事件名称
 */
export const EVENTS = {
  // 用户事件
  USER_LOGIN: 'user:login',
  USER_LOGOUT: 'user:logout',
  USER_UPDATE: 'user:update',
  
  // 应用事件
  APP_INIT: 'app:init',
  APP_ERROR: 'app:error',
  APP_LOADING: 'app:loading',
  
  // 主题事件
  THEME_CHANGE: 'theme:change',
  LANGUAGE_CHANGE: 'language:change',
  
  // 网络事件
  NETWORK_ONLINE: 'network:online',
  NETWORK_OFFLINE: 'network:offline',
  
  // 数据事件
  DATA_REFRESH: 'data:refresh',
  DATA_UPDATE: 'data:update',
  DATA_DELETE: 'data:delete',
  
  // 通知事件
  NOTIFICATION_SHOW: 'notification:show',
  NOTIFICATION_HIDE: 'notification:hide',
  
  // 模态框事件
  MODAL_OPEN: 'modal:open',
  MODAL_CLOSE: 'modal:close',
  
  // 路由事件
  ROUTE_CHANGE: 'route:change',
  ROUTE_ERROR: 'route:error'
}

// ==================== 路由路径 ====================

/**
 * 路由路径常量
 */
export const ROUTES = {
  // 公共路由
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  // 用户路由
  PROFILE: '/profile',
  SETTINGS: '/settings',
  DASHBOARD: '/dashboard',
  
  // 功能路由
  ANALYSIS: '/analysis',
  HISTORY: '/history',
  REPORTS: '/reports',
  
  // 管理路由
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_SETTINGS: '/admin/settings',
  
  // 错误页面
  NOT_FOUND: '/404',
  SERVER_ERROR: '/500',
  UNAUTHORIZED: '/401',
  FORBIDDEN: '/403'
}

// ==================== 主题配置 ====================

/**
 * 主题类型
 */
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
}

/**
 * 颜色配置
 */
export const COLORS = {
  // 主色调
  PRIMARY: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a'
  },
  
  // 状态颜色
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#3b82f6',
  
  // 中性色
  GRAY: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  }
}

// ==================== 语言配置 ====================

/**
 * 支持的语言
 */
export const LANGUAGES = {
  ZH_CN: 'zh-CN',
  ZH_TW: 'zh-TW',
  EN_US: 'en-US',
  JA_JP: 'ja-JP',
  KO_KR: 'ko-KR'
}

/**
 * 语言显示名称
 */
export const LANGUAGE_NAMES = {
  [LANGUAGES.ZH_CN]: '简体中文',
  [LANGUAGES.ZH_TW]: '繁體中文',
  [LANGUAGES.EN_US]: 'English',
  [LANGUAGES.JA_JP]: '日本語',
  [LANGUAGES.KO_KR]: '한국어'
}

// ==================== 文件配置 ====================

/**
 * 文件类型
 */
export const FILE_TYPES = {
  // 图片
  IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'],
  
  // 文档
  DOCUMENT: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf'],
  
  // 音频
  AUDIO: ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'],
  
  // 视频
  VIDEO: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'],
  
  // 压缩文件
  ARCHIVE: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'],
  
  // 代码文件
  CODE: ['js', 'ts', 'jsx', 'tsx', 'vue', 'html', 'css', 'scss', 'less', 'json', 'xml', 'yaml', 'yml']
}

/**
 * 文件大小限制（字节）
 */
export const FILE_SIZE_LIMITS = {
  AVATAR: 2 * 1024 * 1024, // 2MB
  IMAGE: 10 * 1024 * 1024, // 10MB
  DOCUMENT: 50 * 1024 * 1024, // 50MB
  VIDEO: 100 * 1024 * 1024, // 100MB
  DEFAULT: 5 * 1024 * 1024 // 5MB
}

// ==================== 分页配置 ====================

/**
 * 分页配置
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 1000
}

// ==================== 表单配置 ====================

/**
 * 表单验证规则
 */
export const VALIDATION_RULES = {
  // 用户名
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_-]+$/
  },
  
  // 密码
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
  },
  
  // 邮箱
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  
  // 手机号
  PHONE: {
    PATTERN: /^1[3-9]\d{9}$/
  },
  
  // 身份证
  ID_CARD: {
    PATTERN: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/
  }
}

// ==================== 时间配置 ====================

/**
 * 时间格式
 */
export const DATE_FORMATS = {
  DATE: 'YYYY-MM-DD',
  TIME: 'HH:mm:ss',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  DATETIME_SHORT: 'MM-DD HH:mm',
  MONTH: 'YYYY-MM',
  YEAR: 'YYYY',
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
}

/**
 * 时间间隔（毫秒）
 */
export const TIME_INTERVALS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000
}

// ==================== 动画配置 ====================

/**
 * 动画持续时间（毫秒）
 */
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 1000
}

/**
 * 动画缓动函数
 */
export const ANIMATION_EASING = {
  LINEAR: 'linear',
  EASE: 'ease',
  EASE_IN: 'ease-in',
  EASE_OUT: 'ease-out',
  EASE_IN_OUT: 'ease-in-out',
  CUBIC_BEZIER: 'cubic-bezier(0.4, 0, 0.2, 1)'
}

// ==================== 设备配置 ====================

/**
 * 断点配置（像素）
 */
export const BREAKPOINTS = {
  XS: 480,
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536
}

/**
 * 设备类型
 */
export const DEVICE_TYPES = {
  MOBILE: 'mobile',
  TABLET: 'tablet',
  DESKTOP: 'desktop'
}

// ==================== 错误代码 ====================

/**
 * 业务错误代码
 */
export const ERROR_CODES = {
  // 通用错误
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // 认证错误
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  
  // 权限错误
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  ACCESS_FORBIDDEN: 'ACCESS_FORBIDDEN',
  
  // 数据错误
  DATA_NOT_FOUND: 'DATA_NOT_FOUND',
  DATA_INVALID: 'DATA_INVALID',
  DATA_CONFLICT: 'DATA_CONFLICT',
  
  // 文件错误
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_TYPE_INVALID: 'FILE_TYPE_INVALID',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
  
  // 表单错误
  FORM_VALIDATION_FAILED: 'FORM_VALIDATION_FAILED',
  FORM_SUBMIT_FAILED: 'FORM_SUBMIT_FAILED'
}

// ==================== 通知类型 ====================

/**
 * 通知类型
 */
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
}

/**
 * 通知位置
 */
export const NOTIFICATION_POSITIONS = {
  TOP_LEFT: 'top-left',
  TOP_CENTER: 'top-center',
  TOP_RIGHT: 'top-right',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_CENTER: 'bottom-center',
  BOTTOM_RIGHT: 'bottom-right'
}

// ==================== 加载状态 ====================

/**
 * 加载状态
 */
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
}

// ==================== 排序配置 ====================

/**
 * 排序方向
 */
export const SORT_DIRECTIONS = {
  ASC: 'asc',
  DESC: 'desc'
}

/**
 * 排序字段
 */
export const SORT_FIELDS = {
  NAME: 'name',
  DATE: 'date',
  SIZE: 'size',
  TYPE: 'type',
  STATUS: 'status',
  PRIORITY: 'priority'
}

// ==================== 导出默认配置 ====================

/**
 * 默认配置对象
 */
export const DEFAULT_CONFIG = {
  theme: THEMES.LIGHT,
  language: LANGUAGES.ZH_CN,
  pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
  animationDuration: ANIMATION_DURATION.NORMAL,
  notificationPosition: NOTIFICATION_POSITIONS.TOP_RIGHT,
  sortDirection: SORT_DIRECTIONS.ASC
}

// ==================== 工具函数 ====================

/**
 * 获取环境变量
 * @param {string} key - 环境变量键名
 * @param {any} defaultValue - 默认值
 * @returns {any} 环境变量值
 */
export const getEnvVar = (key, defaultValue = null) => {
  return import.meta.env[key] || process.env[key] || defaultValue
}

/**
 * 检查是否为开发环境
 * @returns {boolean} 是否为开发环境
 */
export const isDevelopment = () => {
  return getEnvVar('NODE_ENV') === ENV.DEVELOPMENT || getEnvVar('MODE') === ENV.DEVELOPMENT
}

/**
 * 检查是否为生产环境
 * @returns {boolean} 是否为生产环境
 */
export const isProduction = () => {
  return getEnvVar('NODE_ENV') === ENV.PRODUCTION || getEnvVar('MODE') === ENV.PRODUCTION
}

/**
 * 检查是否为测试环境
 * @returns {boolean} 是否为测试环境
 */
export const isTest = () => {
  return getEnvVar('NODE_ENV') === ENV.TEST || getEnvVar('MODE') === ENV.TEST
}

/**
 * 获取API基础URL
 * @returns {string} API基础URL
 */
export const getApiBaseUrl = () => {
  return getEnvVar('VITE_API_BASE_URL', API_CONFIG.BASE_URL)
}

/**
 * 获取应用版本
 * @returns {string} 应用版本
 */
export const getAppVersion = () => {
  return getEnvVar('VITE_APP_VERSION', APP_CONFIG.VERSION)
}

// 冻结所有导出的对象，防止意外修改
Object.freeze(APP_CONFIG)
Object.freeze(ENV)
Object.freeze(API_CONFIG)
Object.freeze(HTTP_STATUS)
Object.freeze(HTTP_METHODS)
Object.freeze(STORAGE_KEYS)
Object.freeze(SESSION_KEYS)
Object.freeze(EVENTS)
Object.freeze(ROUTES)
Object.freeze(THEMES)
Object.freeze(COLORS)
Object.freeze(LANGUAGES)
Object.freeze(LANGUAGE_NAMES)
Object.freeze(FILE_TYPES)
Object.freeze(FILE_SIZE_LIMITS)
Object.freeze(PAGINATION)
Object.freeze(VALIDATION_RULES)
Object.freeze(DATE_FORMATS)
Object.freeze(TIME_INTERVALS)
Object.freeze(ANIMATION_DURATION)
Object.freeze(ANIMATION_EASING)
Object.freeze(BREAKPOINTS)
Object.freeze(DEVICE_TYPES)
Object.freeze(ERROR_CODES)
Object.freeze(NOTIFICATION_TYPES)
Object.freeze(NOTIFICATION_POSITIONS)
Object.freeze(LOADING_STATES)
Object.freeze(SORT_DIRECTIONS)
Object.freeze(SORT_FIELDS)
Object.freeze(DEFAULT_CONFIG)