import { useState, useEffect, useCallback } from 'react'
import { Plus } from '@react-vant/icons'
import { useNavigate } from 'react-router-dom'
import WeatherCard from '@/components/WeatherCard'
import Waterfall from '@/components/Waterfall'
import Loading from '@/components/Loading'
import './index.less'

const Home = () => {
  const navigate = useNavigate()
  const [diaryData, setDiaryData] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [initialLoading, setInitialLoading] = useState(true)

  // 模拟日记数据
  const generateMockDiary = (startIndex, count) => {
    const mockImages = [
      'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20sunset%20landscape%20with%20mountains%20and%20lake&image_size=portrait_4_3',
      'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=cozy%20coffee%20shop%20interior%20with%20warm%20lighting&image_size=square',
      'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=cherry%20blossoms%20in%20spring%20park&image_size=landscape_4_3',
      'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20city%20skyline%20at%20night&image_size=portrait_16_9',
      'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=peaceful%20forest%20path%20with%20sunlight&image_size=square_hd'
    ]

    const mockTitles = [
      '今天的美好时光',
      '午后的咖啡时间',
      '春天的樱花盛开',
      '城市夜景的魅力',
      '森林漫步的宁静',
      '海边日落的温柔',
      '雨后彩虹的惊喜',
      '书店里的慢时光',
      '山顶看云海',
      '小巷里的猫咪'
    ]

    const mockContents = [
      '今天过得特别充实，和朋友一起度过了愉快的时光。阳光很好，心情也很好。',
      '在咖啡店里坐了一个下午，看着窗外的行人，思考着生活的美好。咖啡的香味让人心情愉悦。',
      '春天来了，樱花开得正盛。走在花树下，仿佛置身于粉色的梦境中。',
      '夜晚的城市有着不同的魅力，霓虹灯闪烁，车水马龙，充满了生机与活力。',
      '在森林里漫步，听着鸟儿的歌声，感受着大自然的宁静与美好。',
      '海边的日落总是那么美，橙红色的天空倒映在海面上，如诗如画。',
      '雨后的彩虹出现在天空中，七彩的光芒让人心情瞬间明朗起来。',
      '在书店里度过了一个安静的下午，书香阵阵，时光静好。',
      '爬到山顶看云海，云雾缭绕，仿佛置身仙境。',
      '小巷里遇到一只可爱的猫咪，它慵懒地晒着太阳，岁月静好。'
    ]

    const mockTags = [
      ['生活', '美好', '阳光'],
      ['咖啡', '下午茶', '慢生活'],
      ['春天', '樱花', '浪漫'],
      ['城市', '夜景', '繁华'],
      ['自然', '森林', '宁静'],
      ['海边', '日落', '美景'],
      ['雨后', '彩虹', '惊喜'],
      ['书店', '阅读', '文艺'],
      ['登山', '云海', '壮观'],
      ['猫咪', '小巷', '温馨']
    ]

    return Array.from({ length: count }, (_, index) => {
      const actualIndex = (startIndex + index) % 10
      return {
        id: startIndex + index + 1,
        title: mockTitles[actualIndex],
        content: mockContents[actualIndex],
        image: Math.random() > 0.3 ? mockImages[actualIndex % mockImages.length] : null,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        tags: mockTags[actualIndex],
        likes: Math.floor(Math.random() * 100),
        views: Math.floor(Math.random() * 500)
      }
    })
  }

  // 初始加载数据
  const loadInitialData = useCallback(async () => {
    try {
      setInitialLoading(true)
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const initialData = generateMockDiary(0, 8)
      setDiaryData(initialData)
      setPage(2)
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setInitialLoading(false)
    }
  }, [])

  // 加载更多数据
  const loadMoreData = useCallback(async () => {
    if (loading || !hasMore) return

    try {
      setLoading(true)
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const newData = generateMockDiary((page - 1) * 6, 6)
      
      setDiaryData(prev => [...prev, ...newData])
      setPage(prev => prev + 1)
      
      // 模拟数据加载完毕
      if (page >= 5) {
        setHasMore(false)
      }
    } catch (error) {
      console.error('加载更多数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, page])

  // 处理发布按钮点击
  const handlePublish = () => {
    navigate('/publish')
  }

  // 初始化数据
  useEffect(() => {
    loadInitialData()
  }, [])

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
          data={diaryData}
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