import Mock from 'mockjs'
import authMocks from './auth.js'

// 注册认证相关的mock接口
authMocks.forEach(mock => {
  Mock.mock(mock.url, mock.method, mock.response)
})

// 其他mock数据可以在这里添加
export default Mock