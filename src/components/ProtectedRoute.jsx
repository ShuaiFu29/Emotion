import {
  useEffect,
  useState
} from 'react'
import {
  Navigate,
  useLocation
} from 'react-router-dom'
import useAuthStore from '@/store/authStore'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, token, verifyToken, initAuth } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    const checkAuth = async () => {
      // 如果没有token，直接结束加载
      if (!token) {
        initAuth()
        setIsLoading(false)
        return
      }

      // 如果有token但未认证，验证token
      if (token && !isAuthenticated) {
        await verifyToken()
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [token, isAuthenticated, verifyToken, initAuth])

  // 显示加载状态
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>验证中...</p>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #87CEEB 0%, #4682B4 100%);
            color: white;
          }
          
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          p {
            margin: 0;
            font-size: 16px;
          }
        `}</style>
      </div>
    )
  }

  // 如果未认证，重定向到登录页面，并保存当前路径
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 如果已认证，渲染子组件
  return children
}

export default ProtectedRoute