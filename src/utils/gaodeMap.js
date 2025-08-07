/**
 * 高德地图API工具函数
 * 提供地理编码、逆地理编码、天气查询等功能
 */

// 高德地图API配置
const GAODE_API_KEY = import.meta.env.VITE_GAODE_API_KEY
const BASE_URL = 'https://restapi.amap.com'

// 缓存配置
const CACHE_CONFIG = {
  // 天气信息缓存30分钟
  WEATHER_CACHE_DURATION: 30 * 60 * 1000,
  // 城市编码缓存24小时
  CITY_CODE_CACHE_DURATION: 24 * 60 * 60 * 1000,
  // 城市搜索缓存1小时
  CITY_SEARCH_CACHE_DURATION: 60 * 60 * 1000,
  // 位置信息缓存2小时
  LOCATION_CACHE_DURATION: 2 * 60 * 60 * 1000
}

// 内存缓存
const memoryCache = new Map()

/**
 * 生成缓存键
 * @param {string} type - 缓存类型
 * @param {string} key - 缓存键
 * @returns {string} 完整的缓存键
 */
const getCacheKey = (type, key) => `gaode_${type}_${key}`

/**
 * 从缓存获取数据
 * @param {string} cacheKey - 缓存键
 * @param {number} duration - 缓存持续时间（毫秒）
 * @returns {any|null} 缓存的数据或null
 */
const getFromCache = (cacheKey, duration) => {
  // 先检查内存缓存
  const memoryData = memoryCache.get(cacheKey)
  if (memoryData && Date.now() - memoryData.timestamp < duration) {
    return memoryData.data
  }

  // 检查localStorage缓存
  try {
    const localData = localStorage.getItem(cacheKey)
    if (localData) {
      const parsed = JSON.parse(localData)
      if (Date.now() - parsed.timestamp < duration) {
        // 同步到内存缓存
        memoryCache.set(cacheKey, parsed)
        return parsed.data
      } else {
        // 过期数据，清除
        localStorage.removeItem(cacheKey)
      }
    }
  } catch (error) {
    console.warn('读取缓存失败:', error)
  }

  return null
}

/**
 * 设置缓存数据
 * @param {string} cacheKey - 缓存键
 * @param {any} data - 要缓存的数据
 */
const setCache = (cacheKey, data) => {
  const cacheData = {
    data,
    timestamp: Date.now()
  }

  // 设置内存缓存
  memoryCache.set(cacheKey, cacheData)

  // 设置localStorage缓存
  try {
    localStorage.setItem(cacheKey, JSON.stringify(cacheData))
  } catch (error) {
    console.warn('设置缓存失败:', error)
  }
}

/**
 * 清除过期缓存
 */
const clearExpiredCache = () => {
  // 清理内存缓存
  for (const [key, value] of memoryCache.entries()) {
    if (Date.now() - value.timestamp > CACHE_CONFIG.WEATHER_CACHE_DURATION) {
      memoryCache.delete(key)
    }
  }

  // 清理localStorage缓存
  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('gaode_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key))
          if (Date.now() - data.timestamp > CACHE_CONFIG.WEATHER_CACHE_DURATION) {
            localStorage.removeItem(key)
          }
        } catch {
           // 无效数据，直接删除
           localStorage.removeItem(key)
         }
      }
    })
  } catch (error) {
    console.warn('清理缓存失败:', error)
  }
}

// 定期清理过期缓存（每10分钟）
setInterval(clearExpiredCache, 10 * 60 * 1000)

/**
 * 安全的fetch请求
 * @param {string} url - 请求URL
 * @param {object} options - 请求选项
 * @returns {Promise<any>} 响应数据
 */
export const safeFetch = async (url, options = {}) => {
  try {
    // 创建AbortController来实现超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      signal: controller.signal,
      ...options
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status !== '1') {
      throw new Error(data.info || '请求失败');
    }
    
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('请求超时');
    }
    // API请求失败
    throw error;
  }
};

/**
 * 获取城市编码
 * @param {string} cityName - 城市名称
 * @returns {Promise<string>} 城市编码
 */
export const getCityCode = async (cityName) => {
  if (!GAODE_API_KEY) {
    throw new Error('未配置高德地图API密钥');
  }
  
  // 检查缓存
  const cacheKey = getCacheKey('citycode', cityName)
  const cachedData = getFromCache(cacheKey, CACHE_CONFIG.CITY_CODE_CACHE_DURATION)
  if (cachedData) {
    return cachedData
  }
  
  const url = `${BASE_URL}/v3/geocode/geo?key=${GAODE_API_KEY}&address=${encodeURIComponent(cityName)}`;
  
  const data = await safeFetch(url);
  
  if (data.geocodes && data.geocodes.length > 0) {
    const cityCode = data.geocodes[0].adcode
    // 缓存结果
    setCache(cacheKey, cityCode)
    return cityCode;
  }
  
  throw new Error('未找到城市信息');
};

/**
 * 根据坐标获取城市信息
 * @param {number} longitude - 经度
 * @param {number} latitude - 纬度
 * @returns {Promise<object>} 城市信息
 */
