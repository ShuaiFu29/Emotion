import {
  useState
} from 'react'
import { ActionSheet, Toast, Cell, Dialog, Field, Button } from 'react-vant'
import {
  Setting,
  Phone,
  Add,
  More,
  Chat,
  Like,
  Star,
  Fire,
  Manager
} from '@react-vant/icons'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import './index.less'

const Account = () => {
  const navigate = useNavigate()
  const {
    logout,
    forceLogout
  } = useAuthStore()
  const [
    showAvatarActions,
    setShowAvatarActions
  ] = useState(false)
  const [
    showUserInfoDialog,
    setShowUserInfoDialog
  ] = useState(false)
  const [userInfo, setUserInfo] = useState({
    nickname: '莉莉',
    level: '5级',
    signature: '保持热爱，奔赴山海。'
  })
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [customToast, setCustomToast] = useState({ show: false, message: '', type: 'info' })

  // 自定义Toast显示函数
  const showCustomToast = (message, type = 'info') => {
    setCustomToast({ show: true, message, type })
    setTimeout(() => {
      setCustomToast({ show: false, message: '', type: 'info' })
    }, 2000)
  }

  // 用户统计数据
  const userStats = [
    { label: '发布日记', value: '12', unit: '篇' },
    { label: '日记总数', value: '45', unit: '篇' },
    { label: '连续打卡', value: '7', unit: '天' },
    { label: '总打卡', value: '30', unit: '天' }
  ]



  // 九宫格功能项
  const gridItems = [
    { icon: <Setting />, text: '设置', color: '#666' },
    { icon: <Add />, text: '添加', color: '#666' },
    { icon: <Chat />, text: '聊天', color: '#666' },
    { icon: <Fire />, text: '热门', color: '#666' },
    { icon: <Like />, text: '喜欢', color: '#666' },
    { icon: <Star />, text: '收藏', color: '#666' },
    { icon: <More />, text: '更多', color: '#666' },
    { icon: <Phone />, text: '客服', color: '#666' },
    { icon: <Manager />, text: '退出', color: '#666' }
  ]



  const handleGridItemClick = (item) => {
    switch (item.text) {
      case '设置':
        setShowUserInfoDialog(true)
        break
      case '添加':
        navigate('/publish')
        break
      case '聊天':
        navigate('/chat')
        break
      case '退出':
        handleLogout()
        break
      case '热门':
      case '喜欢':
      case '收藏':
      case '更多':
      case '客服':
        showCustomToast(`${item.text}功能开发中...`, 'info')
        break
      default:
        showCustomToast(`${item.text}功能开发中...`, 'info')
    }
  }

  const handleLogout = () => {
    setShowLogoutDialog(true)
  }

  const confirmLogout = () => {
    setShowLogoutDialog(false)
    forceLogout()
    // forceLogout会自动刷新页面，所以不需要手动navigate
  }

  const handleSaveUserInfo = () => {
    setShowUserInfoDialog(false)
    showCustomToast('用户信息已更新', 'success')
  }

  return (
    <div className="container">
      {/* 用户信息卡片 */}
      <div className="user">
        <div
          className="user-avatar"
          onClick={() => setShowAvatarActions(true)}
        >
          <img
            src="https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg"
            alt="用户头像"
          />
        </div>
        <div className="user-info">
          <div className="nickname">昵称：{userInfo.nickname}</div>
          <div className="level">等级：{userInfo.level}</div>
          <div className="slogan">签名：{userInfo.signature}</div>
        </div>
      </div>

      {/* 四宫格统计区域 */}
      <div className="statsContainer">
        {userStats.map((stat, index) => (
          <div key={index} className="statsItem">
            <div className="statsValue">{stat.value}</div>
            <div className="statsLabel">{stat.label}</div>
            <div className="statsUnit">{stat.unit}</div>
          </div>
        ))}
      </div>



      {/* 九宫格功能区域 */}
      <div className="gridContainer">
        {gridItems.map((item, index) => (
          <div
            key={index}
            onClick={() => handleGridItemClick(item)}
            className="gridItem"
          >
            <div className="icon">
              {item.icon}
            </div>
            <span className="text">{item.text}</span>
          </div>
        ))}
      </div>

      {/* 头像操作弹窗 */}
      <ActionSheet
        visible={showAvatarActions}
        onCancel={() => setShowAvatarActions(false)}
        title="选择头像操作"
        closeable={false}
        actions={[
          {
            name: '上传图片',
            callback: () => {
              setShowAvatarActions(false)
              showCustomToast('上传图片功能开发中...', 'info')
            }
          },
          {
            name: 'AI生成图片',
            color: '#ff4444',
            callback: () => {
              setShowAvatarActions(false)
              showCustomToast('AI生成图片功能开发中...', 'info')
            }
          },
          {
            name: '取消',
            callback: () => setShowAvatarActions(false)
          }
        ]}
      />

      {/* 用户信息编辑弹窗 */}
      <Dialog
        visible={showUserInfoDialog}
        title="编辑用户信息"
        showCancelButton
        onCancel={() => setShowUserInfoDialog(false)}
        onConfirm={handleSaveUserInfo}
      >
        <div style={{ padding: '20px' }}>
          <Field
            label="昵称"
            value={userInfo.nickname}
            onChange={(value) => setUserInfo({ ...userInfo, nickname: value })}
            placeholder="请输入昵称"
          />
          <Field
            label="等级"
            value={userInfo.level}
            readonly
            placeholder="等级不可修改"
          />
          <Field
            label="个性签名"
            value={userInfo.signature}
            onChange={(value) => setUserInfo({ ...userInfo, signature: value })}
            placeholder="请输入个性签名"
            type="textarea"
            rows={3}
          />
        </div>
      </Dialog>

      {/* 退出确认弹窗 */}
      <Dialog
        visible={showLogoutDialog}
        title="确认退出"
        message="确定要退出登录吗？"
        showCancelButton
        onCancel={() => setShowLogoutDialog(false)}
        onConfirm={confirmLogout}
      />

      {/* 自定义Toast组件 */}
      {customToast.show && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: customToast.type === 'success' ? '#07c160' : '#1989fa',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            zIndex: 9999,
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
            maxWidth: '80%',
            textAlign: 'center'
          }}
        >
          {customToast.message}
        </div>
      )}
    </div>
  )
}

export default Account