// Coze API 配置和调用函数

const COZE_CONFIG = {
  apiToken: import.meta.env.VITE_COZE_API_TOKEN,
  botId: import.meta.env.VITE_COZE_BOT_ID,
  baseUrl: import.meta.env.VITE_COZE_BASE_URL || 'https://api.coze.cn'
};

/**
 * 发送消息到Coze Agent
 * @param {string} message - 用户消息
 * @param {string} conversationId - 会话ID（可选）
 * @returns {Promise<Object>} API响应
 */
export const sendMessageToCoze = async (message, conversationId = null) => {
  try {
    const requestBody = {
      bot_id: COZE_CONFIG.botId,
      user: 'user_' + Date.now(), // 生成唯一用户ID
      query: message,
      chat_history: [],
      stream: false
    };

    if (conversationId) {
      requestBody.conversation_id = conversationId;
    }

    const response = await fetch(`${COZE_CONFIG.baseUrl}/open_api/v2/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COZE_CONFIG.apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API请求失败: ${response.status} ${response.statusText}. ${errorData.msg || ''}`);
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

  // 获取最后一条助手消息
  const assistantMessage = response.messages
    .filter(msg => msg.role === 'assistant' && msg.type === 'answer')
    .pop();

  if (!assistantMessage) {
    return {
      id: Date.now().toString(),
      content: '抱歉，我无法理解您的问题。',
      type: 'assistant',
      timestamp: new Date().toISOString()
    };
  }

  return {
    id: assistantMessage.id || Date.now().toString(),
    content: assistantMessage.content || '抱歉，响应内容为空。',
    type: 'assistant',
    timestamp: new Date().toISOString(),
    conversationId: response.conversation_id
  };
};