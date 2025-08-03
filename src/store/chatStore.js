import { create } from 'zustand';
import { sendMessageToCoze, formatCozeResponse, validateCozeConfig } from '../api/coze';

const useChatStore = create((set, get) => ({
  // 状态
  messages: [],
  isLoading: false,
  error: null,
  conversationId: null,
  isConfigValid: false,

  // 初始化
  initialize: () => {
    const isValid = validateCozeConfig();
    set({ isConfigValid: isValid });
    
    if (!isValid) {
      set({ 
        error: 'Coze API配置无效，请检查环境变量设置' 
      });
    }
  },

  // 发送消息
  sendMessage: async (content) => {
    const { isConfigValid, conversationId } = get();
    
    if (!isConfigValid) {
      set({ error: 'API配置无效，无法发送消息' });
      return;
    }

    if (!content.trim()) {
      set({ error: '消息内容不能为空' });
      return;
    }

    // 添加用户消息
    const userMessage = {
      id: Date.now().toString(),
      content: content.trim(),
      type: 'user',
      timestamp: new Date().toISOString()
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null
    }));

    try {
      // 调用Coze API
      const response = await sendMessageToCoze(content, conversationId);
      
      // 格式化响应消息
      const assistantMessage = formatCozeResponse(response);
      
      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
        conversationId: response.conversation_id || state.conversationId
      }));

    } catch (error) {
      console.error('发送消息失败:', error);
      
      // 添加错误消息
      const errorMessage = {
        id: Date.now().toString(),
        content: `抱歉，发送消息时出现错误: ${error.message}`,
        type: 'error',
        timestamp: new Date().toISOString()
      };

      set((state) => ({
        messages: [...state.messages, errorMessage],
        isLoading: false,
        error: error.message
      }));
    }
  },

  // 清除错误
  clearError: () => {
    set({ error: null });
  },

  // 清空聊天记录
  clearMessages: () => {
    set({ 
      messages: [], 
      conversationId: null,
      error: null 
    });
  },

  // 删除指定消息
  deleteMessage: (messageId) => {
    set((state) => ({
      messages: state.messages.filter(msg => msg.id !== messageId)
    }));
  },

  // 重新发送消息
  resendMessage: async (messageId) => {
    const { messages } = get();
    const message = messages.find(msg => msg.id === messageId);
    
    if (message && message.type === 'user') {
      // 删除原消息及其后的所有消息
      const messageIndex = messages.findIndex(msg => msg.id === messageId);
      set((state) => ({
        messages: state.messages.slice(0, messageIndex)
      }));
      
      // 重新发送
      await get().sendMessage(message.content);
    }
  },

  // 获取最后一条用户消息
  getLastUserMessage: () => {
    const { messages } = get();
    return messages.filter(msg => msg.type === 'user').pop();
  },

  // 获取消息统计
  getMessageStats: () => {
    const { messages } = get();
    return {
      total: messages.length,
      user: messages.filter(msg => msg.type === 'user').length,
      assistant: messages.filter(msg => msg.type === 'assistant').length,
      error: messages.filter(msg => msg.type === 'error').length
    };
  },

  // 检查是否有未读消息
  hasUnreadMessages: () => {
    const { messages } = get();
    const lastMessage = messages[messages.length - 1];
    return lastMessage && lastMessage.type === 'assistant';
  },

  // 设置会话ID
  setConversationId: (id) => {
    set({ conversationId: id });
  },

  // 重置store
  reset: () => {
    set({
      messages: [],
      isLoading: false,
      error: null,
      conversationId: null,
      isConfigValid: false
    });
  }
}));

export default useChatStore;