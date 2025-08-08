import { create } from 'zustand'
import Cookies from 'js-cookie'

const useAuthStore = create((set, get) => ({
  // 状态
  user: null,
  token: Cookies.get('token') || null,
  isAuthenticated: false,
  loading: false,
  error: null,

  // 初始化认证状态
  initAuth: async () => {
    const token = Cookies.get('token')
    if (token) {
      set({ token, loading: true })
      // 验证token有效性
      const isValid = await get().verifyToken()
      if (!isValid) {
        // 如果token无效，清除状态
        set({ token: null, isAuthenticated: false, loading: false })
        localStorage.removeItem('currentUser')
      } else {
        set({ loading: false })
      }
    } else {
      // 没有token，确保状态为未认证
      set({ token: null, isAuthenticated: false, loading: false })
      localStorage.removeItem('currentUser')
    }
  },

  // 登录
  login: async (credentials) => {
    set({ loading: true, error: null })
    try {
      // console.log('开始登录，凭据：', { username: credentials.username, hasPassword: !!credentials.password })
      
      // 模拟延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 从localStorage获取已注册的用户
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]')
      // console.log('已注册用户数量：', registeredUsers.length)
      
      // 查找匹配的用户（支持用户名或邮箱登录）
      const user = registeredUsers.find(u => 
        (u.username === credentials.username || u.email === credentials.username || 
         u.username === credentials.email || u.email === credentials.email) && 
        u.password === credentials.password
      )
      
      if (!user) {
        // console.log('登录失败：用户未找到或密码错误')
        throw new Error('用户名或密码错误')
      }
      
      // console.log('登录成功，用户：', user.username)
      
      // 生成简单的token
      const token = btoa(JSON.stringify({ userId: user.id, timestamp: Date.now() }))
      
      // 存储token到cookie
      Cookies.set('token', token, { expires: 7 }) // 7天过期
      
      // 存储用户信息到localStorage
      localStorage.setItem('currentUser', JSON.stringify(user))
      
      set({
        user,
        token,
        isAuthenticated: true,
        loading: false,
        error: null
      })
      
      return { success: true }
    } catch (error) {
      const errorMessage = error.message || '登录失败'
      set({
        loading: false,
        error: errorMessage
      })
      return { success: false, error: errorMessage }
    }
  },

  // 注册
  register: async (userData) => {
    set({ loading: true, error: null })
    try {
      // console.log('开始注册，用户数据：', { username: userData.username, email: userData.email })
      
      // 模拟延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 从localStorage获取已注册的用户
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]')
      // console.log('当前已注册用户数量：', registeredUsers.length)
      
      // 检查用户名和邮箱是否已存在
      const existingUser = registeredUsers.find(u => 
        u.username === userData.username || u.email === userData.email
      )
      
      if (existingUser) {
        // console.log('注册失败：用户名或邮箱已存在')
        throw new Error('用户名或邮箱已存在')
      }
      
      // console.log('用户名和邮箱检查通过，创建新用户')
      
      // 创建新用户
      const newUser = {
        id: Date.now().toString(),
        username: userData.username,
        email: userData.email,
        password: userData.password,
        nickname: userData.nickname || userData.username,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`,
        signature: '这个人很懒，什么都没留下~',
        createdAt: new Date().toISOString()
      }
      
      // 保存到localStorage
      registeredUsers.push(newUser)
      localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers))
      
      // 生成简单的token
      const token = btoa(JSON.stringify({ userId: newUser.id, timestamp: Date.now() }))
      
      // 存储token到cookie
      Cookies.set('token', token, { expires: 7 })
      
      // 存储用户信息到localStorage
      localStorage.setItem('currentUser', JSON.stringify(newUser))
      
      set({
        user: newUser,
        token,
        isAuthenticated: true,
        loading: false,
        error: null
      })
      
      return { success: true }
    } catch (error) {
      const errorMessage = error.message || '注册失败'
      set({
        loading: false,
        error: errorMessage
      })
      return { success: false, error: errorMessage }
    }
  },

  // 登出
  logout: () => {
    // 清除cookie中的token
    Cookies.remove('token')
    
    // 清除localStorage中的认证数据，但保留用户数据如日记等
    const authKeys = ['token', 'user', 'authData', 'auth_token', 'user_info']
    authKeys.forEach(key => {
      localStorage.removeItem(key)
    })
    
    // 重置状态
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null
    })
  },

  // 强制清除所有认证数据（用于调试）
  forceLogout: () => {
    // 清除认证相关的存储，但保留用户数据
    Cookies.remove('token')
    
    // 只清除认证相关的localStorage项，保留日记等用户数据
    const authKeys = ['token', 'user', 'authData', 'auth_token', 'user_info']
    authKeys.forEach(key => {
      localStorage.removeItem(key)
    })
    
    // 清除所有sessionStorage（通常只存临时数据）
    sessionStorage.clear()
    
    // 重置状态
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null
    })
    
    // 刷新页面确保状态完全重置
    window.location.reload()
  },

  // 验证token
  verifyToken: async () => {
    const { token } = get()
    if (!token) return false
    
    try {
      // 解析token
      const tokenData = JSON.parse(atob(token))
      
      // 检查token是否过期（7天）
      const tokenAge = Date.now() - tokenData.timestamp
      const maxAge = 7 * 24 * 60 * 60 * 1000 // 7天
      
      if (tokenAge > maxAge) {
        console.warn('Token已过期')
        get().logout()
        return false
      }
      
      // 从localStorage获取用户信息
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null')
      
      if (!currentUser || currentUser.id !== tokenData.userId) {
        console.warn('用户信息不匹配')
        get().logout()
        return false
      }
      
      set({ user: currentUser, isAuthenticated: true })
      return true
    } catch (error) {
      console.warn('Token验证异常:', error.message)
      get().logout()
      return false
    }
  },

  // 更新用户信息
  updateUserInfo: async (userInfo) => {
    set({ loading: true, error: null })
    try {
      const { user, token } = get()
      if (!token || !user) {
        throw new Error('未登录，无法更新用户信息')
      }
      
      // 模拟延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 更新用户信息
      const updatedUser = { ...user, ...userInfo }
      
      // 更新localStorage中的当前用户信息
      localStorage.setItem('currentUser', JSON.stringify(updatedUser))
      
      // 更新注册用户列表中的用户信息
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]')
      const userIndex = registeredUsers.findIndex(u => u.id === user.id)
      if (userIndex !== -1) {
        registeredUsers[userIndex] = updatedUser
        localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers))
      }
      
      set({
        user: updatedUser,
        loading: false,
        error: null
      })
      
      return { success: true }
    } catch (error) {
      const errorMessage = error.message || '更新用户信息失败'
      set({
        loading: false,
        error: errorMessage
      })
      return { success: false, error: errorMessage }
    }
  },

  // 清除错误
  clearError: () => set({ error: null })
}))

export { useAuthStore }
export default useAuthStore