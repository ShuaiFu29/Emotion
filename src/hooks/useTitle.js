import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * useTitle - 自动设置页面标题的 Hook
 * @param {string} customTitle - 可选，自定义标题，默认“情绪碎记”
 */
function useTitle(customTitle = '情绪碎记') {
  const location = useLocation()

  useEffect(() => {
    document.title = customTitle || '情绪碎记'
  }, [location.pathname, customTitle])
}

export default useTitle 
