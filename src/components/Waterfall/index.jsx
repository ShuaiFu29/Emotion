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
  }, [])

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

  // 渲染单个卡片
  const renderCard = (item) => {
    return (
      <div
        key={item.id}
        className="waterfall-item"
        onClick={() => handleCardClick(item)}
      >
        <Card className="diary-card visible">
          {/* 图片区域 */}
          {item.image && (
            <div className="card-image">
              <img
                src={item.image}
                alt={item.title}
                loading="lazy"
              />
            </div>
          )}
          
          {/* 内容区域 */}
          <div className="card-content">
            <h3 className="card-title">{item.title}</h3>
            <p className="card-description">{item.content}</p>
            
            {/* 标签 */}
            {item.tags && item.tags.length > 0 && (
              <div className="card-tags">
                {item.tags.slice(0, 3).map((tag, tagIndex) => (
                  <span key={tagIndex} className="tag">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            
            {/* 底部信息 */}
            <div className="card-footer">
              <span className="card-date">{item.date}</span>
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