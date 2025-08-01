import './index.css'

// 基础Loading组件
const Loading = ({
  size = 'medium',
  color = '#0284c7',
  text = '加载中...',
  type = 'spinner',
  fullScreen = false
}) => {
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 60
  }

  const spinnerSize = sizeMap[size] || sizeMap.medium

  if (fullScreen) {
    return (
      <div className="loading-fullscreen">
        <div className="loading-content">
          <LoadingSpinner size={spinnerSize} color={color} type={type} />
          {text && <p className="loading-text">{text}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="loading-container">
      <LoadingSpinner size={spinnerSize} color={color} type={type} />
      {text && <p className="loading-text">{text}</p>}
    </div>
  )
}

// 旋转器组件
const LoadingSpinner = ({ size, color, type }) => {
  const style = {
    width: size,
    height: size,
    borderColor: `${color}30`,
    borderTopColor: color
  }

  if (type === 'dots') {
    return (
      <div className="loading-dots" style={{ color }}>
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
      </div>
    )
  }

  if (type === 'pulse') {
    return (
      <div className="loading-pulse" style={{ backgroundColor: color, width: size, height: size }}>
      </div>
    )
  }

  return (
    <div className="loading-spinner" style={style}></div>
  )
}

// 骨架屏组件
export const Skeleton = ({
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  className = '',
  animated = true
}) => {
  const style = {
    width,
    height,
    borderRadius
  }

  return (
    <div
      className={`skeleton ${animated ? 'skeleton-animated' : ''} ${className}`}
      style={style}
    />
  )
}

// 文本骨架屏
export const SkeletonText = ({ lines = 3, width = '100%' }) => {
  return (
    <div className="skeleton-text">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '60%' : width}
          height="16px"
          className="skeleton-text-line"
        />
      ))}
    </div>
  )
}

// 卡片骨架屏
export const SkeletonCard = () => {
  return (
    <div className="skeleton-card">
      <Skeleton width="100%" height="200px" borderRadius="8px" className="skeleton-card-image" />
      <div className="skeleton-card-content">
        <Skeleton width="80%" height="20px" className="skeleton-card-title" />
        <SkeletonText lines={2} />
      </div>
    </div>
  )
}

// 用户信息骨架屏
export const SkeletonUser = () => {
  return (
    <div className="skeleton-user">
      <Skeleton width="60px" height="60px" borderRadius="50%" className="skeleton-user-avatar" />
      <div className="skeleton-user-info">
        <Skeleton width="120px" height="18px" className="skeleton-user-name" />
        <Skeleton width="200px" height="14px" className="skeleton-user-desc" />
      </div>
    </div>
  )
}

// 列表骨架屏
export const SkeletonList = ({ count = 5 }) => {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-list-item">
          <Skeleton width="40px" height="40px" borderRadius="50%" className="skeleton-list-avatar" />
          <div className="skeleton-list-content">
            <Skeleton width="60%" height="16px" className="skeleton-list-title" />
            <Skeleton width="80%" height="14px" className="skeleton-list-desc" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default Loading