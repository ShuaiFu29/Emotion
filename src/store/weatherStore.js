import { create } from 'zustand'
import { getCurrentWeather, getCityCode, getWeatherInfo, searchCities } from '../api/weather'

const useWeatherStore = create((set, get) => ({
  // 状态
  currentWeather: null,
  currentLocation: null,
  searchResults: [],
  weatherCache: new Map(), // 天气数据缓存
  locationCache: new Map(), // 位置数据缓存
  loading: false,
  searchLoading: false,
  error: null,
  lastUpdateTime: null,

  // 获取当前位置天气
  getCurrentWeather: async () => {
    set({ loading: true, error: null })
    try {
      const weatherData = await getCurrentWeather()
      const updateTime = new Date().toISOString()
      
      set({
        currentWeather: weatherData,
        loading: false,
        lastUpdateTime: updateTime,
        error: null
      })
      
      // 缓存当前天气数据
      if (weatherData && weatherData.location) {
        get().cacheWeatherData(weatherData.location, weatherData)
      }
      
      return { success: true, data: weatherData }
    } catch (error) {
      const errorMessage = error.message || '获取天气信息失败'
      set({
        loading: false,
        error: errorMessage
      })
      return { success: false, error: errorMessage }
    }
  },

  // 根据城市名获取天气
  getWeatherByCity: async (cityName) => {
    set({ loading: true, error: null })
    try {
      // 检查缓存
      const cachedData = get().getWeatherFromCache(cityName)
      if (cachedData) {
        set({
          currentWeather: cachedData,
          currentLocation: cityName,
          loading: false
        })
        return { success: true, data: cachedData }
      }

      // 获取城市代码
      const cityCode = await getCityCode(cityName)
      if (!cityCode) {
        throw new Error('未找到该城市')
      }

      // 获取天气信息
      const weatherData = await getWeatherInfo(cityCode)
      const updateTime = new Date().toISOString()
      
      set({
        currentWeather: weatherData,
        currentLocation: cityName,
        loading: false,
        lastUpdateTime: updateTime,
        error: null
      })
      
      // 缓存天气数据
      get().cacheWeatherData(cityName, weatherData)
      
      return { success: true, data: weatherData }
    } catch (error) {
      const errorMessage = error.message || '获取天气信息失败'
      set({
        loading: false,
        error: errorMessage
      })
      return { success: false, error: errorMessage }
    }
  },

  // 搜索城市
  searchCities: async (keyword) => {
    if (!keyword || keyword.trim() === '') {
      set({ searchResults: [] })
      return
    }

    set({ searchLoading: true })
    try {
      // 检查位置缓存
      const cachedResults = get().getLocationFromCache(keyword)
      if (cachedResults) {
        set({
          searchResults: cachedResults,
          searchLoading: false
        })
        return
      }

      // 调用真实的高德地图API搜索城市
      const results = await searchCities(keyword)

      set({
        searchResults: results,
        searchLoading: false
      })

      // 缓存搜索结果
      get().cacheLocationData(keyword, results)
    } catch (error) {
      console.error('搜索城市失败:', error)
      set({
        searchResults: [],
        searchLoading: false
      })
    }
  },

  // 清除搜索结果
  clearSearchResults: () => {
    set({ searchResults: [] })
  },

  // 缓存天气数据
  cacheWeatherData: (location, data) => {
    const { weatherCache } = get()
    const cacheKey = location.toLowerCase()
    const cacheData = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + 30 * 60 * 1000 // 30分钟过期
    }
    weatherCache.set(cacheKey, cacheData)
    set({ weatherCache: new Map(weatherCache) })
  },

  // 从缓存获取天气数据
  getWeatherFromCache: (location) => {
    const { weatherCache } = get()
    const cacheKey = location.toLowerCase()
    const cached = weatherCache.get(cacheKey)
    
    if (cached && cached.expiry > Date.now()) {
      return cached.data
    }
    
    // 清除过期缓存
    if (cached) {
      weatherCache.delete(cacheKey)
      set({ weatherCache: new Map(weatherCache) })
    }
    
    return null
  },

  // 缓存位置数据
  cacheLocationData: (keyword, data) => {
    const { locationCache } = get()
    const cacheKey = keyword.toLowerCase()
    const cacheData = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + 60 * 60 * 1000 // 1小时过期
    }
    locationCache.set(cacheKey, cacheData)
    set({ locationCache: new Map(locationCache) })
  },

  // 从缓存获取位置数据
  getLocationFromCache: (keyword) => {
    const { locationCache } = get()
    const cacheKey = keyword.toLowerCase()
    const cached = locationCache.get(cacheKey)
    
    if (cached && cached.expiry > Date.now()) {
      return cached.data
    }
    
    // 清除过期缓存
    if (cached) {
      locationCache.delete(cacheKey)
      set({ locationCache: new Map(locationCache) })
    }
    
    return null
  },

  // 清除所有缓存
  clearAllCache: () => {
    set({
      weatherCache: new Map(),
      locationCache: new Map()
    })
  },

  // 重置store状态
  reset: () => {
    set({
      currentWeather: null,
      currentLocation: null,
      searchResults: [],
      weatherCache: new Map(),
      locationCache: new Map(),
      loading: false,
      searchLoading: false,
      error: null,
      lastUpdateTime: null
    })
  }
}))

export default useWeatherStore