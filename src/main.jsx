import { createRoot } from 'react-dom/client'
import './index.css'
import 'lib-flexible'  // 移动端适配

import App from '@/App'
import {
  BrowserRouter as Router,
} from 'react-router-dom'
import { ConfigProvider } from 'react-vant'

// 导入mock数据
import '../mock/data.js'

createRoot(document.getElementById('root')).render(
  <ConfigProvider>
    <Router>
      <App />
    </Router>
  </ConfigProvider>
)
