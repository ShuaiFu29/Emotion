import { create } from 'zustand';
import { sendMessageToCoze, formatCozeResponse, validateCozeConfig, formatChatHistory } from '../api/coze';

// 错误类型枚举
const ERROR_TYPES = {
  NETWORK: 'network',
  CONFIG: 'config',
  API: 'api',
  VALIDATION: 'validation',
  TIMEOUT: 'timeout',
  UNKNOWN: 'unknown'
};

// 错误处理工具函数
const getErrorInfo = (error) => {
  const errorMessage = error?.message || error || '未知错误';
  
  // 网络错误
  if (errorMessage.includes('fetch') || errorMessage.includes('网络') || errorMessage.includes('Network')) {
    return {
      type: ERROR_TYPES.NETWORK,
      title: '网络连接异常',
      message: '请检查网络连接后重试',
      suggestion: '检查网络设置或稍后重试',
      retryable: true
    };
  }
  
  // API配置错误
  if (errorMessage.includes('API配置') || errorMessage.includes('Token') || errorMessage.includes('Bot ID')) {
    return {
      type: ERROR_TYPES.CONFIG,
      title: 'API配置错误',
      message: '聊天服务配置有误，请联系管理员',
      suggestion: '检查环境变量中的API Token和Bot ID',
      retryable: false
    };
  }
  
  // API请求错误
  if (errorMessage.includes('API请求失败') || errorMessage.includes('401') || errorMessage.includes('403')) {
    return {
      type: ERROR_TYPES.API,
      title: 'API请求失败',
      message: '服务暂时不可用，请稍后重试',
      suggestion: '检查API权限或稍后重试',
      retryable: true
    };
  }
  
  // 参数验证错误
  if (errorMessage.includes('Parameter') || errorMessage.includes('参数')) {
    return {
      type: ERROR_TYPES.VALIDATION,
      title: '请求参数错误',
      message: '消息格式有误，请重新输入',
      suggestion: '检查输入内容格式',
      retryable: true
    };
  }
  
  // 超时错误
  if (errorMessage.includes('timeout') || errorMessage.includes('超时')) {
    return {
      type: ERROR_TYPES.TIMEOUT,
      title: '请求超时',
      message: '服务响应超时，请稍后重试',
      suggestion: '网络较慢，请稍后重试',
      retryable: true
    };
  }
  
  // 默认未知错误
  return {
    type: ERROR_TYPES.UNKNOWN,
    title: '发送失败',
    message: errorMessage.length > 50 ? '服务暂时不可用，请稍后重试' : errorMessage,
    suggestion: '请稍后重试或联系技术支持',
    retryable: true
  };
};

