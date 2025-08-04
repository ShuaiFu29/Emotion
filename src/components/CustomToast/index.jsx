import { useState, useEffect } from 'react'
import './index.less'

// 自定义Toast组件
const CustomToast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => {
        onClose && onClose()
      }, 300) // 等待动画完成
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅'
      case 'error':
      case 'fail':
        return '❌'
      case 'warning':
        return '⚠️'
      case 'loading':
        return '⏳'
      default:
        return 'ℹ️'
    }
  }

  const getClassName = () => {
    return `custom-toast custom-toast--${type} ${visible ? 'custom-toast--visible' : 'custom-toast--hidden'}`
  }

  return (
    <div className={getClassName()}>
      <span className="custom-toast__icon">{getIcon()}</span>
      <span className="custom-toast__message">{message}</span>
    </div>
  )
}

export default CustomToast