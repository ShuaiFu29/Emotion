import {
  Routes,
  Route,
  Navigate
} from 'react-router-dom'
import {
  useEffect,
  Suspense,
  lazy
} from 'react'
import useAuthStore from '@/store/authStore'
import ProtectedRoute from '@/components/ProtectedRoute'
import MainLayout from '@/components/MainLayout'

const Login = lazy(() => import('@/pages/Login'))
const Register = lazy(() => import('@/pages/Register'))
const Home = lazy(() => import('@/pages/Home'))
const Chat = lazy(() => import('@/pages/Chat'))
const Account = lazy(() => import('@/pages/Account'))
const NotFound = lazy(() => import('@/pages/NotFound'))
import Loading from '@/components/Loading'
import './App.css'

function App() {
  const { initAuth } = useAuthStore()

  useEffect(() => {
    // 初始化认证状态
    initAuth()
  }, [initAuth])

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* 公开路由 - 不需要导航栏 */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* 受保护的路由 - 包裹在MainLayout中 */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path='/' element={<Navigate to={'/home'} />} />
            <Route path='/home' element={<Home />} />
            <Route path='/chat' element={<Chat />} />
            <Route path='/account' element={<Account />} />
          </Route>
        </Route>
        <Route path="/notFound" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/notFound" replace />} />
      </Routes>
    </Suspense>
  )
}


export default App
