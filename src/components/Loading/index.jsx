import { useEffect } from 'react'

// 基础Loading组件
const Loading = ({
  size = 'medium',
  color = '#4682B4',
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

  // 管理全局样式的清理
  useEffect(() => {
    if (fullScreen) {
      // 添加全局样式重置
      if (typeof document !== 'undefined' && !document.getElementById('loading-global-reset')) {
        const style = document.createElement('style')
        style.id = 'loading-global-reset'
        style.textContent = `
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: #f5f5f5 !important;
            height: 100% !important;
            width: 100% !important;
          }
          html {
            background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 50%, #f0f0f0 100%) !important;
          }
          body {
            background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 50%, #f0f0f0 100%) !important;
          }
          #root {
            background: transparent !important;
            height: 100% !important;
            width: 100% !important;
          }
        `
        document.head.appendChild(style)
      }
    }

    // 清理函数
    return () => {
      if (fullScreen) {
        const style = document.getElementById('loading-global-reset')
        // 安全地移除style元素
        if (style && style.parentNode) {
          try {
            style.parentNode.removeChild(style)
          } catch (error) {
            console.warn('Failed to remove loading style:', error)
          }
        }
        // 恢复body样式
        if (typeof document !== 'undefined') {
          document.body.style.overflow = ''
          document.body.style.background = ''
          document.documentElement.style.background = ''
        }
      }
    }
  }, [fullScreen])

  const loadingStyles = {
    fullscreen: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 50%, #f0f0f0 100%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 99999,
      margin: 0,
      padding: 0,
      boxSizing: 'border-box'
    },
    content: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px'
    },
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      padding: '20px',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px'
    },
    text: {
      margin: 0,
      fontSize: '14px',
      color: '#555',
      textAlign: 'center',
      fontWeight: '500'
    }
  }

  if (fullScreen) {
    return (
      <div style={loadingStyles.fullscreen}>
        <div style={loadingStyles.content}>
          <LoadingSpinner size={spinnerSize} color={color} type={type} />
          {text && <p style={loadingStyles.text}>{text}</p>}
        </div>
      </div>
    )
  }

  return (
    <div style={loadingStyles.container}>
      <LoadingSpinner size={spinnerSize} color={color} type={type} />
      {text && <p style={loadingStyles.text}>{text}</p>}
    </div>
  )
}

// 旋转器组件
const LoadingSpinner = ({ size, color, type }) => {
  const spinnerStyles = {
    spinner: {
      width: size,
      height: size,
      border: `3px solid ${color}30`,
      borderTop: `3px solid ${color}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    },
    dots: {
      display: 'flex',
      gap: '4px',
      alignItems: 'center'
    },
    dot: {
      width: '8px',
      height: '8px',
      backgroundColor: color,
      borderRadius: '50%',
      animation: 'bounce 1.4s ease-in-out infinite both'
    },
    pulse: {
      width: size,
      height: size,
      backgroundColor: color,
      borderRadius: '50%',
      animation: 'pulse 1.5s ease-in-out infinite'
    }
  }

  // 使用useEffect管理动画样式的生命周期
  useEffect(() => {
    // 安全地添加CSS动画到head
    if (typeof document !== 'undefined' && !document.getElementById('loading-animations')) {
      try {
        const style = document.createElement('style')
        style.id = 'loading-animations'
        style.textContent = `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.7; }
          }
        `
        if (document.head) {
          document.head.appendChild(style)
        }
      } catch (error) {
        console.warn('Failed to add loading animations:', error)
      }
    }

    // 清理函数
    return () => {
      const style = document.getElementById('loading-animations')
      if (style && style.parentNode) {
        try {
          style.parentNode.removeChild(style)
        } catch (error) {
          console.warn('Failed to remove loading animations:', error)
        }
      }
    }
  }, [])

  if (type === 'dots') {
    return (
      <div style={spinnerStyles.dots}>
        <div style={{...spinnerStyles.dot, animationDelay: '0s'}}></div>
        <div style={{...spinnerStyles.dot, animationDelay: '0.16s'}}></div>
        <div style={{...spinnerStyles.dot, animationDelay: '0.32s'}}></div>
      </div>
    )
  }

  if (type === 'pulse') {
    return (
      <div style={spinnerStyles.pulse}></div>
    )
  }

  return (
    <div style={spinnerStyles.spinner}></div>
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
  const skeletonStyle = {
    width,
    height,
    borderRadius,
    backgroundColor: '#f0f0f0',
    background: animated ? 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)' : '#f0f0f0',
    backgroundSize: animated ? '200% 100%' : 'auto',
    animation: animated ? 'skeleton-loading 1.5s ease-in-out infinite' : 'none'
  }

  // 使用useEffect管理骨架屏动画样式的生命周期
  useEffect(() => {
    // 安全地添加骨架屏动画
    if (typeof document !== 'undefined' && !document.getElementById('skeleton-animations')) {
      try {
        const style = document.createElement('style')
        style.id = 'skeleton-animations'
        style.textContent = `
          @keyframes skeleton-loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `
        if (document.head) {
          document.head.appendChild(style)
        }
      } catch (error) {
        console.warn('Failed to add skeleton animations:', error)
      }
    }

    // 清理函数
    return () => {
      const style = document.getElementById('skeleton-animations')
      if (style && style.parentNode) {
        try {
          style.parentNode.removeChild(style)
        } catch (error) {
          console.warn('Failed to remove skeleton animations:', error)
        }
      }
    }
  }, [])

  return (
    <div
      style={skeletonStyle}
      className={className}
    />
  )
}

// 文本骨架屏
export const SkeletonText = ({ lines = 3, width = '100%' }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '60%' : width}
          height="16px"
        />
      ))}
    </div>
  )
}

// 卡片骨架屏
export const SkeletonCard = () => {
  return (
    <div style={{ padding: '16px', border: '1px solid #f0f0f0', borderRadius: '8px' }}>
      <Skeleton width="100%" height="200px" borderRadius="8px" />
      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Skeleton width="80%" height="20px" />
        <SkeletonText lines={2} />
      </div>
    </div>
  )
}

// 用户信息骨架屏
export const SkeletonUser = () => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
      <Skeleton width="60px" height="60px" borderRadius="50%" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Skeleton width="120px" height="18px" />
        <Skeleton width="200px" height="14px" />
      </div>
    </div>
  )
}

// 列表骨架屏
export const SkeletonList = ({ count = 5 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px' }}>
          <Skeleton width="40px" height="40px" borderRadius="50%" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Skeleton width="60%" height="16px" />
            <Skeleton width="80%" height="14px" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default Loading