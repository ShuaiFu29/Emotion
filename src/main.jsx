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

// 导入图片工具函数并清理Blob URL数据
import { cleanupBlobUrls } from '@/utils/imageUtils'

// 应用启动时清理localStorage中的Blob URL数据
cleanupBlobUrls()

createRoot(document.getElementById('root')).render(
  <ConfigProvider>
    <Router>
      <App />
    </Router>
  </ConfigProvider>
)
