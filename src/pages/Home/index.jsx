import { Empty } from 'react-vant'
import { HomeO } from '@react-vant/icons'
import './index.less'

const Home = () => {
  return (
    <div className="home-page">
      <div className="home-header">
        <h1>首页</h1>
      </div>

      <div className="home-content">
        <Empty
          image={<HomeO size={64} />}
          description="首页内容开发中..."
        />
      </div>
    </div>
  )
}

export default Home