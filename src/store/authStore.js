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
      } else {
        set({ loading: false })
      }
    } else {
      // 没有token，确保状态为未认证
      set({ token: null, isAuthenticated: false, loading: false })
    }
  },

  // 登录
  login: async (credentials) => {
    set({ loading: true, error: null })
    try {
      // 模拟API调用
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })
      
      // 检查网络错误
      if (!response.ok) {
        throw new Error(`网络错误: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // 检查业务错误
      if (data.code !== 200) {
        throw new Error(data.message || '登录失败')
      }
      
      const { token, user } = data.data
      
      // 存储token到cookie
      Cookies.set('token', token, { expires: 7 }) // 7天过期
      
      set({
        user,
        token,
        isAuthenticated: true,
        loading: false,
        error: null
      })
      
      return { success: true }
    } catch (networkError) {
      const errorMessage = networkError.message || '登录失败，请检查网络连接'
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })
      
      // 检查网络错误
      if (!response.ok) {
        throw new Error(`网络错误: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // 检查业务错误
      if (data.code !== 200) {
        throw new Error(data.message || '注册失败')
      }
      
      const { token, user } = data.data
      
      // 存储token到cookie
      Cookies.set('token', token, { expires: 7 })
      
      set({
        user,
        token,
        isAuthenticated: true,
        loading: false,
        error: null
      })
      
      return { success: true }
    } catch (networkError) {
      const errorMessage = networkError.message || '注册失败，请检查网络连接'
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
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      // 检查网络错误
      if (!response.ok) {
        console.warn(`Token验证网络错误: ${response.status} ${response.statusText}`)
        get().logout()
        return false
      }
      
      const data = await response.json()
      
      // 检查业务错误
      if (data.code !== 200) {
        console.warn('Token验证失败:', data.message)
        get().logout()
        return false
      }
      
      set({ user: data.data.user, isAuthenticated: true })
      return true
    } catch (networkError) {
      console.warn('Token验证异常:', networkError.message)
      get().logout()
      return false
    }
  },

  // 更新用户信息
  updateUserInfo: async (userInfo) => {
    set({ loading: true, error: null })
    try {
      const { token } = get()
      if (!token) {
        throw new Error('未登录，无法更新用户信息')
      }
      
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userInfo),
      })
      
      // 检查网络错误
      if (!response.ok) {
        throw new Error(`网络错误: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // 检查业务错误
      if (data.code !== 200) {
        throw new Error(data.message || '更新用户信息失败')
      }
      
      // 更新本地用户信息 - 使用后端返回的最新数据
      set({
        user: data.data.user, // 使用后端返回的完整用户数据
        loading: false,
        error: null
      })
      
      return { success: true }
    } catch (networkError) {
      const errorMessage = networkError.message || '更新用户信息失败，请检查网络连接'
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