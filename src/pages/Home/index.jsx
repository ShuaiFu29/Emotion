import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus } from '@react-vant/icons'
import WeatherCard from '@/components/WeatherCard'
import Waterfall from '@/components/Waterfall'
import Loading from '@/components/Loading'
import { useDiaryStore } from '@/store/diaryStore'
import './index.less'

const Home = () => {
  const { diaries, loading, hasMore, fetchDiaries } = useDiaryStore()
  const [initialLoading, setInitialLoading] = useState(true)
  
  // 拖动相关状态
  const [fabPosition, setFabPosition] = useState({ right: 20, bottom: 80 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const fabRef = useRef(null)



  // 初始加载数据
  const loadInitialData = useCallback(async () => {
    try {
      setInitialLoading(true)
      await fetchDiaries(true) // true表示重置数据
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setInitialLoading(false)
    }
  }, [fetchDiaries])

  // 加载更多数据
  const loadMoreData = useCallback(async () => {
    if (loading || !hasMore) return
    await fetchDiaries(false) // false表示追加数据
  }, [loading, hasMore, fetchDiaries])

  // 处理发布按钮点击
  const handlePublish = () => {
    // 只有在没有拖动时才触发点击
    if (!isDragging) {
      window.open('/publish', '_blank')
    }
  }

  // 拖动事件处理
  const handleMouseDown = (e) => {
    e.preventDefault()
    setIsDragging(false)
    setDragStart({
      x: e.clientX,
      y: e.clientY
    })
    
    const handleMouseMove = (e) => {
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      
      // 如果移动距离超过5px，认为是拖动
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        setIsDragging(true)
        
        const rect = fabRef.current?.getBoundingClientRect()
        if (rect) {
          const newRight = window.innerWidth - e.clientX - rect.width / 2
          const newBottom = window.innerHeight - e.clientY - rect.height / 2
          
          // 限制在屏幕范围内
          const minRight = 10
          const maxRight = window.innerWidth - rect.width - 10
          const minBottom = 10
          const maxBottom = window.innerHeight - rect.height - 10
          
          setFabPosition({
            right: Math.max(minRight, Math.min(maxRight, newRight)),
            bottom: Math.max(minBottom, Math.min(maxBottom, newBottom))
          })
        }
      }
    }
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      
      // 延迟重置拖动状态，避免点击事件触发
      setTimeout(() => setIsDragging(false), 100)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // 触摸事件处理（移动端）
  const handleTouchStart = (e) => {
    // 移除 e.preventDefault() 以避免 passive event listener 警告
    const touch = e.touches[0]
    setIsDragging(false)
    setDragStart({
      x: touch.clientX,
      y: touch.clientY
    })
    
    const handleTouchMove = (e) => {
      // 在移动时才阻止默认行为，避免页面滚动
      if (isDragging) {
        e.preventDefault()
      }
      
      const touch = e.touches[0]
      const deltaX = touch.clientX - dragStart.x
      const deltaY = touch.clientY - dragStart.y
      
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        setIsDragging(true)
        
        const rect = fabRef.current?.getBoundingClientRect()
        if (rect) {
          const newRight = window.innerWidth - touch.clientX - rect.width / 2
          const newBottom = window.innerHeight - touch.clientY - rect.height / 2
          
          const minRight = 10
          const maxRight = window.innerWidth - rect.width - 10
          const minBottom = 10
          const maxBottom = window.innerHeight - rect.height - 10
          
          setFabPosition({
            right: Math.max(minRight, Math.min(maxRight, newRight)),
            bottom: Math.max(minBottom, Math.min(maxBottom, newBottom))
          })
        }
      }
    }
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      setTimeout(() => setIsDragging(false), 100)
    }
    
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)
  }

  // 下拉刷新功能已移除，因为当前未在UI中使用

  // 初始化数据
  useEffect(() => {
    loadInitialData()
    
    // 设置跨标签通信监听器
    const channel = new BroadcastChannel('diary-updates')
    
    channel.onmessage = (event) => {
      if (event.data.type === 'NEW_DIARY_PUBLISHED') {
        // 当收到新日记发布通知时，重新加载数据
        console.log('收到新日记发布通知，重新加载数据', event.data)
        // 使用loadInitialData来确保完全重新加载数据
        loadInitialData()
      }
    }
    
    // 清理函数
    return () => {
      channel.close()
    }
  }, [loadInitialData])

  if (initialLoading) {
    return <Loading fullScreen={true} text="加载首页内容..." />
  }

  return (
    <div className="home-page">
      {/* 天气卡片 */}
      <div className="weather-section">
        <WeatherCard />
      </div>

      {/* 瀑布流内容 */}
      <div className="content-section">
        <div className="section-header">
          <h2 className="section-title">最新日记</h2>
          <p className="section-subtitle">分享生活中的美好时光</p>
        </div>
        
        <Waterfall
          data={diaries}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={loadMoreData}
        />
      </div>

      {/* 浮动发布按钮 */}
      <div 
        ref={fabRef}
        className="floating-publish-btn"
        onClick={handlePublish}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          position: 'fixed',
          right: `${fabPosition.right}px`,
          bottom: `${fabPosition.bottom}px`,
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          cursor: isDragging ? 'grabbing' : 'grab',
          zIndex: 1000,
          transition: isDragging ? 'none' : 'all 0.3s ease',
          transform: 'scale(1)',
          userSelect: 'none',
          touchAction: 'none'
        }}
        onMouseEnter={(e) => {
          if (!isDragging) {
            e.target.style.transform = 'scale(1.1)'
            e.target.style.boxShadow = '0 6px 25px rgba(59, 130, 246, 0.4)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
            e.target.style.transform = 'scale(1)'
            e.target.style.boxShadow = '0 4px 20px rgba(59, 130, 246, 0.3)'
          }
        }}
      >
        <Plus size="24px" color="#ffffff" />
      </div>
    </div>
  )
}

export default Home