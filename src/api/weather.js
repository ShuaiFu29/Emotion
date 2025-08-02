/**
 * 天气API服务配置
 * 推荐使用国内天气API服务，数据更准确，响应更快
 */

// 推荐的国内天气API服务商
const WEATHER_APIS = {
  // 和风天气 - 免费1000次/天，数据准确，推荐使用
  QWEATHER: {
    name: '和风天气',
    baseUrl: 'https://devapi.qweather.com/v7',
    freeQuota: '1000次/天',
    website: 'https://www.qweather.com',
    description: '数据准确，接口稳定，文档完善'
  },
  
  // 心知天气 - 免费2000次/天
  SENIVERSE: {
    name: '心知天气',
    baseUrl: 'https://api.seniverse.com/v3',
    freeQuota: '2000次/天',
    website: 'https://www.seniverse.com',
    description: '免费额度较高，支持多种天气数据'
  },
  
  // 高德地图天气API - 免费5000次/天
  AMAP: {
    name: '高德地图天气API',
    baseUrl: 'https://restapi.amap.com/v3',
    freeQuota: '5000次/天',
    website: 'https://lbs.amap.com',
    description: '高德地图提供，定位准确'
  },
  
  // 百度地图天气API - 免费配额充足
  BAIDU: {
    name: '百度地图天气API',
    baseUrl: 'https://api.map.baidu.com',
    freeQuota: '免费配额充足',
    website: 'https://lbsyun.baidu.com',
    description: '百度地图提供，覆盖范围广'
  },
  
  // 腾讯位置服务天气API - 免费10万次/月
  TENCENT: {
    name: '腾讯位置服务天气API',
    baseUrl: 'https://apis.map.qq.com/ws',
    freeQuota: '10万次/月',
    website: 'https://lbs.qq.com',
    description: '腾讯地图提供，免费额度最高'
  }
}

// 当前使用的API配置（默认使用和风天气）
const CURRENT_API = WEATHER_APIS.QWEATHER

// API密钥配置（需要用户申请后填入）
const API_CONFIG = {
  // 和风天气API密钥
  qweatherKey: import.meta.env.VITE_QWEATHER_KEY || '',
  
  // 心知天气API密钥
  seniverseKey: import.meta.env.VITE_SENIVERSE_KEY || '',
  
  // 高德地图API密钥
  amapKey: import.meta.env.VITE_AMAP_KEY || '',
  
  // 百度地图API密钥
  baiduKey: import.meta.env.VITE_BAIDU_KEY || '',
  
  // 腾讯位置服务API密钥
  tencentKey: import.meta.env.VITE_TENCENT_KEY || ''
}

/**
 * 获取当前位置的天气信息（和风天气API示例）
 * @param {string} location 位置信息，可以是城市名或经纬度
 * @returns {Promise<Object>} 天气数据
 */
export const getCurrentWeather = async (location = '北京') => {
  try {
    // 如果没有配置API密钥，返回模拟数据
    if (!API_CONFIG.qweatherKey) {
      console.warn('未配置天气API密钥，返回模拟数据')
      return getMockWeatherData()
    }
    
    // 和风天气API调用示例
    const response = await fetch(
      `${CURRENT_API.baseUrl}/weather/now?location=${encodeURIComponent(location)}&key=${API_CONFIG.qweatherKey}`
    )
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.code !== '200') {
      throw new Error(`API返回错误: ${data.code}`)
    }
    
    // 格式化返回数据
    return {
      location: location,
      temperature: data.now.temp,
      weather: data.now.text,
      humidity: data.now.humidity,
      windSpeed: data.now.windSpeed,
      updateTime: data.updateTime,
      icon: data.now.icon
    }
  } catch (error) {
    console.error('获取天气数据失败:', error)
    // 出错时返回模拟数据
    return getMockWeatherData()
  }
}

/**
 * 获取模拟天气数据
 * @returns {Object} 模拟的天气数据
 */
const getMockWeatherData = () => {
  const weatherTypes = ['晴', '多云', '阴', '小雨', '中雨']
  const randomWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)]
  
  return {
    location: '北京',
    temperature: Math.floor(Math.random() * 20) + 10, // 10-30度
    weather: randomWeather,
    humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
    windSpeed: Math.floor(Math.random() * 10) + 1, // 1-10 km/h
    updateTime: new Date().toISOString(),
    icon: '100' // 晴天图标代码
  }
}

/**
 * 获取推荐的天气API服务信息
 * @returns {Object} API服务商信息
 */
export const getRecommendedAPIs = () => {
  return WEATHER_APIS
}

/**
 * 获取API申请指南
 * @returns {Array} 申请步骤
 */
export const getAPIGuide = () => {
  return [
    {
      service: '和风天气（推荐）',
      steps: [
        '1. 访问 https://www.qweather.com',
        '2. 注册账号并登录',
        '3. 进入控制台创建应用',
        '4. 获取API Key',
        '5. 在项目根目录创建 .env 文件',
        '6. 添加 VITE_QWEATHER_KEY=你的API密钥'
      ],
      features: ['免费1000次/天', '数据准确', '接口稳定', '文档完善']
    },
    {
      service: '心知天气',
      steps: [
        '1. 访问 https://www.seniverse.com',
        '2. 注册账号并登录',
        '3. 创建应用获取密钥',
        '4. 添加 VITE_SENIVERSE_KEY=你的API密钥'
      ],
      features: ['免费2000次/天', '支持多种数据', '响应快速']
    },
    {
      service: '高德地图天气API',
      steps: [
        '1. 访问 https://lbs.amap.com',
        '2. 注册开发者账号',
        '3. 创建应用获取Key',
        '4. 添加 VITE_AMAP_KEY=你的API密钥'
      ],
      features: ['免费5000次/天', '定位准确', '高德地图支持']
    }
  ]
}

export default {
  getCurrentWeather,
  getRecommendedAPIs,
  getAPIGuide,
  WEATHER_APIS
}