import { useState, useEffect, useRef } from 'react'
import { Button, Field, Toast, Loading } from 'react-vant'
import { Arrow, Replay, Delete, Success, Warning, Close } from '@react-vant/icons'
import useChatStore from '../../store/chatStore'
import './index.less'

// 连接状态组件
const ConnectionStatus = () => {
  const getConnectionStatus = useChatStore(state => state.getConnectionStatus)
  const status = getConnectionStatus()
  
  const getStatusIcon = () => {
    switch (status.status) {
      case 'connected':
        return <Success className="status-icon connected" />
      case 'error':
        return <Warning className="status-icon error" />
      case 'disconnected':
        return <Close className="status-icon disconnected" />
      default:
        return <Warning className="status-icon" />
    }
  }
  
  const getStatusText = () => {
    switch (status.status) {
      case 'connected':
        return '已连接'
      case 'error':
        return '连接异常'
      case 'disconnected':
        return '未连接'
      default:
        return '未知状态'
    }
  }
  
  return (
    <div 
      className="connection-status-indicator" 
      title={`${status.message}${status.detail ? ' - ' + status.detail : ''}`}
    >
      {getStatusIcon()}
      <span className={`status-text ${status.status}`}>
        {getStatusText()}
      </span>
    </div>
  )
}

const Chat = () => {
  const [inputMessage, setInputMessage] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  
  const {
    messages,
    isLoading,
    error,
    errorInfo,
    isConfigValid,
    sendMessage,
    clearMessages,
    clearError,
    initialize,
    resendMessage,
    streamingMessageId,
    connectionStatus,
    setupNetworkMonitoring,
    checkConnection,
    startAutoReconnect,
    smartRetry,
    retryAllFailedMessages
  } = useChatStore()

  // 初始化
  useEffect(() => {
    initialize()
    
    // 设置网络监控
    const cleanupNetworkMonitoring = setupNetworkMonitoring()
    
    // 初始连接检查
    checkConnection()
    
    // 清理函数
    return () => {
      if (cleanupNetworkMonitoring) {
        cleanupNetworkMonitoring()
      }
    }
  }, [initialize, setupNetworkMonitoring, checkConnection])

  // 自动滚动到底部
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 显示错误提示
  useEffect(() => {
    if (error) {
      Toast.fail(error)
      clearError()
    }
  }, [error, clearError])

  // 监听连接状态变化，自动重连
  useEffect(() => {
    if (connectionStatus === 'error') {
      // 延迟启动自动重连，避免频繁重试
      const timer = setTimeout(() => {
        startAutoReconnect()
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [connectionStatus, startAutoReconnect])

  // 错误横幅组件
  const ErrorBanner = () => {
    if (!error || !errorInfo) return null
    
    return (
      <div className="error-banner">
        <div className="error-content">
          <Warning className="error-icon" />
          <div className="error-text">
            <div className="error-title">{errorInfo.title || '出现问题'}</div>
            <div className="error-message">{errorInfo.message || error}</div>
            {errorInfo.suggestion && (
              <div className="error-suggestion">{errorInfo.suggestion}</div>
            )}
          </div>
        </div>
        <div className="error-actions">
          {errorInfo.retryable && (
            <Button 
              size="mini" 
              type="primary" 
              onClick={() => useChatStore.getState().retryLastMessage()}
            >
              重试
            </Button>
          )}
          {messages.filter(msg => msg.type === 'error' && msg.retryable).length > 1 && (
            <Button 
              size="mini" 
              type="default" 
              onClick={handleRetryAll}
            >
              重试全部
            </Button>
          )}
          <Button size="mini" onClick={clearError}>关闭</Button>
        </div>
      </div>
    )
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) {
      Toast.fail('请输入消息内容')
      return
    }

    if (!isConfigValid) {
      Toast.fail('聊天配置无效，请检查设置')
      return
    }

    const message = inputMessage.trim()
    setInputMessage('')
    
    try {
      await sendMessage(message)
      // 发送成功后聚焦输入框
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    } catch (err) {
      console.error('发送消息失败:', err)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleClearChat = () => {
    clearMessages()
    Toast.success('聊天记录已清空')
  }

  const handleResendMessage = async (messageId) => {
    try {
      await smartRetry(messageId)
    } catch (err) {
      console.error('重发消息失败:', err)
    }
  }

  const handleRetryAll = async () => {
    try {
      await retryAllFailedMessages()
      Toast.success('正在重试所有失败的消息')
    } catch (err) {
      console.error('批量重试失败:', err)
      Toast.fail('批量重试失败')
    }
  }

  const renderMessage = (message) => {
    const isUser = message.type === 'user'
    const isError = message.type === 'error'
    const isStreaming = streamingMessageId === message.id && message.isStreaming
    
    return (
      <div 
        key={message.id} 
        className={`message ${isUser ? 'user' : 'assistant'} ${isError ? 'error' : ''} ${isStreaming ? 'streaming' : ''}`}
      >
        <div className="message-avatar">
          {isUser ? '👤' : isError ? '⚠️' : '🤖'}
        </div>
        <div className="message-content">
          <div className="message-text">
            {message.content}
            {isStreaming && <span className="typing-cursor">|</span>}
          </div>
          <div className="message-time">
            {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
          {isError && message.errorInfo && (
            <div className="error-info">
              <div className="error-type">{message.errorInfo.title}</div>
              {message.errorInfo.suggestion && (
                <div className="error-suggestion">{message.errorInfo.suggestion}</div>
              )}
            </div>
          )}
        </div>
        {isError && message.retryable && (
          <div className="message-actions">
            <Button 
              size="mini" 
              type="primary" 
              className="resend-btn"
              onClick={() => handleResendMessage(message.id)}
              loading={isLoading}
            >
              {isLoading ? '重试中...' : '重试'}
            </Button>
          </div>
        )}
      </div>
    )
  }

  if (!isConfigValid) {
    return (
      <div className="chat-page">
        <div className="chat-header">
          <h1>治愈聊天</h1>
        </div>
        <div className="chat-content">
          <div className="config-error">
            <h3>配置错误</h3>
            <p>聊天功能配置无效，请检查环境变量设置</p>
            <Button type="primary" onClick={initialize}>
              重新检查配置
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-page">
      {/* 固定头部 */}
      <div className="chat-header">
        <div className="header-content">
          <div className="header-left">
            <div className="chat-title">
              <span className="title-text">情感陪伴</span>
              <span className="title-subtitle">聊聊</span>
            </div>
            <div className="connection-status">
              <ConnectionStatus />
            </div>
          </div>
          <div className="header-right">
            <Button
              className="clear-btn"
              size="small"
              icon={<Delete />}
              onClick={handleClearChat}
              disabled={messages.length === 0}
              title="清空聊天"
            >
              清空
            </Button>
          </div>
        </div>
      </div>

      <ErrorBanner />

      {/* 可滚动的消息区域 */}
      <div className="chat-messages" ref={messagesEndRef}>
        {messages.length === 0 ? (
          <div className="welcome-message">
            <div className="welcome-content">
              <h3>欢迎来到情感陪伴聊天室</h3>
              <p>我是你的AI情感陪伴助手，随时准备倾听你的心声</p>
              <div className="welcome-tips">
                <p>💡 我可以帮助你：</p>
                <ul>
                  <li>倾听你的烦恼和困扰</li>
                  <li>提供情感支持和建议</li>
                  <li>陪你聊天，缓解孤独感</li>
                  <li>帮你分析情感问题</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        
        {isLoading && (
          <div className="loading-indicator">
            <div className="loading-content">
              <Loading size="20px" />
              <span>AI正在思考中...</span>
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 固定输入框 */}
      <div className="chat-input">
        <div className="input-container">
          <Field
            ref={inputRef}
            value={inputMessage}
            onChange={setInputMessage}
            placeholder="输入你想说的话..."
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            autosize
            maxlength={1000}
            showWordLimit
          />
          <Button
            type="primary"
            icon={<Arrow />}
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className={`send-btn ${inputMessage.trim() ? 'has-content' : ''}`}
          >
            {isLoading ? '发送中...' : '发送'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Chat