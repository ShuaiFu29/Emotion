import { useState, useEffect, useRef } from 'react'
import { Button, Field, Toast, Loading } from 'react-vant'
import { Arrow, Replay, Delete } from '@react-vant/icons'
import useChatStore from '../../store/chatStore'
import './index.less'

const Chat = () => {
  const [inputMessage, setInputMessage] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  
  const {
    messages,
    isLoading,
    error,
    isConfigValid,
    sendMessage,
    clearMessages,
    clearError,
    initialize,
    resendMessage
  } = useChatStore()

  // 初始化
  useEffect(() => {
    initialize()
  }, [])

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
      await resendMessage(messageId)
    } catch (err) {
      console.error('重发消息失败:', err)
    }
  }

  const renderMessage = (message) => {
    const isUser = message.type === 'user'
    const isError = message.type === 'error'
    
    return (
      <div 
        key={message.id} 
        className={`message ${isUser ? 'user' : 'assistant'} ${isError ? 'error' : ''}`}
      >
        <div className="message-content">
          <div className="message-text">
            {message.content}
          </div>
          <div className="message-time">
            {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
        {isError && (
          <Button 
            size="mini" 
            type="primary" 
            className="resend-btn"
            onClick={() => handleResendMessage(message.id)}
          >
            重试
          </Button>
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
      <div className="chat-header">
        <h1>治愈聊天</h1>
        <div className="header-actions">
          <Button 
            size="small" 
            icon={<Replay />}
            onClick={initialize}
          />
          <Button 
            size="small" 
            icon={<Delete />}
            onClick={handleClearChat}
            disabled={messages.length === 0}
          />
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <div className="welcome-content">
              <h3>👋 你好！我是你的治愈助手</h3>
              <p>有什么心事想要分享吗？我会认真倾听并给你温暖的回应。</p>
            </div>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        
        {isLoading && (
          <div className="message assistant loading">
            <div className="message-content">
              <Loading size="16px" />正在思考中...
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

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
            className="send-btn"
          >
            发送
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Chat