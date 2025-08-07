import { useState, useEffect, useRef } from 'react'
import { Card, Loading, Empty } from 'react-vant'
import { useNavigate } from 'react-router-dom'
import './index.css'

const Waterfall = ({ data = [], loading = false, hasMore = true, onLoadMore }) => {
  const navigate = useNavigate()
  const [columns, setColumns] = useState(2)
  const [columnData, setColumnData] = useState([[], []])
  const loadMoreRef = useRef(null)

  // 响应式列数调整
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth
      const newColumns = width < 768 ? 2 : 2
      setColumns(newColumns)
      // 重新分配数据到列
      redistributeData(data, newColumns)
    }

    updateColumns()
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [data])

  // 瀑布流数据分配算法
  const redistributeData = (items, cols) => {
    const newColumnData = Array(cols).fill().map(() => [])
    
    items.forEach((item, index) => {
      // 使用简单的轮询分配，确保每列都有内容
      const columnIndex = index % cols
      newColumnData[columnIndex].push(item)
    })
    
    setColumnData(newColumnData)
  }

  // 当数据变化时重新分配
  useEffect(() => {
    redistributeData(data, columns)
  }, [data, columns])

  // 移除复杂的IntersectionObserver，简化实现

  // 无限滚动加载更多
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || loading) return

    const loadMoreObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && onLoadMore) {
          onLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    loadMoreObserver.observe(loadMoreRef.current)

    return () => {
      loadMoreObserver.disconnect()
    }
  }, [hasMore, loading, onLoadMore])

  // 移除复杂的高度计算逻辑

  // 处理卡片点击
  const handleCardClick = (item) => {
    navigate(`/detail/${item.id}`)
  }

  // 计算卡片动态高度
  const calculateCardHeight = (item) => {
    const baseHeight = 220
    const contentLength = (item.content || '').length
    const hasImages = item.images && item.images.length > 0
    
    // 根据内容长度调整高度
    let heightVariation = Math.floor(contentLength / 40) * 25
    
    // 如果有图片，根据图片数量增加高度
    if (hasImages) {
      const imageCount = item.images.length
      if (imageCount === 1) {
        heightVariation += 160 // 单张图片增加更多高度
      } else if (imageCount === 2) {
        heightVariation += 140 // 两张图片
      } else {
        heightVariation += 140 // 多张图片
      }
    }
    
    // 添加随机因子创造瀑布流效果
    const randomFactor = Math.floor(Math.random() * 80) - 40
    
    return Math.max(baseHeight + heightVariation + randomFactor, 200)
  }

  // 处理图片加载错误
  const handleImageError = (e) => {
    e.target.style.display = 'none'
  }

  // 渲染图片预览区域
  const renderImagePreview = (images) => {
    if (!images || images.length === 0) return null
    
    const imageCount = images.length
    
    if (imageCount === 1) {
      // 单张图片
      return (
        <div className="card-image-preview single">
          <img
            src={images[0]}
            alt="日记图片"
            loading="lazy"
            onError={handleImageError}
          />
          <div className="image-overlay">
            <span className="preview-icon">🔍</span>
          </div>
        </div>
      )
    } else if (imageCount === 2) {
      // 两张图片
      return (
        <div className="card-image-preview double">
          {images.slice(0, 2).map((image, index) => (
            <div key={index} className="image-item">
              <img
                src={image}
                alt={`日记图片${index + 1}`}
                loading="lazy"
                onError={handleImageError}
              />
            </div>
          ))}
          <div className="image-count-badge">
            <span>{imageCount}</span>
          </div>
        </div>
      )
    } else {
      // 多张图片（3张或以上）
      return (
        <div className="card-image-preview multiple">
          <div className="main-image">
            <img
              src={images[0]}
              alt="主图片"
              loading="lazy"
              onError={handleImageError}
            />
          </div>
          <div className="sub-images">
            {images.slice(1, 3).map((image, index) => (
              <div key={index} className="sub-image">
                <img
                  src={image}
                  alt={`图片${index + 2}`}
                  loading="lazy"
                  onError={handleImageError}
                />
              </div>
            ))}
          </div>
          <div className="image-count-badge">
            <span>{imageCount}</span>
          </div>
        </div>
      )
    }
  }

  // 渲染单个卡片
  const renderCard = (item) => {
    const cardHeight = calculateCardHeight(item)
    
    return (
      <div
        key={item.id}
        className="waterfall-item"
        onClick={() => handleCardClick(item)}
      >
        <Card 
          className="diary-card visible"
          style={{ minHeight: `${cardHeight}px` }}
        >
          {/* 图片预览区域 */}
          {renderImagePreview(item.images)}
          
          {/* 内容区域 */}
          <div className="card-content">
            <h3 className="card-title">{item.title}</h3>
            <p className="card-description">
              {item.content && item.content.length > 100 
                ? `${item.content.substring(0, 100)}...` 
                : item.content}
            </p>
            
            {/* 标签 */}
            {item.tags && item.tags.length > 0 && (
              <div className="card-tags">
                {item.tags.slice(0, 3).map((tag, tagIndex) => (
                  <span key={`${item.id}-${tag}-${tagIndex}`} className="tag">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            
            {/* 底部信息 */}
            <div className="card-footer">
              <span className="card-date">{item.date || new Date(item.createdAt).toLocaleDateString()}</span>
              <div className="card-stats">
                <span className="likes">💙 {item.likes || 0}</span>
                <span className="views">👁️ {item.views || 0}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // 渲染列
  const renderColumn = (columnItems, columnIndex) => {
    return (
      <div key={columnIndex} className="waterfall-column">
        {columnItems.map((item) => renderCard(item))}
      </div>
    )
  }

  return (
    <div className="waterfall-container">
      {data.length === 0 && !loading ? (
        <Empty description="暂无日记" />
      ) : (
        <div className="waterfall-grid">
          {columnData.map((columnItems, columnIndex) => 
            renderColumn(columnItems, columnIndex)
          )}
        </div>
      )}
      
      {/* 加载更多触发器 */}
      <div ref={loadMoreRef} className="load-more-trigger">
        {loading && (
          <div className="loading-more">
            <Loading size="24px" color="#2196f3" />加载中...
          </div>
        )}
        {!hasMore && data.length > 0 && (
          <div className="no-more-content">没有更多了</div>
        )}
      </div>
    </div>
  )
}

export default Waterfall