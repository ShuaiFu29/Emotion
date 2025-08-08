/**
 * AI头像生成工具函数
 * 使用豆包大模型API生成个性化头像
 */

/**
 * 根据用户信息生成AI头像
 * @param {Object} userInfo - 用户信息
 * @param {string} userInfo.nickname - 用户昵称
 * @param {string} userInfo.signature - 用户签名
 * @returns {Promise<string>} 返回生成的头像URL
 */
export async function generateAvatarByAI(userInfo = {}) {
  const { nickname = '用户', username = '用户', signature = '' } = userInfo;
  
  // 优先使用nickname，如果没有则使用username
  const displayName = nickname || username;
  
  // 从环境变量获取API key
  const apiKey = import.meta.env.VITE_ARK_API_KEY;
  
  // console.log('开始生成AI头像，用户信息:', { displayName, signature });
  
  if (!apiKey) {
    throw new Error('API密钥未配置，请在.env.local文件中设置VITE_ARK_API_KEY');
  }
  
  // 根据用户输入生成图片提示词
  // 如果signature包含具体描述，优先使用；否则使用displayName作为描述
  const imageDescription = signature && signature.trim() ? signature : displayName;
  
  // 生成高质量的图片提示词，避免人物相关关键词
  const prompt = `${imageDescription}, high quality, detailed, beautiful scenery, landscape photography, natural lighting, vivid colors, 4K resolution, masterpiece, no people, no human figures`;
  
  // console.log('发送给豆包文生图API的提示词:', prompt);
  
  try {
    // 调用豆包文生图API（通过代理）
    const response = await fetch('/api/doubao/api/v3/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: 'doubao-seedream-3-0-t2i-250415',
        prompt: prompt,
        response_format: 'url',
        size: '1024x1024',
        watermark: false,
        guidance_scale: 3.0
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('豆包文生图API调用失败:', response.status, response.statusText, errorText);
      throw new Error(`豆包文生图API调用失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    // console.log('豆包文生图API响应:', data);
    
    if (!data.data || !data.data[0] || !data.data[0].url) {
      throw new Error('豆包文生图API返回数据格式异常');
    }
    
    const avatarUrl = data.data[0].url;
    // console.log('生成的头像URL:', avatarUrl);
    return avatarUrl;
    
  } catch (error) {
    console.error('AI头像生成失败:', error);
    throw error;
  }
}

/**
 * 重试机制包装函数
 * @param {Function} fn - 要重试的函数
 * @param {number} maxRetries - 最大重试次数
 * @param {number} delay - 重试延迟（毫秒）
 * @returns {Promise} 函数执行结果
 */
export async function withRetry(fn, maxRetries = 2, delay = 1500) {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const result = await fn();
      if (i > 0) {
        // console.log(`重试成功，第${i}次重试`);
      }
      return result;
    } catch (error) {
      lastError = error;
      
      if (i === maxRetries) {
        console.error(`所有重试都失败了，最大重试次数：${maxRetries}`);
        break;
      }
      
      console.warn(`操作失败，${delay}ms后进行第${i + 1}次重试:`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}