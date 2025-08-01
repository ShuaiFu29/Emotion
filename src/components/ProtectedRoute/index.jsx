import {
  useEffect,
  useState
} from 'react'
import {
  Navigate,
  useLocation,
  Outlet
} from 'react-router-dom'
import useAuthStore from '@/store/authStore'

const ProtectedRoute = () => {
  const { isAuthenticated, initAuth } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    const checkAuth = async () => {
      // 初始化认证状态（包括验证token）
      await initAuth()
      setIsLoading(false)
    }

    checkAuth()
  }, [initAuth])

  // 显示加载状态
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>验证中...</p>
        <style>{`
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
  return <Outlet />
}

export default ProtectedRoute