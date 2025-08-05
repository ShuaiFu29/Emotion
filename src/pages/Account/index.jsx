import {
  useState,
  useEffect,
  useRef
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
  Manager,
  PhotoO,
  Delete
} from '@react-vant/icons'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import useDiaryStore from '@/store/diaryStore'
import { generateAvatarByAI, withRetry } from '@/utils/avatarGenerator'
import './index.less'

const Account = () => {
  const navigate = useNavigate()
  const {
    user,
    forceLogout,
    updateUserInfo
  } = useAuthStore()
  const { diaries } = useDiaryStore()
  const [
    showAvatarActions,
    setShowAvatarActions
  ] = useState(false)
  const [
    showUserInfoDialog,
    setShowUserInfoDialog
  ] = useState(false)
  const [editUserInfo, setEditUserInfo] = useState({
    nickname: '',
    signature: ''
  })
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [customToast, setCustomToast] = useState({ show: false, message: '', type: 'info' })
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadOperation, setUploadOperation] = useState(null) // 'upload' | 'ai_generate' | null
  const fileInputRef = useRef(null)
  const uploadAbortRef = useRef(null) // 用于取消上传操作

  // 初始化用户信息
  useEffect(() => {
    if (user) {
      setEditUserInfo({
        nickname: user.nickname || user.username || '', // 优先使用nickname，如果没有则使用username
        signature: user.signature || ''
      })
      
      // 从localStorage恢复头像（如果用户没有设置头像但本地有缓存）
      if (!user.avatar) {
        const cachedAvatar = localStorage.getItem(`avatar_${user.id || 'default'}`)
        if (cachedAvatar && updateUserInfo) {
          // 静默更新用户头像，不显示toast
          updateUserInfo({ avatar: cachedAvatar }).catch(() => {
            // 如果更新失败，清除无效的缓存
            localStorage.removeItem(`avatar_${user.id || 'default'}`)
          })
        }
      }
    }
  }, [user, updateUserInfo])

  // 同步用户数据到编辑表单
  useEffect(() => {
    if (user) {
      setEditUserInfo({
        nickname: user.nickname || user.username || '',
        signature: user.signature || ''
      })
    }
  }, [user])

  // 自定义Toast显示函数
  const showCustomToast = (message, type = 'info') => {
    setCustomToast({ show: true, message, type })
    setTimeout(() => {
      setCustomToast({ show: false, message: '', type: 'info' })
    }, 2000)
  }

  // 用户统计数据 - 基于真实数据
  const userStats = [
    { label: '发布日记', value: diaries?.length || 0, unit: '篇' },
    { label: '日记总数', value: diaries?.length || 0, unit: '篇' },
    { label: '连续打卡', value: 0, unit: '天' },
    { label: '总打卡', value: 0, unit: '天' }
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
        // 在新标签页打开publish页面
        window.open('/publish', '_blank')
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

  // 处理头像上传 - 打开文件选择
  const handleAvatarUpload = () => {
    if (isUploading) {
      showCustomToast('正在处理中，请稍候...', 'info')
      return
    }
    fileInputRef.current?.click()
  }

  // 处理文件选择 - 只进行预览，不立即上传
  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (!file) return

    // 重置文件输入，允许重复选择同一文件
    event.target.value = ''

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      showCustomToast('请选择图片文件', 'error')
      return
    }

    // 验证文件大小（限制为5MB）
    if (file.size > 5 * 1024 * 1024) {
      showCustomToast('图片大小不能超过5MB', 'error')
      return
    }

    // 创建预览，但不立即上传
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        setAvatarPreview(e.target.result)
        showCustomToast('图片预览已生成，请确认上传', 'info')
      } catch (error) {
        console.error('文件读取失败:', error)
        showCustomToast('文件读取失败，请重试', 'error')
      }
    }
    reader.onerror = () => {
      showCustomToast('文件读取失败，请重试', 'error')
    }
    reader.readAsDataURL(file)
  }

  // 确认上传头像
  const confirmUploadAvatar = async () => {
    if (!avatarPreview) {
      showCustomToast('请先选择图片', 'error')
      return
    }
    
    if (isUploading || uploadOperation) {
      showCustomToast('正在处理中，请稍候...', 'info')
      return
    }
    
    setIsUploading(true)
    setUploadOperation('upload')
    
    // 创建可取消的Promise
    const abortController = new AbortController()
    uploadAbortRef.current = abortController
    
    try {
      // 模拟上传过程，添加重试机制
      let retryCount = 0
      const maxRetries = 3
      
      while (retryCount < maxRetries) {
        try {
          await new Promise((resolve, reject) => {
            setTimeout(() => {
              // 模拟偶尔失败的情况
              if (Math.random() > 0.1) { // 90%成功率
                resolve()
              } else {
                reject(new Error('模拟网络错误'))
              }
            }, 1000 + retryCount * 500) // 递增延迟
          })
          break // 成功则跳出重试循环
        } catch (error) {
          retryCount++
          if (retryCount >= maxRetries) {
            throw error
          }
          showCustomToast(`上传失败，正在重试 (${retryCount}/${maxRetries})...`, 'info')
        }
      }
      
      // 在实际项目中，这里应该调用真实的上传API
      // const formData = new FormData()
      // formData.append('avatar', file)
      // const response = await fetch('/api/upload/avatar', {
      //   method: 'POST',
      //   body: formData,
      //   headers: {
      //     'Authorization': `Bearer ${token}`
      //   }
      // })
      
      // 使用本地预览URL作为头像
      const avatarUrl = avatarPreview
      
      // 保存到localStorage确保持久化
      localStorage.setItem(`avatar_${user?.id || 'default'}`, avatarUrl)
      
      // 更新用户信息到authStore
      if (updateUserInfo) {
        await updateUserInfo({ avatar: avatarUrl })
        showCustomToast('头像上传成功', 'success')
      } else {
        showCustomToast('头像上传成功', 'success')
      }
      
      // 清理预览状态并关闭弹窗
      setAvatarPreview(null)
      setShowAvatarActions(false)
    } catch (error) {
      console.error('头像上传失败:', error)
      showCustomToast('头像上传失败，请重试', 'error')
      // 保留预览状态，允许用户重新尝试
    } finally {
      setIsUploading(false)
      setUploadOperation(null)
      uploadAbortRef.current = null
    }
  }

  // 取消上传
  const cancelUpload = () => {
    // 取消正在进行的上传操作
    if (uploadAbortRef.current) {
      uploadAbortRef.current.abort()
      uploadAbortRef.current = null
    }
    
    setAvatarPreview(null)
    setIsUploading(false)
    setUploadOperation(null)
  }

  // 删除头像
  const handleDeleteAvatar = async () => {
    try {
      // 清除localStorage中的头像数据
      localStorage.removeItem(`avatar_${user?.id || 'default'}`)
      
      // 更新authStore
      if (updateUserInfo) {
        await updateUserInfo({ avatar: null })
        showCustomToast('头像已删除', 'success')
      } else {
        showCustomToast('头像已删除', 'success')
      }
      
      setAvatarPreview(null)
      setShowAvatarActions(false)
    } catch (error) {
      console.error('删除头像失败:', error)
      showCustomToast('删除头像失败，请重试', 'error')
    }
  }

  // AI生成头像功能 - 使用豆包大模型API
  const handleAIGenerateAvatar = async () => {
    if (isUploading || uploadOperation) {
      showCustomToast('正在处理中，请稍候...', 'info')
      return
    }
    
    setIsUploading(true)
    setUploadOperation('ai_generate')
    
    try {
      // 使用重试机制调用AI头像生成工具函数
      const avatarUrl = await withRetry(
        () => generateAvatarByAI({
          nickname: user?.nickname || user?.username || '用户',
          username: user?.username || '用户',
          signature: user?.signature || ''
        }),
        3, // 最大重试3次
        1000 // 重试间隔1秒
      )
      
      // 保存到localStorage确保持久化
      localStorage.setItem(`avatar_${user?.id || 'default'}`, avatarUrl)
      
      // 更新用户信息到authStore
      if (updateUserInfo) {
        await updateUserInfo({ avatar: avatarUrl })
        showCustomToast('AI头像生成成功', 'success')
      } else {
        showCustomToast('AI头像生成成功', 'success')
      }
      
      setShowAvatarActions(false)
    } catch (error) {
      console.error('AI头像生成失败:', error)
      showCustomToast(`AI头像生成失败: ${error.message}`, 'error')
    } finally {
      setIsUploading(false)
      setUploadOperation(null)
    }
  }

  const handleSaveUserInfo = async () => {
    try {
      // 更新authStore中的用户信息
      if (updateUserInfo) {
        await updateUserInfo(editUserInfo)
        setShowUserInfoDialog(false)
        showCustomToast('用户信息已更新', 'success')
      } else {
        // 如果没有updateUserInfo方法，暂时只关闭弹窗
        setShowUserInfoDialog(false)
        showCustomToast('用户信息已保存', 'success')
      }
    } catch {
      showCustomToast('更新失败，请重试', 'error')
    }
  }

  return (
    <div className="container">
      {/* 用户信息卡片 */}
      <div className="user">
        <div
          className="user-avatar"
          onClick={() => setShowAvatarActions(true)}
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt="用户头像"
            />
          ) : (
            <div className="avatar-placeholder">
              <PhotoO size="32px" color="#999" />
              <span>点击上传头像</span>
            </div>
          )}
        </div>
        <div className="user-info">
          <div className="nickname">昵称：{user?.nickname || user?.username || '未设置'}</div>
          <div className="slogan">签名：{user?.signature || '这个人很懒，什么都没留下'}</div>
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
        title={isUploading ? '处理中...' : (avatarPreview ? '确认上传' : '选择头像操作')}
        closeable={false}
        actions={[
          // 如果有预览图片，显示确认和取消选项
          ...(avatarPreview ? [
            {
              name: '确认上传',
              color: '#07c160',
              disabled: isUploading,
              callback: () => {
                if (!isUploading) {
                  confirmUploadAvatar()
                }
              }
            },
            {
              name: '重新选择',
              disabled: isUploading,
              callback: () => {
                if (!isUploading) {
                  cancelUpload()
                  handleAvatarUpload()
                }
              }
            },
            {
              name: '取消',
              disabled: isUploading,
              callback: () => {
                if (!isUploading) {
                  cancelUpload()
                  setShowAvatarActions(false)
                }
              }
            }
          ] : [
            // 如果没有预览图片，显示常规选项
            {
              name: '上传图片',
              disabled: isUploading,
              callback: () => {
                if (!isUploading) {
                  handleAvatarUpload()
                }
              }
            },
            {
              name: 'AI生成头像',
              color: '#1989fa',
              disabled: isUploading,
              callback: () => {
                if (!isUploading) {
                  handleAIGenerateAvatar()
                }
              }
            },
            ...(user?.avatar ? [{
              name: '删除头像',
              color: '#ff4444',
              disabled: isUploading,
              callback: () => {
                if (!isUploading) {
                  handleDeleteAvatar()
                }
              }
            }] : []),
            {
              name: '取消',
              disabled: isUploading,
              callback: () => {
                if (!isUploading) {
                  setShowAvatarActions(false)
                }
              }
            }
          ])
        ]}
      >
        {/* 头像预览区域 - 集成到ActionSheet内部 */}
        {avatarPreview && (
          <div
            style={{
              padding: '20px',
              textAlign: 'center',
              marginBottom: '15px',
              backgroundColor: '#fafafa',
              borderRadius: '8px',
              margin: '10px'
            }}
          >
            <div style={{ marginBottom: '15px', fontSize: '14px', color: '#666' }}>
              头像预览
            </div>
            <img
              src={avatarPreview}
              alt="头像预览"
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #f0f0f0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
            />
          </div>
        )}
      </ActionSheet>

      {/* 头像预览已集成到ActionSheet内部，此处移除独立弹窗 */}

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
              value={editUserInfo.nickname}
              onChange={(value) => setEditUserInfo({ ...editUserInfo, nickname: value })}
              placeholder="请输入昵称"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveUserInfo()
                }
              }}
            />
            <div style={{ fontSize: '12px', color: '#999', marginTop: '5px', marginLeft: '60px' }}>
              昵称用于个性化显示和AI头像生成
            </div>
            <Field
              label="签名"
              value={editUserInfo.signature}
              onChange={(value) => setEditUserInfo({ ...editUserInfo, signature: value })}
              placeholder="请输入个性签名"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveUserInfo()
                }
              }}
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

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
    </div>
  )
}

export default Account