export const getCityByLocation = async (longitude, latitude) => {
  if (!GAODE_API_KEY) {
    throw new Error('未配置高德地图API密钥');
  }
  
  // 检查缓存（使用坐标作为缓存键）
  const cacheKey = getCacheKey('location', `${longitude},${latitude}`)
  const cachedData = getFromCache(cacheKey, CACHE_CONFIG.LOCATION_CACHE_DURATION)
  if (cachedData) {
    return cachedData
  }
  
  const url = `${BASE_URL}/v3/geocode/regeo?key=${GAODE_API_KEY}&location=${longitude},${latitude}`;
  
  const data = await safeFetch(url);
  
  if (data.regeocode && data.regeocode.addressComponent) {
    const addressComponent = data.regeocode.addressComponent;
    const locationInfo = {
      province: addressComponent.province,
      city: addressComponent.city || addressComponent.district,
      district: addressComponent.district,
      adcode: addressComponent.adcode,
      formatted_address: data.regeocode.formatted_address
    };
    
    // 缓存结果
    setCache(cacheKey, locationInfo)
    return locationInfo;
  }
  
  throw new Error('未找到位置信息');
};

/**
 * 获取天气信息
 * @param {string} cityCode - 城市编码
 * @returns {Promise<object>} 天气信息
 */
export const getWeatherInfo = async (cityCode) => {
  if (!GAODE_API_KEY) {
    throw new Error('未配置高德地图API密钥');
  }
  
  // 检查缓存
  const cacheKey = getCacheKey('weather', cityCode)
  const cachedData = getFromCache(cacheKey, CACHE_CONFIG.WEATHER_CACHE_DURATION)
  if (cachedData) {
    return cachedData
  }
  
  // 使用预报天气查询API获取完整天气信息（包含最高最低温度）
  const url = `${BASE_URL}/v3/weather/weatherInfo?city=${cityCode}&key=${GAODE_API_KEY}&extensions=all`;
  
  const data = await safeFetch(url);
  
  if (data.status === '1' && data.forecasts && data.forecasts.length > 0) {
    const forecast = data.forecasts[0];
    const todayCast = forecast.casts && forecast.casts[0];
    
    if (todayCast) {
      const weatherInfo = {
        city: forecast.city,
        province: forecast.province,
        reporttime: forecast.reporttime,
        temperature: Math.round((parseInt(todayCast.daytemp) + parseInt(todayCast.nighttemp)) / 2), // 计算平均温度作为当前温度
        weather: todayCast.dayweather,
        wind: `${todayCast.daywind}风 ${todayCast.daypower}级`,
        windPower: todayCast.daypower,
        minTemp: parseInt(todayCast.nighttemp), // 最低温度
        maxTemp: parseInt(todayCast.daytemp), // 最高温度
        humidity: '--', // 预报天气API不提供湿度
        date: todayCast.date,
        updateTime: forecast.reporttime,
        adcode: forecast.adcode
      };
      
      // 缓存结果
      setCache(cacheKey, weatherInfo)
      return weatherInfo;
    }
  }
  
  throw new Error(`API返回错误: ${data.info || '未知错误'}`);
};

/**
 * 根据当前位置获取天气信息
 * @returns {Promise<object>} 天气信息
 */
export const getCurrentWeather = async () => {
  // 直接使用北京作为默认城市，避免定位问题
  try {
    const beijingCode = '110101'; // 北京市东城区的城市代码（更精确）
    
    const weatherInfo = await getWeatherInfo(beijingCode);
    
    return {
      ...weatherInfo,
      location: {
        city: '北京市',
        province: '北京市',
        isDefault: true
      }
    };
  } catch (error) {
    throw new Error(`获取天气信息失败: ${error.message}`);
  }
};

/**
 * 搜索城市
 * @param {string} keyword - 搜索关键词
 * @returns {Promise<Array>} 城市列表
 */
export const searchCities = async (keyword) => {
  if (!GAODE_API_KEY) {
    throw new Error('未配置高德地图API密钥');
  }
  
  if (!keyword || keyword.trim().length === 0) {
    return [];
  }
  
  const trimmedKeyword = keyword.trim()
  
  // 检查缓存
  const cacheKey = getCacheKey('search', trimmedKeyword)
  const cachedData = getFromCache(cacheKey, CACHE_CONFIG.CITY_SEARCH_CACHE_DURATION)
  if (cachedData) {
    return cachedData
  }
  
  const url = `${BASE_URL}/v3/geocode/geo?key=${GAODE_API_KEY}&address=${encodeURIComponent(trimmedKeyword)}&batch=true`;
  
  try {
    const data = await safeFetch(url);
    
    if (data.geocodes && data.geocodes.length > 0) {
      const searchResults = data.geocodes.map(item => ({
        name: item.formatted_address,
        city: item.city,
        province: item.province,
        district: item.district,
        code: item.adcode, // 使用code字段保持一致性
        adcode: item.adcode,
        location: item.location
      })).slice(0, 10); // 限制返回10个结果
      
      // 缓存结果
      setCache(cacheKey, searchResults)
      return searchResults;
    }
    
    // 缓存空结果
    setCache(cacheKey, [])
    return [];
  } catch {
    return [];
  }
};

/**
 * 格式化天气数据
 * @param {object} weatherData - 原始天气数据
 * @returns {object} 格式化后的天气数据
 */
export const formatWeatherData = (weatherData) => {
  if (!weatherData) {
    return null;
  }
  
  return {
    city: weatherData.city || '未知',
    province: weatherData.province || '',
    temperature: weatherData.temperature || '--',
    weather: weatherData.weather || '未知',
    wind: weatherData.wind || '--',
    humidity: weatherData.humidity || '--',
    date: weatherData.date || new Date().toISOString().split('T')[0],
    reporttime: weatherData.reporttime || '',
    forecasts: weatherData.forecasts || [],
    location: weatherData.location || null
  };
};

export default {
  getCityCode,
  getCityByLocation,
  getWeatherInfo,
  getCurrentWeather,
  searchCities,
  formatWeatherData,
  safeFetch
};