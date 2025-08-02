import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { NavBar, Card, Tag, Button, Toast } from 'react-vant'
import { ArrowLeft, Like, Star, Share } from '@react-vant/icons'
import Loading from '@/components/Loading'
import './index.css'

const Detail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [diary, setDiary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [starred, setStarred] = useState(false)

  // 模拟获取日记详情
  useEffect(() => {
    const fetchDiaryDetail = async () => {
      try {
        setLoading(true)
        // 模拟API调用延迟
        await new Promise(resolve => setTimeout(resolve, 800))
        
        // 模拟日记详情数据
        const mockDiary = {
          id: id,
          title: `日记详情 ${id}`,
          content: `这是日记 ${id} 的详细内容。今天是一个美好的日子，阳光明媚，心情愉悦。我在公园里散步，看到了很多美丽的花朵和绿树。生活中的小美好总是让人感到温暖和幸福。\n\n在这个快节奏的世界里，我们常常忽略了身边的美好。但是当我们停下脚步，仔细观察周围的一切时，会发现生活其实充满了惊喜和感动。\n\n希望每一天都能保持这样的心情，用心感受生活的美好，记录下每一个值得珍藏的瞬间。`,
          image: `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20diary%20moment%20warm%20orange%20sunset%20peaceful%20scene&image_size=landscape_16_9`,
          date: '2024-01-15',
          time: '14:30',
          weather: '晴朗',
          mood: '愉悦',
          location: '城市公园',
          tags: ['生活', '感悟', '美好', '阳光'],
          likes: Math.floor(Math.random() * 100) + 10,
          views: Math.floor(Math.random() * 500) + 50,
          comments: Math.floor(Math.random() * 20) + 5
        }
        
        setDiary(mockDiary)
      } catch (error) {
        Toast.fail('加载失败，请重试')
        console.error('获取日记详情失败:', error)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchDiaryDetail()
    }
  }, [id])

  // 处理返回
  const handleBack = () => {
    navigate(-1)
  }

  // 处理点赞
  const handleLike = () => {
    setLiked(!liked)
    Toast.success(liked ? '取消点赞' : '点赞成功')
  }

  // 处理收藏
  const handleStar = () => {
    setStarred(!starred)
    Toast.success(starred ? '取消收藏' : '收藏成功')
  }

  // 处理分享
  const handleShare = () => {
    Toast.success('分享功能开发中')
  }

  if (loading) {
    return <Loading fullScreen={true} text="加载日记详情..." />
  }

  if (!diary) {
    return (
      <div className="detail-error">
        <NavBar
          title="日记详情"
          leftText="返回"
          leftArrow
          onClickLeft={handleBack}
        />
        <div className="error-content">
          <p>日记不存在或已被删除</p>
          <Button type="primary" onClick={handleBack}>返回首页</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="detail-page">
      <NavBar
        title="日记详情"
        leftText="返回"
        leftArrow
        onClickLeft={handleBack}
        className="detail-navbar"
      />
      
      <div className="detail-content">
        <Card className="detail-card">
          {/* 日记图片 */}
          {diary.image && (
            <div className="detail-image">
              <img src={diary.image} alt={diary.title} />
            </div>
          )}
          
          {/* 日记标题 */}
          <div className="detail-header">
            <h1 className="detail-title">{diary.title}</h1>
            <div className="detail-meta">
              <span className="detail-date">{diary.date} {diary.time}</span>
              <span className="detail-weather">☀️ {diary.weather}</span>
              <span className="detail-mood">😊 {diary.mood}</span>
              {diary.location && (
                <span className="detail-location">📍 {diary.location}</span>
              )}
            </div>
          </div>
          
          {/* 日记内容 */}
          <div className="detail-body">
            <p className="detail-text">{diary.content}</p>
          </div>
          
          {/* 标签 */}
          {diary.tags && diary.tags.length > 0 && (
            <div className="detail-tags">
              {diary.tags.map((tag, index) => (
                <Tag key={index} type="primary" className="detail-tag">
                  #{tag}
                </Tag>
              ))}
            </div>
          )}
          
          {/* 统计信息 */}
          <div className="detail-stats">
            <span className="stat-item">
              <Like className={liked ? 'liked' : ''} /> {diary.likes + (liked ? 1 : 0)}
            </span>
            <span className="stat-item">
              👁️ {diary.views}
            </span>
            <span className="stat-item">
              💬 {diary.comments}
            </span>
          </div>
        </Card>
      </div>
      
      {/* 底部操作栏 */}
      <div className="detail-actions">
        <Button
          icon={<Like />}
          type={liked ? 'primary' : 'default'}
          className={`action-btn ${liked ? 'liked' : ''}`}
          onClick={handleLike}
        >
          {liked ? '已点赞' : '点赞'}
        </Button>
        <Button
          icon={<Star />}
          type={starred ? 'warning' : 'default'}
          className={`action-btn ${starred ? 'starred' : ''}`}
          onClick={handleStar}
        >
          {starred ? '已收藏' : '收藏'}
        </Button>
        <Button
          icon={<Share />}
          type="default"
          className="action-btn"
          onClick={handleShare}
        >
          分享
        </Button>
      </div>
    </div>
  )
}

export default Detail