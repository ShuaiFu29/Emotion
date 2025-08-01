import React, { useState } from 'react'
import { ActionSheet, Grid, Toast, Cell } from 'react-vant'
import {
  SettingO,
  StarO,
  LikeO,
  ServiceO,
  FriendsO,
  AddO,
  CartO,
  ChatO,
  FireO,
  Search,
  HomeO,
  UserO,
  Arrow
} from '@react-vant/icons'
import { useNavigate } from 'react-router-dom'
import './index.less'

const Account = () => {
  const navigate = useNavigate()
  const [showAvatarActions, setShowAvatarActions] = useState(false)

  // 主要功能选项
  const mainFeatures = [
    { icon: <ServiceO />, text: '服务', action: 'service' },
    { icon: <StarO />, text: '收藏', action: 'collection' },
    { icon: <FriendsO />, text: '朋友圈', action: 'friends' },
    { icon: <SettingO />, text: '设置', action: 'settings' }
  ]

  // 九宫格功能项
  const gridItems = [
    { icon: <AddO />, text: '添加', color: '#666' },
    { icon: <CartO />, text: '购物车', color: '#666' },
    { icon: <ChatO />, text: '聊天', color: '#666' },
    { icon: <FireO />, text: '热门', color: '#666' },
    { icon: <LikeO />, text: '喜欢', color: '#666' },
    { icon: <StarO />, text: '收藏', color: '#666' },
    { icon: <Search />, text: '搜索', color: '#666' },
    { icon: <HomeO />, text: '首页', color: '#666' },
    { icon: <UserO />, text: '我的', color: '#666' }
  ]

  const handleMainFeatureClick = (item) => {
    if (item.action === 'settings') {
      navigate('/profile')
    } else {
      Toast.info(`${item.text}功能开发中...`)
    }
  }

  const handleGridItemClick = (item) => {
    Toast.info(`${item.text}功能开发中...`)
  }

  return (
    <div className="account-page">
      {/* 用户信息卡片 */}
      <div className="user-info-card">
        <div 
          className="user-avatar"
          onClick={() => setShowAvatarActions(true)}
        >
          <img 
            src="https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cat%20portrait%20realistic%20photo&image_size=square" 
            alt="用户头像" 
          />
        </div>
        <div className="user-info">
          <div className="user-name">昵称：莉莉</div>
          <div className="user-level">等级：5级</div>
          <div className="user-signature">签名：保持热爱，奔赴山海。</div>
        </div>
      </div>

      {/* 主要功能选项 */}
      <div className="main-features">
        {mainFeatures.map((item, index) => (
          <Cell
             key={index}
             icon={item.icon}
             title={item.text}
             isLink
             onClick={() => handleMainFeatureClick(item)}
             className="feature-cell"
           />
        ))}
      </div>

      {/* 九宫格功能区域 */}
      <div className="grid-section">
        <Grid columnNum={3} gutter={0}>
          {gridItems.map((item, index) => (
            <Grid.Item
              key={index}
              onClick={() => handleGridItemClick(item)}
              className="grid-item"
            >
              <div className="grid-item-content">
                <div className="grid-icon">
                  {item.icon}
                </div>
                <span className="grid-text">{item.text}</span>
              </div>
            </Grid.Item>
          ))}
        </Grid>
      </div>

      {/* 头像操作弹窗 */}
      <ActionSheet
        visible={showAvatarActions}
        onCancel={() => setShowAvatarActions(false)}
        title="选择头像操作"
      >
        <ActionSheet.Action
          name="上传头像"
          onClick={() => {
            setShowAvatarActions(false)
            Toast.info('上传头像功能开发中...')
          }}
        />
        <ActionSheet.Action
          name="AI生成头像"
          onClick={() => {
            setShowAvatarActions(false)
            Toast.info('AI生成头像功能开发中...')
          }}
        />
        <ActionSheet.Action
          name="取消"
          onClick={() => setShowAvatarActions(false)}
        />
      </ActionSheet>
    </div>
  )
}

export default Account