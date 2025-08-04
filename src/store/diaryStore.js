import { create } from 'zustand'

const useDiaryStore = create((set, get) => ({
  // 状态
  diaries: [],
  currentDiary: null,
  loading: false,
  saving: false,
  deleting: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
    hasMore: true
  },
  filters: {
    keyword: '',
    dateRange: null,
    mood: null,
    weather: null
  },

  // 获取日记列表
  getDiaries: async (options = {}) => {
    const { page = 1, pageSize = 10, refresh = false } = options
    
    if (refresh) {
      set({ diaries: [], pagination: { ...get().pagination, page: 1, hasMore: true } })
    }
    
    set({ loading: true, error: null })
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // 模拟日记数据
      const mockDiaries = [
        {
          id: '1',
          title: '美好的一天',
          content: '今天天气很好，心情也很棒。去公园散步，看到了很多美丽的花朵。',
          mood: 'happy',
          weather: '晴',
          location: '北京',
          images: [],
          tags: ['散步', '公园'],
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          title: '工作日常',
          content: '今天完成了一个重要的项目，虽然有些累，但是很有成就感。',
          mood: 'satisfied',
          weather: '多云',
          location: '上海',
          images: [],
          tags: ['工作', '项目'],
          createdAt: '2024-01-14T16:45:00Z',
          updatedAt: '2024-01-14T16:45:00Z'
        },
        {
          id: '3',
          title: '雨天思考',
          content: '下雨的日子总是让人想起很多往事，有些感伤，但也有温暖的回忆。',
          mood: 'thoughtful',
          weather: '雨',
          location: '广州',
          images: [],
          tags: ['思考', '回忆'],
          createdAt: '2024-01-13T14:20:00Z',
          updatedAt: '2024-01-13T14:20:00Z'
        }
      ]
      
      // 应用过滤器
      const { filters } = get()
      let filteredDiaries = mockDiaries
      
      if (filters.keyword) {
        filteredDiaries = filteredDiaries.filter(diary => 
          diary.title.includes(filters.keyword) || 
          diary.content.includes(filters.keyword) ||
          diary.tags.some(tag => tag.includes(filters.keyword))
        )
      }
      
      if (filters.mood) {
        filteredDiaries = filteredDiaries.filter(diary => diary.mood === filters.mood)
      }
      
      if (filters.weather) {
        filteredDiaries = filteredDiaries.filter(diary => diary.weather === filters.weather)
      }
      
      // 分页处理
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize
      const paginatedDiaries = filteredDiaries.slice(startIndex, endIndex)
      
      const currentDiaries = refresh ? paginatedDiaries : [...get().diaries, ...paginatedDiaries]
      
      set({
        diaries: currentDiaries,
        loading: false,
        pagination: {
          page,
          pageSize,
          total: filteredDiaries.length,
          hasMore: endIndex < filteredDiaries.length
        }
      })
      
      return { success: true, data: paginatedDiaries }
    } catch (error) {
      const errorMessage = error.message || '获取日记列表失败'
      set({
        loading: false,
        error: errorMessage
      })
      return { success: false, error: errorMessage }
    }
  },

  // 获取单个日记详情
  getDiary: async (id) => {
    set({ loading: true, error: null })
    
    try {
      // 先从本地查找
      const existingDiary = get().diaries.find(diary => diary.id === id)
      if (existingDiary) {
        set({
          currentDiary: existingDiary,
          loading: false
        })
        return { success: true, data: existingDiary }
      }
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 模拟获取日记详情
      const mockDiary = {
        id,
        title: '日记详情',
        content: '这是一篇详细的日记内容...',
        mood: 'happy',
        weather: '晴',
        location: '北京',
        images: [],
        tags: ['标签1', '标签2'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      set({
        currentDiary: mockDiary,
        loading: false
      })
      
      return { success: true, data: mockDiary }
    } catch (error) {
      const errorMessage = error.message || '获取日记详情失败'
      set({
        loading: false,
        error: errorMessage
      })
      return { success: false, error: errorMessage }
    }
  },

  // 创建日记
  createDiary: async (diaryData) => {
    set({ saving: true, error: null })
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newDiary = {
        id: Date.now().toString(),
        ...diaryData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      // 添加到列表开头
      const currentDiaries = get().diaries
      set({
        diaries: [newDiary, ...currentDiaries],
        currentDiary: newDiary,
        saving: false,
        pagination: {
          ...get().pagination,
          total: get().pagination.total + 1
        }
      })
      
      return { success: true, data: newDiary }
    } catch (error) {
      const errorMessage = error.message || '创建日记失败'
      set({
        saving: false,
        error: errorMessage
      })
      return { success: false, error: errorMessage }
    }
  },

  // 更新日记
  updateDiary: async (id, diaryData) => {
    set({ saving: true, error: null })
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const updatedDiary = {
        ...diaryData,
        id,
        updatedAt: new Date().toISOString()
      }
      
      // 更新列表中的日记
      const currentDiaries = get().diaries
      const updatedDiaries = currentDiaries.map(diary => 
        diary.id === id ? { ...diary, ...updatedDiary } : diary
      )
      
      set({
        diaries: updatedDiaries,
        currentDiary: updatedDiary,
        saving: false
      })
      
      return { success: true, data: updatedDiary }
    } catch (error) {
      const errorMessage = error.message || '更新日记失败'
      set({
        saving: false,
        error: errorMessage
      })
      return { success: false, error: errorMessage }
    }
  },

  // 删除日记
  deleteDiary: async (id) => {
    set({ deleting: true, error: null })
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 从列表中移除
      const currentDiaries = get().diaries
      const filteredDiaries = currentDiaries.filter(diary => diary.id !== id)
      
      set({
        diaries: filteredDiaries,
        currentDiary: get().currentDiary?.id === id ? null : get().currentDiary,
        deleting: false,
        pagination: {
          ...get().pagination,
          total: get().pagination.total - 1
        }
      })
      
      return { success: true }
    } catch (error) {
      const errorMessage = error.message || '删除日记失败'
      set({
        deleting: false,
        error: errorMessage
      })
      return { success: false, error: errorMessage }
    }
  },

  // 设置过滤器
  setFilters: (newFilters) => {
    set({
      filters: { ...get().filters, ...newFilters },
      pagination: { ...get().pagination, page: 1, hasMore: true }
    })
  },

  // 清除过滤器
  clearFilters: () => {
    set({
      filters: {
        keyword: '',
        dateRange: null,
        mood: null,
        weather: null
      },
      pagination: { ...get().pagination, page: 1, hasMore: true }
    })
  },

  // 设置当前日记
  setCurrentDiary: (diary) => {
    set({ currentDiary: diary })
  },

  // 清除当前日记
  clearCurrentDiary: () => {
    set({ currentDiary: null })
  },

  // 清除错误
  clearError: () => {
    set({ error: null })
  },

  // 获取日记数据（兼容首页使用）
  fetchDiaries: async (reset = false) => {
    const { pagination } = get()
    const page = reset ? 1 : pagination.page + 1
    
    const result = await get().getDiaries({
      page,
      pageSize: pagination.pageSize,
      refresh: reset
    })
    
    return result
  },

  // 刷新日记数据
  refreshDiaries: async () => {
    return await get().fetchDiaries(true)
  },

  // 重置状态
  reset: () => {
    set({
      diaries: [],
      currentDiary: null,
      loading: false,
      saving: false,
      deleting: false,
      error: null,
      pagination: {
        page: 1,
        pageSize: 10,
        total: 0,
        hasMore: true
      },
      filters: {
        keyword: '',
        dateRange: null,
        mood: null,
        weather: null
      }
    })
  }
}))

export { useDiaryStore }
export default useDiaryStore