const useChatStore = create((set, get) => ({
  // 状态
  messages: [],
  isLoading: false,
  error: null,
  errorInfo: null, // 详细错误信息对象
  conversationId: null,
  isConfigValid: false,
  streamingMessageId: null,
  streamingContent: '',
  connectionStatus: 'disconnected', // 连接状态: connected, disconnected, error
  lastActivity: null, // 最后活动时间

  // 初始化
  initialize: () => {
    const isValid = validateCozeConfig();
    const now = new Date().toISOString();
    
    if (isValid) {
      set({ 
        isConfigValid: true,
        connectionStatus: 'connected',
        error: null,
        errorInfo: null,
        lastActivity: now
      });
    } else {
      const errorInfo = getErrorInfo('API配置无效，请检查环境变量设置');
      set({ 
        isConfigValid: false,
        connectionStatus: 'error',
        error: errorInfo.message,
        errorInfo: errorInfo,
        lastActivity: now
      });
    }
  },

  // 发送消息
  sendMessage: async (content) => {
    const { isConfigValid, conversationId, messages } = get();
    const now = new Date().toISOString();
    
    // 验证配置
    if (!isConfigValid) {
      const errorInfo = getErrorInfo('API配置无效，无法发送消息');
      set({ 
        error: errorInfo.message,
        errorInfo: errorInfo,
        connectionStatus: 'error'
      });
      return;
    }

    // 验证消息内容
    if (!content || !content.trim()) {
      const errorInfo = getErrorInfo('消息内容不能为空');
      set({ 
        error: errorInfo.message,
        errorInfo: errorInfo
      });
      return;
    }

    // 添加用户消息
    const userMessage = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: content.trim(),
      type: 'user',
      timestamp: now
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null,
      errorInfo: null,
      connectionStatus: 'connected',
      lastActivity: now
    }));

    try {
      // 准备聊天历史
      const chatHistory = formatChatHistory(messages);
      
      // 调用Coze API
      const response = await sendMessageToCoze(content.trim(), conversationId, chatHistory);
      
      // 格式化响应消息
      const assistantMessage = formatCozeResponse(response);
      
      // 创建流式消息
      const messageId = `assistant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const streamMessage = {
        ...assistantMessage,
        id: messageId,
        content: '',
        isStreaming: true
      };
      
      set((state) => ({
        messages: [...state.messages, streamMessage],
        isLoading: false,
        streamingMessageId: messageId,
        streamingContent: assistantMessage.content,
        conversationId: response.conversation_id || state.conversationId,
        connectionStatus: 'connected',
        lastActivity: new Date().toISOString()
      }));
      
      // 启动流式显示
      get().startStreaming(messageId, assistantMessage.content);

    } catch (error) {
      console.error('发送消息失败:', error);
      
      // 获取详细错误信息
      const errorInfo = getErrorInfo(error);
      
      // 添加错误消息
      const errorMessage = {
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: errorInfo.message,
        type: 'error',
        timestamp: new Date().toISOString(),
        errorInfo: errorInfo,
        retryable: errorInfo.retryable
      };

      set((state) => ({
        messages: [...state.messages, errorMessage],
        isLoading: false,
        error: errorInfo.message,
        errorInfo: errorInfo,
        connectionStatus: errorInfo.type === ERROR_TYPES.NETWORK ? 'error' : 'connected',
        lastActivity: new Date().toISOString()
      }));
    }
  },

  // 清除错误
  clearError: () => {
    set({ 
      error: null,
      errorInfo: null
    });
  },

  // 清空聊天记录
  clearMessages: () => {
    set({ 
      messages: [], 
      conversationId: null,
      error: null,
      errorInfo: null,
      streamingMessageId: null,
      streamingContent: '',
      isLoading: false
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
    const { messages, isLoading } = get();
    
    // 防止重复重试
    if (isLoading) {
      return;
    }
    
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    
    if (messageIndex === -1) {
      const errorInfo = getErrorInfo('找不到要重发的消息');
      set({ 
        error: errorInfo.message,
        errorInfo: errorInfo
      });
      return;
    }
    
    const message = messages[messageIndex];
    
    // 如果是错误消息，找到对应的用户消息
    let userMessage = null;
    if (message.type === 'error') {
      // 向前查找最近的用户消息
      for (let i = messageIndex - 1; i >= 0; i--) {
        if (messages[i].type === 'user') {
          userMessage = messages[i];
          break;
        }
      }
    } else if (message.type === 'user') {
      userMessage = message;
    }
    
    if (!userMessage) {
      const errorInfo = getErrorInfo('找不到要重发的用户消息');
      set({ 
        error: errorInfo.message,
        errorInfo: errorInfo
      });
      return;
    }
    
    // 标记消息为重试中
    set((state) => ({
      messages: state.messages.map(msg => 
        msg.id === messageId 
          ? { ...msg, isRetrying: true }
          : msg
      ),
      error: null,
      errorInfo: null
    }));
    
    try {
      // 删除错误消息及其后的所有消息
      set((state) => ({
        messages: state.messages.slice(0, messageIndex)
      }));
      
      // 重新发送用户消息
      await get().sendMessage(userMessage.content);
    } catch (error) {
      console.error('重试消息失败:', error);
      const errorInfo = getErrorInfo(error);
      
      // 恢复原始错误消息，但标记重试失败
      set((state) => ({
        messages: [...state.messages, {
          ...message,
          isRetrying: false,
          retryFailed: true,
          errorInfo: errorInfo
        }],
        error: errorInfo.message,
        errorInfo: errorInfo
      }));
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
      errorInfo: null,
      conversationId: null,
      isConfigValid: false,
      streamingMessageId: null,
      streamingContent: '',
      connectionStatus: 'disconnected',
      lastActivity: null
    });
  },

  // 重试最后一条失败的消息
  retryLastMessage: async () => {
    const { messages } = get();
    const lastErrorMessage = messages
      .slice()
      .reverse()
      .find(msg => msg.type === 'error');
    
    if (lastErrorMessage) {
      await get().resendMessage(lastErrorMessage.id);
    }
  },

  // 批量重试所有失败的消息
  retryAllFailedMessages: async () => {
    const { messages, isLoading } = get();
    
    if (isLoading) {
      return;
    }
    
    const failedMessages = messages.filter(msg => msg.type === 'error' && msg.retryable);
    
    if (failedMessages.length === 0) {
      return;
    }
    
    // 按时间顺序重试
    for (const message of failedMessages) {
      try {
        await get().resendMessage(message.id);
        // 重试间隔，避免过于频繁
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('批量重试失败:', error);
        break; // 如果一个失败，停止后续重试
      }
    }
  },

  // 智能重试（根据错误类型调整策略）
  smartRetry: async (messageId) => {
    const { messages } = get();
    const message = messages.find(msg => msg.id === messageId);
    
    if (!message || message.type !== 'error') {
      return;
    }
    
    const errorType = message.errorInfo?.type;
    let retryDelay = 0;
    
    // 根据错误类型设置重试延迟
    switch (errorType) {
      case ERROR_TYPES.NETWORK:
        retryDelay = 2000; // 网络错误延迟2秒
        break;
      case ERROR_TYPES.TIMEOUT:
        retryDelay = 3000; // 超时错误延迟3秒
        break;
      case ERROR_TYPES.API:
        retryDelay = 5000; // API错误延迟5秒
        break;
      default:
        retryDelay = 1000; // 其他错误延迟1秒
    }
    
    // 延迟后重试
    setTimeout(async () => {
      await get().resendMessage(messageId);
    }, retryDelay);
  },

  // 获取连接状态
  getConnectionStatus: () => {
    const { connectionStatus, errorInfo, isConfigValid, lastActivity } = get();
    
    if (!isConfigValid) {
      return { 
        status: 'disconnected', 
        message: 'API配置无效',
        detail: errorInfo?.suggestion || '请检查环境变量配置'
      };
    }
    
    if (connectionStatus === 'error') {
      return { 
        status: 'error', 
        message: errorInfo?.title || '连接异常',
        detail: errorInfo?.suggestion || '请检查网络连接'
      };
    }
    
    if (connectionStatus === 'connected') {
      return { 
        status: 'connected', 
        message: '连接正常',
        detail: lastActivity ? `最后活动: ${new Date(lastActivity).toLocaleTimeString()}` : ''
      };
    }
    
    return { 
      status: 'disconnected', 
      message: '未连接',
      detail: '等待连接'
    };
  },

  // 开始流式显示
  startStreaming: (messageId, fullContent) => {
    if (!fullContent || fullContent.length === 0) {
      set({ streamingMessageId: null, streamingContent: '' });
      return;
    }

    // 将内容按字符分割，但保持中文字符完整性
    const chars = Array.from(fullContent);
    let currentIndex = 0;
    let streamInterval;
    
    const updateContent = () => {
      if (currentIndex >= chars.length) {
        clearInterval(streamInterval);
        set((state) => ({
          streamingMessageId: null,
          streamingContent: '',
          messages: state.messages.map(msg => 
            msg.id === messageId 
              ? { ...msg, content: fullContent, isStreaming: false }
              : msg
          )
        }));
        return;
      }
      
      const currentContent = chars.slice(0, currentIndex + 1).join('');
      
      set((state) => ({
        messages: state.messages.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: currentContent }
            : msg
        )
      }));
      
      currentIndex++;
      
      // 动态调整显示速度
      const char = chars[currentIndex - 1];
      let delay = 20; // 基础延迟
      
      // 中文字符稍慢
      if (/[\u4e00-\u9fa5]/.test(char)) {
        delay = 35;
      }
      // 标点符号稍快
      else if (/[.,!?;:]/.test(char)) {
        delay = 15;
      }
      // 空格很快
      else if (char === ' ') {
        delay = 10;
      }
      
      // 设置下一次更新
      streamInterval = setTimeout(updateContent, delay);
    };
    
    // 开始流式显示
    streamInterval = setTimeout(updateContent, 100); // 初始延迟
  },

  // 停止流式显示
  stopStreaming: () => {
    set({ streamingMessageId: null, streamingContent: '' });
  },

  // 验证状态一致性
  validateState: () => {
    const state = get();
    const issues = [];
    
    // 检查流式状态一致性
    if (state.streamingMessageId && !state.messages.find(msg => msg.id === state.streamingMessageId)) {
      issues.push('streamingMessageId references non-existent message');
    }
    
    // 检查加载状态一致性
    if (state.isLoading && state.streamingMessageId) {
      issues.push('both isLoading and streaming active');
    }
    
    // 检查错误状态一致性
    if (state.error && !state.errorInfo) {
      issues.push('error exists but errorInfo is missing');
    }
    
    return issues;
  },

  // 清理无效状态
  cleanupState: () => {
    const state = get();
    const updates = {};
    
    // 清理无效的流式状态
    if (state.streamingMessageId && !state.messages.find(msg => msg.id === state.streamingMessageId)) {
      updates.streamingMessageId = null;
      updates.streamingContent = '';
    }
    
    // 清理孤立的错误信息
    if (state.errorInfo && !state.error) {
      updates.errorInfo = null;
    }
    
    if (Object.keys(updates).length > 0) {
      set(updates);
    }
  },

  // 网络连接检测
  checkConnection: async () => {
    try {
      // 检查基本网络连接
      if (!navigator.onLine) {
        throw new Error('网络连接已断开');
      }
      
      // 验证API配置
      const isValid = validateCozeConfig();
      if (!isValid) {
        throw new Error('API配置无效');
      }
      
      // 更新连接状态
      set({
        connectionStatus: 'connected',
        lastActivity: new Date().toISOString(),
        error: null,
        errorInfo: null
      });
      
      return true;
    } catch (error) {
      const errorInfo = getErrorInfo(error);
      set({
        connectionStatus: 'error',
        error: errorInfo.message,
        errorInfo: errorInfo,
        lastActivity: new Date().toISOString()
      });
      return false;
    }
  },

  // 自动重连机制
  startAutoReconnect: () => {
    const { connectionStatus } = get();
    
    // 如果已经连接，不需要重连
    if (connectionStatus === 'connected') {
      return;
    }
    
    let retryCount = 0;
    const maxRetries = 5;
    const baseDelay = 2000; // 2秒基础延迟
    
    const attemptReconnect = async () => {
      if (retryCount >= maxRetries) {
        set({
          connectionStatus: 'error',
          error: '重连失败，请检查网络连接',
          errorInfo: getErrorInfo('重连失败，已达到最大重试次数')
        });
        return;
      }
      
      retryCount++;
      console.log(`尝试重连 (${retryCount}/${maxRetries})...`);
      
      const success = await get().checkConnection();
      
      if (!success) {
        // 指数退避延迟
        const delay = baseDelay * Math.pow(2, retryCount - 1);
        setTimeout(attemptReconnect, delay);
      } else {
        console.log('重连成功');
        retryCount = 0;
      }
    };
    
    attemptReconnect();
  },

  // 监听网络状态变化
  setupNetworkMonitoring: () => {
    const handleOnline = () => {
      console.log('网络已连接');
      get().checkConnection();
    };
    
    const handleOffline = () => {
      console.log('网络已断开');
      const errorInfo = getErrorInfo('网络连接已断开');
      set({
        connectionStatus: 'error',
        error: errorInfo.message,
        errorInfo: errorInfo
      });
    };
    
    // 添加事件监听器
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // 返回清理函数
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
}));

export default useChatStore;