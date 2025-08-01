import {
  useEffect,
  useState
} from 'react'
import {
  Tabbar,
} from 'react-vant'
import {
  HomeO,
  ChatO,
  UserO
} from '@react-vant/icons'
import {
  Outlet,
  useNavigate,
  useLocation
} from 'react-router-dom'

//菜单栏配置
const tabs = [
  { icon: <HomeO />, title: '首页', path: '/home' },
  { icon: <ChatO />, title: '治愈', path: '/chat' },
  { icon: <UserO />, title: '我的', path: '/account' }
]

const MainLayout = () => {
  const [active, setActive] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => {
    // es6 的使用
    console.log(location.pathname)
    const index = tabs.findIndex(tab =>
      location.pathname.startsWith(tab.path)
    )
    setActive(index)
  }, [location.pathname])
  return (
    <div
      className='flex flex-col h-screen'
      style={{ paddingBottom: '50px' }}
    >
      <div className='flex-1'>
        <Outlet />
      </div>
      {/* tabbar */}
      <Tabbar value={active} onChange={
        (key) => {
          setActive(key)
          navigate(tabs[key].path)
        }
      }>
        {tabs.map((tab, index) => (
          <Tabbar.Item
            key={index}
            icon={tab.icon}
          >
            {tab.title}
          </Tabbar.Item>
        ))}
      </Tabbar>
    </div>
  )
}

export default MainLayout