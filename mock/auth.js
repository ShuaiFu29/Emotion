// 模拟用户数据
const users = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    password: '123456' // 实际项目中应该加密存储
  }
]

// 生成简单的JWT token（实际项目中应使用真正的JWT库）
const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7天过期
  }
  return btoa(JSON.stringify(payload))
}

// 验证token
const verifyToken = (token) => {
  try {
    const payload = JSON.parse(atob(token))
    if (payload.exp < Date.now()) {
      return null // token过期
    }
    return payload
  } catch {
    return null // token无效
  }
}

export default [
  // 登录接口
  {
    url: '/api/auth/login',
    method: 'post',
    response: ({ body }) => {
      const { email, password } = body
      
      // 查找用户
      const user = users.find(u => u.email === email && u.password === password)
      
      if (!user) {
        return {
          code: 401,
          message: '邮箱或密码错误',
          data: null
        }
      }
      
      // 生成token
      const token = generateToken(user)
      
      return {
        code: 200,
        message: '登录成功',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          }
        }
      }
    }
  },
  
  // 注册接口
  {
    url: '/api/auth/register',
    method: 'post',
    response: ({ body }) => {
      const { username, email, password } = body
      
      // 检查邮箱是否已存在
      const existingUser = users.find(u => u.email === email)
      if (existingUser) {
        return {
          code: 400,
          message: '该邮箱已被注册',
          data: null
        }
      }
      
      // 创建新用户
      const newUser = {
        id: users.length + 1,
        username,
        email,
        password // 实际项目中应该加密
      }
      
      users.push(newUser)
      
      // 生成token
      const token = generateToken(newUser)
      
      return {
        code: 200,
        message: '注册成功',
        data: {
          token,
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email
          }
        }
      }
    }
  },
  
  // 验证token接口
  {
    url: '/api/auth/verify',
    method: 'get',
    response: ({ headers }) => {
      const authorization = headers.authorization
      if (!authorization || !authorization.startsWith('Bearer ')) {
        return {
          code: 401,
          message: '未提供有效的认证信息',
          data: null
        }
      }
      
      const token = authorization.substring(7)
      const payload = verifyToken(token)
      
      if (!payload) {
        return {
          code: 401,
          message: 'Token无效或已过期',
          data: null
        }
      }
      
      // 查找用户
      const user = users.find(u => u.id === payload.id)
      if (!user) {
        return {
          code: 401,
          message: '用户不存在',
          data: null
        }
      }
      
      return {
        code: 200,
        message: 'Token验证成功',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          }
        }
      }
    }
  }
]