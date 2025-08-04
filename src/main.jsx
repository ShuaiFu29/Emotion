import { createRoot } from 'react-dom/client'
import './index.css'
import 'lib-flexible'  // 移动端适配
import '@/components/CustomToast/index.less'  // Toast样式
import App from '@/App'
import {
  BrowserRouter as Router,
} from 'react-router-dom'

// 导入mock数据
import '../mock/data.js'

createRoot(document.getElementById('root')).render(
  <Router>
    <App />
  </Router>
)
