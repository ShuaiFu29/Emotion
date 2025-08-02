import React, { useState, useEffect, useCallback } from 'react'
import { Search, LocationO, Replay } from '@react-vant/icons'
import { getCurrentWeather } from '../../api/weather'
import './index.css'

const WeatherCard = ({ className = '' }) => {
  const [weatherData, setWeatherData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [location, setLocation] = useState('北京')
  const [inputLocation, setInputLocation] = useState('')
  const [showInput, setShowInput] = useState(false)

  // 获取天气数据
  const fetchWeatherData = useCallback(async (city = location) => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await getCurrentWeather(city)
      
      // 格式化日期，只显示年月日
      const now = new Date()
      const formattedData = {
        date: now.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }),
        city: data.city,
        province: data.province,
        weather: data.weather,
        temperature: data.temperature,
        minTemp: data.minTemp,
        maxTemp: data.maxTemp,
        wind: data.wind,
        windPower: data.windPower,
        updateTime: new Date(data.updateTime).toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        isSimulated: data.isSimulated || false
      }
      
      setWeatherData(formattedData)
      setLocation(city)
      
      // 如果是模拟数据，显示提示
      if (data.isSimulated) {
        console.warn('使用模拟天气数据，可能是API调用失败或网络问题')
      }
      
    } catch (err) {
      setError(err.message || '获取天气信息失败')
      console.error('Weather fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [location])
  
  // 处理位置搜索
  const handleLocationSearch = () => {
    if (inputLocation.trim()) {
      fetchWeatherData(inputLocation.trim())
      setShowInput(false)
      setInputLocation('')
    }
  }
  
  // 处理回车键搜索
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLocationSearch()
    }
  }
  
  // 切换输入框显示
  const toggleInput = () => {
    setShowInput(!showInput)
    if (showInput) {
      setInputLocation('')
    }
  }

  useEffect(() => {
    fetchWeatherData()
  }, [])

  const handleRefresh = () => {
    fetchWeatherData()
  }

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

  if (error) {
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
          <span className="date">{weatherData.date}</span>
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
            onChange={(e) => setInputLocation(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入城市名称，如：北京、上海"
            className="search-input"
            autoFocus
          />
          <div className="search-buttons">
            <button className="search-btn" onClick={handleLocationSearch}>
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
          {weatherData.province && weatherData.province !== weatherData.city 
            ? `${weatherData.province} ${weatherData.city}` 
            : weatherData.city}
        </span>
        {weatherData.isSimulated && (
          <span className="simulated-badge">模拟数据</span>
        )}
      </div>

      {/* 主要天气信息 */}
      <div className="weather-main">
        <div className="temperature-section">
          <span className="temperature">{weatherData.temperature}°</span>
          <span className="weather-desc">{weatherData.weather}</span>
        </div>
        <div className="temp-range">
          <span className="temp-range-text">
            {weatherData.minTemp}° / {weatherData.maxTemp}°
          </span>
        </div>
      </div>

      {/* 详细信息 */}
      <div className="weather-details">
        <div className="detail-item">
          <span className="detail-label">风向</span>
          <span className="detail-value">{weatherData.wind}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">风力</span>
          <span className="detail-value">{weatherData.windPower}级</span>
        </div>
      </div>

      {/* 底部更新时间 */}
      <div className="weather-footer">
        <span className="update-time">更新于 {weatherData.updateTime}</span>
      </div>
    </div>
  )
}

export default WeatherCard