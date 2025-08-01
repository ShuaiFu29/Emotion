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
  initAuth: () => {
    const token = Cookies.get('token')
    if (token) {
      set({ token, isAuthenticated: true })
      // 这里可以验证token有效性
      get().verifyToken()
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
      
      const data = await response.json()
      
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
    } catch (error) {
      set({
        loading: false,
        error: error.message
      })
      return { success: false, error: error.message }
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
      
      const data = await response.json()
      
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
    } catch (error) {
      set({
        loading: false,
        error: error.message
      })
      return { success: false, error: error.message }
    }
  },

  // 登出
  logout: () => {
    Cookies.remove('token')
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null
    })
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
      
      const data = await response.json()
      
      if (data.code !== 200) {
        get().logout()
        return false
      }
      
      set({ user: data.data.user, isAuthenticated: true })
      return true
    } catch {
      get().logout()
      return false
    }
  },

  // 清除错误
  clearError: () => set({ error: null })
}))

export default useAuthStore