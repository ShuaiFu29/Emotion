import { useState, useEffect, useCallback } from 'react'
import { Plus } from '@react-vant/icons'
import { useNavigate } from 'react-router-dom'
import WeatherCard from '@/components/WeatherCard'
import Waterfall from '@/components/Waterfall'
import Loading from '@/components/Loading'
import { useDiaryStore } from '@/store/diaryStore'
import './index.less'

const Home = () => {
  const navigate = useNavigate()
  const { diaries, loading, hasMore, fetchDiaries, refreshDiaries } = useDiaryStore()
  const [initialLoading, setInitialLoading] = useState(true)



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
    // 在新标签页打开publish页面
    window.open('/publish', '_blank')
  }

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    await refreshDiaries();
  }, [refreshDiaries]);

  // 初始化数据
  useEffect(() => {
    loadInitialData()
    
    // 设置跨标签通信监听器
    const channel = new BroadcastChannel('diary-updates')
    
    channel.onmessage = (event) => {
      if (event.data.type === 'NEW_DIARY_PUBLISHED') {
        // 当收到新日记发布通知时，重新加载数据
        console.log('收到新日记发布通知，重新加载数据')
        refreshDiaries()
      }
    }
    
    // 清理函数
    return () => {
      channel.close()
    }
  }, [fetchDiaries, refreshDiaries])

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
        className="floating-publish-btn"
        onClick={handlePublish}
        style={{
          position: 'fixed',
          right: '20px',
          bottom: '80px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          cursor: 'pointer',
          zIndex: 1000,
          transition: 'all 0.3s ease',
          transform: 'scale(1)'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)'
          e.target.style.boxShadow = '0 6px 25px rgba(59, 130, 246, 0.4)'
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)'
          e.target.style.boxShadow = '0 4px 20px rgba(59, 130, 246, 0.3)'
        }}
      >
        <Plus size="24px" color="#ffffff" />
      </div>
    </div>
  )
}

export default Home