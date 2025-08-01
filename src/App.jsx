import { useEffect } from 'react'
import {
  Routes,
  Route,
  Navigate
} from 'react-router-dom'
import {
  Suspense
} from 'react'
import useAuthStore from '@/store/authStore'
import ProtectedRoute from '@/components/ProtectedRoute'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Home from '@/pages/Home'
import NotFound from '@/pages/NotFound'
import './App.css'

function App() {
  const { initAuth } = useAuthStore()

  useEffect(() => {
    // 初始化认证状态
    initAuth()
  }, [initAuth])

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        {/* 公开路由 */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 受保护的路由 */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* 默认重定向到home */}
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* 404页面 */}
        <Route path="/notFound" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/notFound" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
