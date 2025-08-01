import { Empty } from 'react-vant'
import { ChatO } from '@react-vant/icons'
import './index.less'

const Chat = () => {
  return (
    <div className="chat-page">
      <div className="chat-header">
        <h1>治愈聊天</h1>
      </div>

      <div className="chat-content">
        <Empty
          image={<ChatO size={64} />}
          description="治愈聊天功能开发中..."
        />
      </div>
    </div>
  )
}

export default Chat