// Coze API 配置和调用函数

const COZE_CONFIG = {
  apiToken: import.meta.env.VITE_COZE_API_TOKEN,
  botId: import.meta.env.VITE_COZE_BOT_ID,
  baseUrl: import.meta.env.VITE_COZE_BASE_URL || 'https://api.coze.cn'
};

// 生成唯一用户ID
const generateUserId = () => {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

/**
 * 发送消息到Coze Agent
 * @param {string} message - 用户消息
 * @param {string} conversationId - 会话ID（可选）
 * @param {Array} chatHistory - 聊天历史（可选）
 * @returns {Promise<Object>} API响应
 */
export const sendMessageToCoze = async (message, conversationId = null, chatHistory = []) => {
  try {
    if (!message || !message.trim()) {
      throw new Error('消息内容不能为空');
    }

    const requestBody = {
      bot_id: COZE_CONFIG.botId,
      user: generateUserId(),
      query: message.trim(),
      stream: false
    };

    // 添加会话ID（如果存在）
    if (conversationId) {
      requestBody.conversation_id = conversationId;
    }

    // 添加聊天历史（如果存在）
    if (chatHistory && chatHistory.length > 0) {
      requestBody.chat_history = chatHistory;
    }

    const response = await fetch(`${COZE_CONFIG.baseUrl}/open_api/v2/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COZE_CONFIG.apiToken}`,
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'Host': new URL(COZE_CONFIG.baseUrl).host,
        'Connection': 'keep-alive'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API请求失败: ${response.status} ${response.statusText}. ${errorData.msg || errorData.message || ''}`);
    }

    const data = await response.json();
    
    // 检查API响应状态
    if (data.code !== 0) {
      throw new Error(`Coze API错误: ${data.msg || '未知错误'}`);
    }

    return data;
  } catch (error) {
    console.error('发送消息到Coze失败:', error);
    throw error;
  }
};

/**
 * 获取会话历史
 * @param {string} conversationId - 会话ID
 * @returns {Promise<Object>} 会话历史
 */
export const getChatHistory = async (conversationId) => {
  try {
    const response = await fetch(`${COZE_CONFIG.baseUrl}/open_api/v2/chat/retrieve?conversation_id=${conversationId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${COZE_CONFIG.apiToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`获取会话历史失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('获取会话历史失败:', error);
    throw error;
  }
};

/**
 * 检查API配置是否有效
 * @returns {boolean} 配置是否有效
 */
export const validateCozeConfig = () => {
  const { apiToken, botId, baseUrl } = COZE_CONFIG;
  
  if (!apiToken) {
    console.error('Coze API Token未配置');
    return false;
  }
  
  if (!botId) {
    console.error('Coze Bot ID未配置');
    return false;
  }
  
  if (!baseUrl) {
    console.error('Coze Base URL未配置');
    return false;
  }
  
  return true;
};

/**
 * 格式化Coze响应消息
 * @param {Object} response - Coze API响应
 * @returns {Object} 格式化后的消息对象
 */
export const formatCozeResponse = (response) => {
  if (!response || !response.messages || response.messages.length === 0) {
    return {
      id: Date.now().toString(),
      content: '抱歉，我没有收到有效的响应。',
      type: 'assistant',
      timestamp: new Date().toISOString()
    };
  }

  // 获取所有助手回答消息，过滤掉verbose和follow_up类型
  const assistantMessages = response.messages
    .filter(msg => 
      msg.role === 'assistant' && 
      msg.type === 'answer' && 
      msg.content && 
      msg.content.trim() &&
      !msg.content.startsWith('{') // 过滤掉JSON格式的系统消息
    );

  if (assistantMessages.length === 0) {
    return {
      id: Date.now().toString(),
      content: '抱歉，我无法理解您的问题。',
      type: 'assistant',
      timestamp: new Date().toISOString()
    };
  }

  // 合并所有有效的助手消息内容
  const combinedContent = assistantMessages
    .map(msg => msg.content.trim())
    .join('\n')
    .trim();

  return {
    id: assistantMessages[0].id || Date.now().toString(),
    content: combinedContent || '抱歉，响应内容为空。',
    type: 'assistant',
    timestamp: new Date().toISOString(),
    conversationId: response.conversation_id
  };
};

/**
 * 将聊天消息转换为Coze API格式的聊天历史
 * @param {Array} messages - 聊天消息数组
 * @returns {Array} Coze API格式的聊天历史
 */
export const formatChatHistory = (messages) => {
  if (!messages || messages.length === 0) {
    return [];
  }

  return messages
    .filter(msg => msg.type === 'user' || msg.type === 'assistant')
    .slice(-10) // 只保留最近10条消息
    .map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content,
      content_type: 'text',
      ...(msg.type === 'assistant' && { type: 'answer' })
    }));
};