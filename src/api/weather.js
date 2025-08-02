/**
 * 天气API服务 - 使用高德地图API
 * 使用fetch方式调用API
 */

const AMAP_KEY = import.meta.env.VITE_AMAP_KEY
const BASE_URL = '/api/amap/v3'

/**
 * 安全的fetch请求函数
 * @param {string} url 请求URL
 * @param {Object} options 请求选项
 * @returns {Promise} Promise对象
 */
const safeFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      ...options
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('API请求失败:', error)
    throw error
  }
}

/**
 * 获取城市编码
 * @param {string} city 城市名称
 * @returns {Promise<string>} 城市编码
 */
export const getCityCode = async (city) => {
  try {
    if (!AMAP_KEY) {
      throw new Error('未配置高德地图API密钥')
    }

    const url = `${BASE_URL}/config/district?keywords=${encodeURIComponent(city)}&subdistrict=0&key=${AMAP_KEY}&output=json`
    const data = await safeFetch(url)
    
    if (data.status === '1' && data.districts && data.districts.length > 0) {
      return data.districts[0].adcode
    } else {
      throw new Error(data.info || '未找到城市信息')
    }
  } catch (error) {
    console.error('获取城市编码失败:', error)
    throw error
  }
}

/**
 * 获取天气信息
 * @param {string} city 城市名称
 * @returns {Promise<Object>} 天气数据
 */
export const getWeatherInfo = async (city = '北京') => {
  try {
    if (!AMAP_KEY) {
      throw new Error('未配置高德地图API密钥')
    }

    // 先获取城市编码
    const cityCode = await getCityCode(city)
    
    // 获取天气信息
    const url = `${BASE_URL}/weather/weatherInfo?city=${cityCode}&key=${AMAP_KEY}&extensions=all&output=json`
    const data = await safeFetch(url)
    
    if (data.status === '1' && data.forecasts && data.forecasts.length > 0) {
      const forecast = data.forecasts[0]
      const today = forecast.casts[0]
      
      return {
        success: true,
        city: forecast.city,
        province: forecast.province,
        reportTime: forecast.reporttime,
        current: {
          date: today.date,
          week: today.week,
          dayWeather: today.dayweather,
          nightWeather: today.nightweather,
          dayTemp: today.daytemp,
          nightTemp: today.nighttemp,
          dayWind: today.daywind,
          nightWind: today.nightwind,
          dayPower: today.daypower,
          nightPower: today.nightpower
        },
        forecast: forecast.casts.slice(0, 4)
      }
    } else {
      throw new Error(data.info || '获取天气信息失败')
    }
  } catch (error) {
    console.error('获取天气信息失败:', error)
    
    // 返回模拟数据作为降级方案
    return {
      success: false,
      error: error.message,
      city: city,
      province: '模拟数据',
      reportTime: new Date().toISOString(),
      current: {
        date: new Date().toISOString().split('T')[0],
        week: ['日', '一', '二', '三', '四', '五', '六'][new Date().getDay()],
        dayWeather: '晴',
        nightWeather: '晴',
        dayTemp: '25',
        nightTemp: '15',
        dayWind: '东北',
        nightWind: '东北',
        dayPower: '3',
        nightPower: '3'
      },
      forecast: []
    }
  }
}

/**
 * 获取实时天气（简化版本）
 * @param {string} city 城市名称
 * @returns {Promise<Object>} 简化的天气数据
 */
export const getCurrentWeather = async (city = '北京') => {
  try {
    const weatherData = await getWeatherInfo(city)
    
    if (weatherData.success) {
      return {
        success: true,
        city: weatherData.city,
        province: weatherData.province,
        temperature: weatherData.current.dayTemp,
        weather: weatherData.current.dayWeather,
        minTemp: weatherData.current.nightTemp,
        maxTemp: weatherData.current.dayTemp,
        wind: weatherData.current.dayWind,
        windPower: weatherData.current.dayPower,
        updateTime: weatherData.reportTime
      }
    } else {
      // 使用模拟数据
      return {
        success: true,
        city: city,
        province: '模拟数据',
        temperature: '22',
        weather: '晴',
        minTemp: '15',
        maxTemp: '28',
        wind: '东北风',
        windPower: '3',
        updateTime: new Date().toISOString(),
        isSimulated: true
      }
    }
  } catch (error) {
    console.error('获取当前天气失败:', error)
    
    // 最终降级方案
    return {
      success: true,
      city: city,
      province: '模拟数据',
      temperature: '22',
      weather: '晴',
      minTemp: '15',
      maxTemp: '28',
      wind: '东北风',
      windPower: '3',
      updateTime: new Date().toISOString(),
      isSimulated: true,
      error: error.message
    }
  }
}

export default {
  getWeatherInfo,
  getCurrentWeather,
  getCityCode
}