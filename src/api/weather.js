/**
 * 天气API相关函数
 * 使用高德地图工具函数
 */

import {
  getCityCode,
  getCityByLocation,
  getWeatherInfo,
  getCurrentWeather,
  searchCities as gaodeSearchCities,
  safeFetch
} from '../utils/gaodeMap.js';

// 重新导出高德地图工具函数，保持API兼容性
export {
  getCityCode,
  getCityByLocation,
  getWeatherInfo,
  getCurrentWeather,
  safeFetch
};

// 城市搜索功能（使用高德地图API）
export const searchCities = async (keyword) => {
  try {
    return await gaodeSearchCities(keyword);
  } catch (error) {
    console.error('搜索城市失败:', error);
    // 如果API调用失败，返回空数组
    return [];
  }
};

// 格式化天气数据
export const formatWeatherData = (data) => {
  return data;
};

export default {
  getWeatherInfo,
  getCurrentWeather,
  getCityCode,
  searchCities
}