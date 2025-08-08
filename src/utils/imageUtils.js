// 图片处理工具函数

/**
 * 清理localStorage中的Blob URL数据
 * 将所有Blob URL替换为占位图或移除无效数据
 */
export const cleanupBlobUrls = () => {
  try {
    // console.log('开始清理localStorage中的Blob URL数据...')
    
    // 获取全局日记数据
    const storedDiaries = localStorage.getItem('global_diaries')
    if (!storedDiaries) {
      // console.log('没有找到全局日记数据')
      return
    }
    
    let globalDiaries = JSON.parse(storedDiaries)
    let hasChanges = false
    
    // 遍历所有日记
    globalDiaries.forEach((diary, diaryIndex) => {
      if (diary.images && Array.isArray(diary.images)) {
        diary.images.forEach((image, imageIndex) => {
          if (typeof image === 'string' && image.startsWith('blob:')) {
            console.warn(`发现Blob URL在日记${diaryIndex}的图片${imageIndex}:`, image)
            // 移除Blob URL图片
            diary.images.splice(imageIndex, 1)
            hasChanges = true
          }
        })
        
        // 移除空的图片数组
        if (diary.images.length === 0) {
          delete diary.images
        }
      }
    })
    
    // 如果有变化，保存回localStorage
    if (hasChanges) {
      localStorage.setItem('global_diaries', JSON.stringify(globalDiaries))
      // console.log('已清理localStorage中的Blob URL数据')
    } else {
      // console.log('没有发现需要清理的Blob URL数据')
    }
    
  } catch (error) {
    console.error('清理Blob URL数据失败:', error)
  }
}

/**
 * 验证图片数据是否有效
 * @param {string} imageData - 图片数据
 * @returns {boolean} - 是否有效
 */
export const isValidImageData = (imageData) => {
  if (!imageData || typeof imageData !== 'string') {
    return false
  }
  
  // 检查是否为有效的base64或http链接
  return imageData.startsWith('data:') || 
         imageData.startsWith('http:') || 
         imageData.startsWith('https:')
}

/**
 * 获取占位图的base64数据
 * @param {string} text - 占位图显示的文字
 * @returns {string} - 占位图的base64数据
 */
export const getPlaceholderImage = (text = '图片加载失败') => {
  // 创建一个简单的SVG占位图
  const svg = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#999" text-anchor="middle" dy=".3em">${text}</text>
    </svg>
  `
  
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
}

/**
 * 处理图片数据，确保返回有效的图片源
 * @param {string} imageData - 原始图片数据
 * @param {number} index - 图片索引（用于错误提示）
 * @returns {string} - 处理后的图片源
 */
export const processImageData = (imageData, index = 0) => {
  // 如果是有效的图片数据，直接返回
  if (isValidImageData(imageData)) {
    return imageData
  }
  
  // 如果是Blob URL，返回占位图
  if (typeof imageData === 'string' && imageData.startsWith('blob:')) {
    console.warn(`发现Blob URL图片${index + 1}:`, imageData)
    return getPlaceholderImage('图片已失效')
  }
  
  // 其他无效数据，返回占位图
  console.warn(`无效的图片数据${index + 1}:`, imageData)
  return getPlaceholderImage('图片加载失败')
}