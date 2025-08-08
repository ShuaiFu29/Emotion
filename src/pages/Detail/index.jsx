import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Loading from '@/components/Loading'
import useDiaryStore from '@/store/diaryStore'
import useAuthStore from '@/store/authStore'
import { processImageData, getPlaceholderImage } from '@/utils/imageUtils'
import './index.css'

const Detail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { diaries, loading, deleting, getDiary, deleteDiary } = useDiaryStore()
  const { user } = useAuthStore()
  const [diary, setDiary] = useState(null)
  const [liked, setLiked] = useState(false)
  const [starred, setStarred] = useState(false)
  const [customToast, setCustomToast] = useState({ show: false, message: '', type: 'info' })
  const [showImageModal, setShowImageModal] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleted, setIsDeleted] = useState(false)

  // 获取日记详情并增加浏览量
  useEffect(() => {
    const fetchDiaryDetail = async () => {
      // 如果日记已被删除，不执行任何操作
      if (isDeleted) {
        return
      }
      
      try {
        // 首先从已加载的日记列表中查找
        const existingDiary = diaries.find(d => d.id === id)
        if (existingDiary) {
          // // console.log('找到现有日记:', existingDiary)
          // console.log('图片数据:', existingDiary.images)
          if (existingDiary.images && existingDiary.images.length > 0) {
            // existingDiary.images.forEach((img, index) => {
            //   console.log(`图片${index + 1}:`, {
            //     type: typeof img,
            //     isBase64: img && img.startsWith && img.startsWith('data:'),
            //     isBlob: img && img.startsWith && img.startsWith('blob:'),
            //     length: img ? img.length : 0,
            //     preview: img ? img.substring(0, 50) + '...' : 'null'
            //   })
            // })
          }
          setDiary(existingDiary)
          // 增加浏览量
          incrementViewCount(existingDiary)
          return
        }
        
        // 如果列表中没有，从store获取
        const result = await getDiary(id)
        if (result.success) {
          // console.log('从store获取的日记:', result.data)
          // console.log('图片数据:', result.data.images)
          if (result.data.images && result.data.images.length > 0) {
            // result.data.images.forEach((img, index) => {
            //   console.log(`图片${index + 1}:`, {
            //     type: typeof img,
            //     isBase64: img && img.startsWith && img.startsWith('data:'),
            //     isBlob: img && img.startsWith && img.startsWith('blob:'),
            //     length: img ? img.length : 0,
            //     preview: img ? img.substring(0, 50) + '...' : 'null'
            //   })
            // })
          }
          setDiary(result.data)
          // 增加浏览量
          incrementViewCount(result.data)
        } else {
          showToast('加载失败，请重试', 'error')
        }
      } catch (error) {
        showToast('加载失败，请重试', 'error')
        console.error('获取日记详情失败:', error)
      }
    }

    if (id && !isDeleted) {
      fetchDiaryDetail()
    }
  }, [id, diaries, getDiary, isDeleted, showToast])

  // 增加浏览量
  const incrementViewCount = (diaryData) => {
    try {
      // 从localStorage获取全局日记数据
      let globalDiaries = []
      const storedDiaries = localStorage.getItem('global_diaries')
      if (storedDiaries) {
        globalDiaries = JSON.parse(storedDiaries)
        // console.log('localStorage中的全局日记数据:', globalDiaries)
        
        // 检查localStorage中的图片数据
        globalDiaries.forEach((diary, diaryIndex) => {
          if (diary.images && diary.images.length > 0) {
            // console.log(`localStorage日记${diaryIndex}的图片:`, diary.images.map((img, imgIndex) => ({
            //   index: imgIndex,
            //   type: typeof img,
            //   isBase64: img && img.startsWith && img.startsWith('data:'),
            //   isBlob: img && img.startsWith && img.startsWith('blob:'),
            //   length: img ? img.length : 0,
            //   preview: img ? img.substring(0, 50) + '...' : 'null'
            // })))
          }
        })
      }
      
      // 找到对应的日记并增加浏览量
      const diaryIndex = globalDiaries.findIndex(d => d.id === diaryData.id)
      if (diaryIndex !== -1) {
        globalDiaries[diaryIndex].views = (globalDiaries[diaryIndex].views || 0) + 1
        localStorage.setItem('global_diaries', JSON.stringify(globalDiaries))
        
        // 更新当前显示的日记数据
        setDiary(prev => prev ? { ...prev, views: (prev.views || 0) + 1 } : null)
      }
    } catch (error) {
      console.warn('增加浏览量失败:', error)
    }
  }

  // 处理返回
  const handleBack = () => {
    navigate(-1)
  }

  // 自定义 Toast 函数
  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    // 如果日记已被删除且是错误类型的提示，不显示
    if (isDeleted && type === 'error') {
      // console.log('日记已删除，忽略错误提示:', message)
      return
    }
    
    setCustomToast({ show: true, message, type })
    setTimeout(() => {
      setCustomToast({ show: false, message: '', type: 'info' })
    }, duration)
  }, [isDeleted])

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

  // 处理图片点击
  const handleImageClick = (index) => {
    setCurrentImageIndex(index)
    setShowImageModal(true)
  }

  // 关闭图片模态框
  const closeImageModal = () => {
    setShowImageModal(false)
  }

  // 切换图片
  const switchImage = (direction) => {
    if (!diary?.images) return
    const newIndex = direction === 'prev' 
      ? (currentImageIndex - 1 + diary.images.length) % diary.images.length
      : (currentImageIndex + 1) % diary.images.length
    setCurrentImageIndex(newIndex)
  }

  // 处理删除日记
  const handleDelete = async () => {
    // 防止重复点击
    if (isDeleting || deleting) return
    
    setIsDeleting(true)
    
    try {
      // console.log('开始删除日记:', diary.id)
      const result = await deleteDiary(diary.id)
      // console.log('删除结果:', result)
      
      if (result.success) {
        // 标记日记已删除，停止所有错误处理
        setIsDeleted(true)
        
        // 删除成功后稍作延迟，让用户看到删除状态
        setTimeout(() => {
          setShowDeleteConfirm(false)
          setIsDeleting(false)
          navigate('/', { replace: true })
        }, 800) // 0.8秒延迟
      } else {
        setIsDeleting(false)
        showToast(result.error || '删除失败', 'error')
      }
    } catch (error) {
      console.error('删除日记失败:', error)
      setIsDeleting(false)
      showToast('删除失败', 'error')
    }
  }

  // 添加评论
  const handleAddComment = () => {
    if (!newComment.trim()) {
      showToast('请输入评论内容', 'error')
      return
    }
    
    const comment = {
      id: Date.now().toString(),
      content: newComment.trim(),
      author: user?.nickname || '匿名用户',
      avatar: user?.avatar || '',
      createdAt: new Date().toISOString()
    }
    
    setComments(prev => [comment, ...prev])
    setNewComment('')
    showToast('评论发表成功', 'success')
  }

  // 检查是否为作者 - 增强版本
  const isAuthor = user && diary && (
    user.id === diary.authorId || 
    user.username === diary.author ||
    user.nickname === diary.author ||
    (user.id && diary.authorId && String(user.id) === String(diary.authorId))
  )
  
  // 详细调试信息
  // console.log('=== 删除按钮显示调试 ===', {
  //   '用户信息': {
  //     user: user,
  //     userId: user?.id,
  //     username: user?.username,
  //     nickname: user?.nickname,
  //     isAuthenticated: !!user
  //   },
  //   '日记信息': {
  //     diary: diary,
  //     diaryId: diary?.id,
  //     authorId: diary?.authorId,
  //     author: diary?.author,
  //     title: diary?.title
  //   },
  //   '匹配结果': {
  //     isAuthor: isAuthor,
  //     userIdMatch: user?.id === diary?.authorId,
  //     usernameMatch: user?.username === diary?.author,
  //     nicknameMatch: user?.nickname === diary?.author,
  //     stringIdMatch: user?.id && diary?.authorId && String(user.id) === String(diary.authorId)
  //   },
  //   '删除按钮应该显示': isAuthor ? '是' : '否'
  // })
  
  // 强制显示删除按钮用于测试（临时）
  const forceShowDelete = true
  // console.log('强制显示删除按钮（测试用）:', forceShowDelete)

  // 图片加载错误处理函数
  const handleImageError = (e, index) => {
    // 如果日记已被删除，不显示错误提示
    if (isDeleted) {
      // console.log('日记已删除，忽略图片加载错误')
      return
    }
    
    // console.error(`图片${index + 1}加载失败:`, e.target.src)
    // 设置占位图
    e.target.src = getPlaceholderImage(`图片${index + 1}加载失败`)
    showToast(`图片${index + 1}加载失败`, 'error')
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
        <div className="nav-actions">
          {(isAuthor || forceShowDelete) && (
            <button 
              className="delete-btn" 
              onClick={() => setShowDeleteConfirm(true)}
              title="删除日记"
              style={{ 
                backgroundColor: forceShowDelete && !isAuthor ? '#ffeb3b' : '',
                color: forceShowDelete && !isAuthor ? '#000' : ''
              }}
            >
              🗑️
            </button>
          )}
        </div>
      </div>
      
      <div className="detail-content">
        <div className="detail-card">
          {/* 日记图片 */}
          {diary.images && diary.images.length > 0 && (
            <div className="detail-images">
              {diary.images.map((image, index) => {
                // 图片格式检查和处理
                const processedImage = processImageData(image, index)
                return (
                  <div key={index} className="detail-image" onClick={() => handleImageClick(index)}>
                    <img 
                      src={processedImage} 
                      alt={`${diary.title} - 图片${index + 1}`}
                      onError={(e) => handleImageError(e, index)}
                      onLoad={() => {/* console.log(`图片${index + 1}加载成功`) */}}
                    />
                    <div className="image-overlay">
                      <span className="zoom-icon">🔍</span>
                    </div>
                  </div>
                )
              })}
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
        
        {/* 评论区域 */}
        <div className="comments-section">
          <div className="comments-header">
            <h3>评论 ({comments.length})</h3>
          </div>
          
          {/* 发表评论 */}
          <div className="comment-input-area">
            <div className="comment-input-wrapper">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="写下你的想法..."
                className="comment-input"
                rows={3}
              />
              <button 
                className="comment-submit-btn"
                onClick={handleAddComment}
                disabled={!newComment.trim()}
              >
                发表
              </button>
            </div>
          </div>
          
          {/* 评论列表 */}
          <div className="comments-list">
            {comments.length === 0 ? (
              <div className="no-comments">
                <p>暂无评论，快来抢沙发吧~</p>
              </div>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-avatar">
                    {comment.avatar ? (
                      <img src={comment.avatar} alt={comment.author} />
                    ) : (
                      <div className="default-avatar">{comment.author.charAt(0)}</div>
                    )}
                  </div>
                  <div className="comment-content">
                    <div className="comment-header">
                      <span className="comment-author">{comment.author}</span>
                      <span className="comment-time">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="comment-text">{comment.content}</div>
                  </div>
                </div>
              ))
            )}
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
      
      {/* 图片模态框 */}
      {showImageModal && diary?.images && (
        <div className="image-modal" onClick={closeImageModal}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeImageModal}>×</button>
            
            {diary.images.length > 1 && (
              <button 
                className="image-nav image-nav-prev" 
                onClick={() => switchImage('prev')}
              >
                ‹
              </button>
            )}
            
            <img 
              src={diary.images[currentImageIndex]} 
              alt={`${diary.title} - 图片${currentImageIndex + 1}`}
              className="modal-image"
            />
            
            {diary.images.length > 1 && (
              <button 
                className="image-nav image-nav-next" 
                onClick={() => switchImage('next')}
              >
                ›
              </button>
            )}
            
            {diary.images.length > 1 && (
              <div className="image-counter">
                {currentImageIndex + 1} / {diary.images.length}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="delete-modal">
          <div className="delete-modal-content">
            <h3>{(isDeleting || deleting) ? '正在删除...' : '确认删除'}</h3>
            <p>
              {(isDeleting || deleting) 
                ? '正在删除日记，请稍候...' 
                : '确定要删除这篇日记吗？删除后无法恢复。'
              }
            </p>
            {(isDeleting || deleting) && (
              <div className="delete-loading">
                <div className="loading-spinner"></div>
              </div>
            )}
            <div className="delete-modal-actions">
              <button 
                className="cancel-btn" 
                onClick={() => !isDeleting && !deleting && setShowDeleteConfirm(false)}
                disabled={isDeleting || deleting}
              >
                取消
              </button>
              <button 
                className={`confirm-delete-btn ${(isDeleting || deleting) ? 'deleting' : ''}`}
                onClick={handleDelete}
                disabled={isDeleting || deleting}
              >
                {(isDeleting || deleting) ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
      
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