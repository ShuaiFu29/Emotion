import { useState, useEffect } from 'react'
import { Card, Loading, Toast } from 'react-vant'
import { LocationO, Replay, Setting } from '@react-vant/icons'
import { getCurrentWeather, getRecommendedAPIs } from '@/api/weather'
import './index.css'

const WeatherCard = ({ className = '' }) => {
  const [weatherData, setWeatherData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentAPI, setCurrentAPI] = useState('qweather') // 默认使用和风天气

  // 获取天气数据
  const fetchWeatherData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 调用天气API
      const data = await getCurrentWeather('北京')
      
      // 格式化数据
      const formattedData = {
        date: new Date().toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }),
        weather: data.weather,
        temperature: data.temperature,
        location: data.location,
        humidity: data.humidity,
        windSpeed: `${data.windSpeed} km/h`
      }
      
      setWeatherData(formattedData)
    } catch (err) {
      setError('获取天气信息失败')
      console.error('Weather fetch error:', err)
    } finally {
      setLoading(false)
    }
  }
  
  // 根据天气描述获取图标
  const getWeatherIcon = (description) => {
    const desc = description.toLowerCase()
    if (desc.includes('晴') || desc.includes('sun')) return '☀️'
    if (desc.includes('云') || desc.includes('cloud')) return '☁️'
    if (desc.includes('雨') || desc.includes('rain')) return '🌧️'
    if (desc.includes('雪') || desc.includes('snow')) return '❄️'
    if (desc.includes('雾') || desc.includes('fog')) return '🌫️'
    if (desc.includes('雷') || desc.includes('thunder')) return '⛈️'
    return '🌤️'
  }
  
  // 切换API服务
  const switchAPI = () => {
    const apis = getRecommendedAPIs()
    const apiKeys = Object.keys(apis)
    const currentIndex = apiKeys.indexOf(currentAPI.toUpperCase())
    const nextIndex = (currentIndex + 1) % apiKeys.length
    const nextAPI = apiKeys[nextIndex].toLowerCase()
    
    setCurrentAPI(nextAPI)
    Toast.info(`切换到 ${apis[nextAPI.toUpperCase()].name}`)
    fetchWeatherData()
  }

  useEffect(() => {
    fetchWeatherData()
  }, [])

  const handleRefresh = () => {
    fetchWeatherData()
  }

  if (loading) {
    return (
      <Card className={`weather-card ${className}`}>
        <div className="weather-loading">
          <Loading size="24px" color="#16a34a" />
          <span>获取天气信息中...</span>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`weather-card error ${className}`} onClick={handleRefresh}>
        <div className="weather-error">
          <Replay size="24px" color="#ef4444" />
          <span>{error}</span>
          <span className="retry-hint">点击重试</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`weather-card ${className}`} onClick={handleRefresh}>
      <div className="weather-header">
        <div className="date-info">
          <span className="date-label">日期:</span>
          <span className="date-value">{weatherData.date}</span>
        </div>
        <div className="location-info">
          <LocationO size="16px" color="#16a34a" />
          <span className="location">{weatherData.location}</span>
        </div>
      </div>
      
      <div className="weather-main">
        <div className="weather-icon">
          <span className="icon">{getWeatherIcon(weatherData.weather)}</span>
        </div>
        <div className="weather-info">
          <div className="weather-primary">
            <span className="weather-label">天气:</span>
            <span className="weather-value">{weatherData.weather}</span>
          </div>
          <div className="temperature">
            <span className="temp-value">{weatherData.temperature}°C</span>
          </div>
        </div>
      </div>
      
      <div className="weather-details">
        <div className="detail-item">
          <span className="detail-label">湿度</span>
          <span className="detail-value">{weatherData.humidity}%</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">风力</span>
          <span className="detail-value">{weatherData.windSpeed}</span>
        </div>
        {weatherData.pressure && (
          <div className="detail-item">
            <span className="detail-label">气压</span>
            <span className="detail-value">{weatherData.pressure}</span>
          </div>
        )}
      </div>
      
      <div className="weather-controls">
        <div className="refresh-hint" onClick={handleRefresh}>
          <Replay size="16px" />
          <span>刷新</span>
        </div>
        <div className="api-switch" onClick={switchAPI}>
          <Setting size="16px" />
          <span>切换API</span>
        </div>
      </div>
    </Card>
  )
}

export default WeatherCard