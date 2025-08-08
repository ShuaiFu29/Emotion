/* global Buffer */

// 模拟用户数据
const users = [
  {
    id: 1,
    username: 'admin',
    nickname: 'admin', // 昵称，默认为用户名
    email: 'admin@example.com',
    password: '123456', // 实际项目中应该加密存储
    avatar: null,
    signature: null
  }
]

// 生成简单的JWT token（实际项目中应使用真正的JWT库）
const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24小时过期
  }
  return Buffer.from(JSON.stringify(payload)).toString('base64')
}

// 验证token
const verifyToken = (token) => {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf8'))
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
            nickname: user.nickname,
            email: user.email,
            avatar: user.avatar,
            signature: user.signature
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
        nickname: username, // 默认昵称为用户名
        email,
        password, // 实际项目中应该加密
        avatar: null,
        signature: null
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
            nickname: newUser.nickname,
            email: newUser.email,
            avatar: newUser.avatar,
            signature: newUser.signature
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
            nickname: user.nickname,
            email: user.email,
            avatar: user.avatar,
            signature: user.signature
          }
        }
      }
    }
  },

  // 更新用户信息接口
  {
    url: '/api/auth/update-profile',
    method: 'put',
    response: ({ headers, body }) => {
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
      const userIndex = users.findIndex(u => u.id === payload.id)
      if (userIndex === -1) {
        return {
          code: 401,
          message: '用户不存在',
          data: null
        }
      }

      // 更新用户信息
       const { avatar, signature, nickname } = body
       if (avatar !== undefined) {
         users[userIndex].avatar = avatar
       }
       if (signature !== undefined) {
         users[userIndex].signature = signature
       }
       if (nickname !== undefined) {
         users[userIndex].nickname = nickname
       }
       // 注意：不允许修改username

      return {
        code: 200,
        message: '用户信息更新成功',
        data: {
          user: {
            id: users[userIndex].id,
            username: users[userIndex].username,
            nickname: users[userIndex].nickname,
            email: users[userIndex].email,
            avatar: users[userIndex].avatar,
            signature: users[userIndex].signature
          }
        }
      }
    }
  }
]