import React, { useState, useEffect, useCallback } from 'react'
import { Search, LocationO, Replay } from '@react-vant/icons'
import { useWeatherStore } from '../../store'
import './index.css'

const WeatherCard = ({ className = '' }) => {
  // 使用weatherStore
  const {
    currentWeather,
    currentLocation,
    searchResults,
    loading,
    searchLoading,
    error,
    getCurrentWeather,
    getWeatherByCity,
    searchCities,
    clearSearchResults
  } = useWeatherStore()
  
  // 本地UI状态
  const [inputLocation, setInputLocation] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)

  // 获取天气数据
  const fetchWeatherData = useCallback(async (city) => {
    if (city) {
      await getWeatherByCity(city)
    } else {
      await getCurrentWeather()
    }
  }, [getCurrentWeather, getWeatherByCity])
  
  // 处理城市搜索
  const handleCitySearch = useCallback(async (keyword) => {
    if (keyword.trim()) {
      await searchCities(keyword.trim())
      setShowSearchResults(true)
    } else {
      clearSearchResults()
      setShowSearchResults(false)
    }
  }, [searchCities, clearSearchResults])
  
  // 处理输入变化
  const handleInputChange = (e) => {
    const value = e.target.value
    setInputLocation(value)
    handleCitySearch(value)
  }
  
  // 选择搜索结果
  const handleSelectCity = (city) => {
    fetchWeatherData(city.name)
    setShowInput(false)
    setShowSearchResults(false)
    setInputLocation('')
    clearSearchResults()
  }
  
  // 直接搜索当前输入
  const handleDirectSearch = () => {
    if (inputLocation.trim()) {
      fetchWeatherData(inputLocation.trim())
      setShowInput(false)
      setShowSearchResults(false)
      setInputLocation('')
      clearSearchResults()
    }
  }
  
  // 处理回车键搜索
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleDirectSearch()
    }
  }
  
  // 切换输入框显示
  const toggleInput = () => {
    setShowInput(!showInput)
    if (showInput) {
      setInputLocation('')
      setShowSearchResults(false)
      clearSearchResults()
    }
  }

  useEffect(() => {
    fetchWeatherData()
  }, [])

  const handleRefresh = () => {
    fetchWeatherData()
  }

  // 格式化天气数据用于显示
  const formatWeatherData = (weather) => {
    if (!weather) return null
    
    const now = new Date()
    return {
      date: now.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }),
      city: weather.city,
      province: weather.province,
      weather: weather.weather,
      temperature: weather.temperature,
      minTemp: weather.minTemp,
      maxTemp: weather.maxTemp,
      wind: weather.wind,
      windPower: weather.windPower,
      updateTime: weather.updateTime ? new Date(weather.updateTime).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      }) : '未知',
      isSimulated: weather.isSimulated || false
    }
  }
  
  const weatherData = formatWeatherData(currentWeather)

  if (loading) {
    return (
      <div className={`weather-card loading ${className}`}>
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <span>获取天气信息中...</span>
        </div>
      </div>
    )
  }

  if (error && !weatherData) {
    return (
      <div className={`weather-card error ${className}`} onClick={handleRefresh}>
        <div className="error-content">
          <Replay />
          <span>{error}</span>
          <span className="retry-hint">点击重试</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`weather-card ${className}`}>
      {/* 头部区域 */}
      <div className="weather-header">
        <div className="date-section">
          <span className="date">{weatherData?.date || '--'}</span>
        </div>
        <div className="actions">
          <button className="action-btn" onClick={toggleInput} title="搜索城市">
            <Search />
          </button>
          <button className="action-btn" onClick={handleRefresh} title="刷新">
            <Replay />
          </button>
        </div>
      </div>

      {/* 搜索输入框 */}
      {showInput && (
        <div className="search-section">
          <input
            type="text"
            value={inputLocation}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="输入城市名称，如：北京、上海"
            className="search-input"
            autoFocus
          />
          
          {/* 搜索结果列表 */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((city) => (
                <div
                  key={city.code}
                  className="search-result-item"
                  onClick={() => handleSelectCity(city)}
                >
                  <span className="city-name">{city.name}</span>
                  <span className="province-name">{city.province}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* 搜索加载状态 */}
          {searchLoading && (
            <div className="search-loading">
              <div className="loading-spinner small"></div>
              <span>搜索中...</span>
            </div>
          )}
          
          <div className="search-buttons">
            <button className="search-btn" onClick={handleDirectSearch}>
              搜索
            </button>
            <button className="cancel-btn" onClick={toggleInput}>
              取消
            </button>
          </div>
        </div>
      )}

      {/* 位置信息 */}
      <div className="location-section">
        <LocationO />
        <span className="location-text">
          {weatherData?.province && weatherData?.province !== weatherData?.city 
            ? `${weatherData.province} ${weatherData.city}` 
            : weatherData?.city || currentLocation || '未知位置'}
        </span>
        {weatherData?.isSimulated && (
          <span className="simulated-badge">模拟数据</span>
        )}
        {error && (
          <span className="error-badge">数据异常</span>
        )}
      </div>

      {/* 主要天气信息 */}
      <div className="weather-main">
        <div className="temperature-section">
          <span className="temperature">{weatherData?.temperature ?? '--'}°</span>
          <span className="weather-desc">{weatherData?.weather ?? '未知'}</span>
        </div>
        <div className="temp-range">
          <span className="temp-range-text">
            {weatherData?.minTemp ?? '--'}° / {weatherData?.maxTemp ?? '--'}°
          </span>
        </div>
      </div>

      {/* 详细信息 */}
      <div className="weather-details">
        <div className="detail-item">
          <span className="detail-label">风向</span>
          <span className="detail-value">{weatherData?.wind ?? '未知'}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">风力</span>
          <span className="detail-value">{weatherData?.windPower ?? '--'}级</span>
        </div>
      </div>

      {/* 底部更新时间 */}
      <div className="weather-footer">
        <span className="update-time">更新于 {weatherData?.updateTime ?? '未知'}</span>
      </div>
    </div>
  )
}

export default WeatherCard