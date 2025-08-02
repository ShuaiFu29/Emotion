// Store统一导出文件
import useAuthStore from './authStore'
import useWeatherStore from './weatherStore'
import useDiaryStore from './diaryStore'

// 导出所有store
export {
  useAuthStore,
  useWeatherStore,
  useDiaryStore
}

// 默认导出（可选）
export default {
  useAuthStore,
  useWeatherStore,
  useDiaryStore
}

// Store初始化函数
export const initStores = () => {
  // 初始化认证store
  const authStore = useAuthStore.getState()
  authStore.initAuth()
}

// Store重置函数（用于登出等场景）
export const resetStores = () => {
  const weatherStore = useWeatherStore.getState()
  const diaryStore = useDiaryStore.getState()
  
  // 重置非持久化的store
  weatherStore.reset?.()
  diaryStore.reset?.()
  
  // 注意：authStore通常不需要重置，因为它包含用户偏好
}