import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Loading from '@/components/Loading'
import useDiaryStore from '@/store/diaryStore'
import './index.css'

const Detail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { diaries, loading, getDiary } = useDiaryStore()
  const [diary, setDiary] = useState(null)
  const [liked, setLiked] = useState(false)
  const [starred, setStarred] = useState(false)
  const [customToast, setCustomToast] = useState({ show: false, message: '', type: 'info' })

  // 获取日记详情
  useEffect(() => {
    const fetchDiaryDetail = async () => {
      try {
        // 首先从已加载的日记列表中查找
        const existingDiary = diaries.find(d => d.id === id)
        if (existingDiary) {
          setDiary(existingDiary)
          return
        }
        
        // 如果列表中没有，从store获取
        const result = await getDiary(id)
        if (result.success) {
          setDiary(result.data)
        } else {
          showToast('加载失败，请重试', 'error')
        }
      } catch (error) {
        showToast('加载失败，请重试', 'error')
        console.error('获取日记详情失败:', error)
      }
    }

    if (id) {
      fetchDiaryDetail()
    }
  }, [id, diaries, getDiary])

  // 处理返回
  const handleBack = () => {
    navigate(-1)
  }

  // 自定义 Toast 函数
  const showToast = (message, type = 'info') => {
    setCustomToast({ show: true, message, type })
    setTimeout(() => {
      setCustomToast({ show: false, message: '', type: 'info' })
    }, 3000)
  }

  // 处理点赞
  const handleLike = () => {
    setLiked(!liked)
    showToast(liked ? '取消点赞' : '点赞成功', 'success')
  }

  // 处理收藏
  const handleStar = () => {
    setStarred(!starred)
    showToast(starred ? '取消收藏' : '收藏成功', 'success')
  }

  // 处理分享
  const handleShare = () => {
    showToast('分享功能开发中', 'info')
  }

  if (loading) {
    return <Loading fullScreen={true} text="加载日记详情..." />
  }

  if (!diary) {
    return (
      <div className="detail-error">
        <div className="detail-navbar">
          <button className="nav-back-btn" onClick={handleBack}>
            ← 返回
          </button>
          <h1 className="nav-title">日记详情</h1>
          <div className="nav-placeholder"></div>
        </div>
        <div className="error-content">
          <p>日记不存在或已被删除</p>
          <button className="primary-btn" onClick={handleBack}>返回首页</button>
        </div>
      </div>
    )
  }

  return (
    <div className="detail-page">
      <div className="detail-navbar">
        <button className="nav-back-btn" onClick={handleBack}>
          ← 返回
        </button>
        <h1 className="nav-title">日记详情</h1>
        <div className="nav-placeholder"></div>
      </div>
      
      <div className="detail-content">
        <div className="detail-card">
          {/* 日记图片 */}
          {diary.images && diary.images.length > 0 && (
            <div className="detail-images">
              {diary.images.map((image, index) => (
                <div key={index} className="detail-image">
                  <img src={image} alt={`${diary.title} - 图片${index + 1}`} />
                </div>
              ))}
            </div>
          )}
          
          {/* 日记标题 */}
          <div className="detail-header">
            <h1 className="detail-title">{diary.title}</h1>
            <div className="detail-meta">
              <span className="detail-date">{new Date(diary.createdAt).toLocaleDateString()} {new Date(diary.createdAt).toLocaleTimeString()}</span>
              {diary.weather && (
                <span className="detail-weather">☀️ {diary.weather}</span>
              )}
              {diary.mood && (
                <span className="detail-mood">😊 {diary.mood}</span>
              )}
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
                <span key={index} className="detail-tag">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          
          {/* 统计信息 */}
          <div className="detail-stats">
            <span className="stat-item">
              <span className={`like-icon ${liked ? 'liked' : ''}`}>❤️</span> {(diary.likes || 0) + (liked ? 1 : 0)}
            </span>
            <span className="stat-item">
              👁️ {diary.views || 0}
            </span>
            <span className="stat-item">
              💬 {diary.comments || 0}
            </span>
          </div>
        </div>
      </div>
      
      {/* 底部操作栏 */}
      <div className="detail-actions">
        <button
          className={`action-btn ${liked ? 'liked' : ''}`}
          onClick={handleLike}
        >
          <span className="btn-icon">❤️</span>
          {liked ? '已点赞' : '点赞'}
        </button>
        <button
          className={`action-btn ${starred ? 'starred' : ''}`}
          onClick={handleStar}
        >
          <span className="btn-icon">⭐</span>
          {starred ? '已收藏' : '收藏'}
        </button>
        <button
          className="action-btn"
          onClick={handleShare}
        >
          <span className="btn-icon">📤</span>
          分享
        </button>
      </div>
      
      {/* 自定义 Toast */}
      {customToast.show && (
        <div className={`custom-toast custom-toast-${customToast.type}`}>
          {customToast.message}
        </div>
      )}
    </div>
  )
}

export default Detail