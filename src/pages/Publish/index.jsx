import { useState, useRef } from 'react'
import { Button, Field, NavBar, Uploader, Tag, ActionSheet } from 'react-vant'
import { PhotoO, DeleteO, Add } from '@react-vant/icons'
import { Toast } from '@/utils/toast'
import useDiaryStore from '@/store/diaryStore'
import './index.less'

const Publish = () => {

  const { createDiary } = useDiaryStore()
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [images, setImages] = useState([])
  const [tags, setTags] = useState([])
  const [newTag, setNewTag] = useState('')
  const [mood, setMood] = useState('')
  const [weather, setWeather] = useState('')

  const [showMoodSheet, setShowMoodSheet] = useState(false)
  const [showWeatherSheet, setShowWeatherSheet] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const fileInputRef = useRef(null)

  // 心情选项
  const moodOptions = [
    { name: '😊 开心', value: 'happy' },
    { name: '😢 难过', value: 'sad' },
    { name: '😴 平静', value: 'calm' },
    { name: '😤 愤怒', value: 'angry' },
    { name: '😰 焦虑', value: 'anxious' },
    { name: '🤔 思考', value: 'thoughtful' },
    { name: '😍 兴奋', value: 'excited' },
    { name: '😌 满足', value: 'satisfied' }
  ]

  // 天气选项
  const weatherOptions = [
    { name: '☀️ 晴天', value: '晴' },
    { name: '⛅ 多云', value: '多云' },
    { name: '🌧️ 雨天', value: '雨' },
    { name: '❄️ 雪天', value: '雪' },
    { name: '🌫️ 雾天', value: '雾' },
    { name: '🌪️ 风天', value: '风' }
  ]

  // 处理图片上传
  const handleImageUpload = (files) => {
    const newImages = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      url: URL.createObjectURL(file),
      content: file
    }))
    setImages(prev => [...prev, ...newImages])
  }

  // 删除图片
  const handleImageDelete = (imageId) => {
    setImages(prev => {
      const updated = prev.filter(img => img.id !== imageId)
      // 清理URL对象
      const deletedImg = prev.find(img => img.id === imageId)
      if (deletedImg && deletedImg.url) {
        URL.revokeObjectURL(deletedImg.url)
      }
      return updated
    })
  }

  // 添加标签
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 5) {
      setTags(prev => [...prev, newTag.trim()])
      setNewTag('')
    }
  }

  // 删除标签
  const handleDeleteTag = (tagToDelete) => {
    setTags(prev => prev.filter(tag => tag !== tagToDelete))
  }

  // 选择心情
  const handleMoodSelect = (selectedMood) => {
    setMood(selectedMood.value)
    setShowMoodSheet(false)
  }

  // 选择天气
  const handleWeatherSelect = (selectedWeather) => {
    setWeather(selectedWeather.value)
    setShowWeatherSheet(false)
  }

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      Toast.fail('请填写标题和内容')
      return
    }

    setPublishing(true)
    try {
      const diaryData = {
          title: title.trim(),
          content: content.trim(),
          images: images.map(img => img.url || img.content),
          tags,
          mood,
          weather
        }

      console.log('开始发布日记:', diaryData)
      const result = await createDiary(diaryData)
      console.log('发布结果:', result)
      
      if (result.success) {
        Toast.success('发布成功！')
        
        // 跨标签通信：通知其他标签页更新数据
        try {
          if (window.BroadcastChannel) {
            const channel = new BroadcastChannel('diary-updates')
            channel.postMessage({
              type: 'NEW_DIARY_PUBLISHED',
              data: result.data
            })
            channel.close()
            console.log('跨标签页通信发送成功')
          }
        } catch (broadcastError) {
          console.error('跨标签页通信失败:', broadcastError)
        }
        
        // 尝试关闭标签页，如果失败则提供替代方案
        setTimeout(() => {
          try {
            // 检查是否可以关闭窗口
            if (window.opener || window.history.length === 1) {
              window.close()
            } else {
              // 如果无法关闭，显示提示并跳转到主页
              Toast.success('正在返回主页...', 2000)
              setTimeout(() => {
                window.location.href = '/'
              }, 2000)
            }
          } catch {
            console.log('无法自动关闭标签页，跳转到主页')
            Toast.success('正在返回主页...', 2000)
            setTimeout(() => {
              window.location.href = '/'
            }, 2000)
          }
        }, 1500)
      } else {
        Toast.fail(result.error || '发布失败，请重试')
      }
    } catch (error) {
      console.error('发布失败:', error)
      Toast.fail('发布失败，请重试')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="publish-page">
      <NavBar
        title="发布日记"
        leftText="取消"
        rightText={publishing ? "发布中..." : "发布"}
        onClickLeft={() => {
          try {
            window.close()
          } catch {
            window.location.href = '/'
          }
        }}
        onClickRight={handlePublish}
      />

      <div className="publish-content">
        {/* 标题输入 */}
        <Field
          label="标题"
          value={title}
          onChange={setTitle}
          placeholder="请输入日记标题"
          className="title-field"
          maxLength={50}
          showWordLimit
        />

        {/* 内容输入 */}
        <Field
          label="内容"
          value={content}
          onChange={setContent}
          placeholder="分享你的心情..."
          type="textarea"
          rows={8}
          className="content-field"
          maxLength={1000}
          showWordLimit
        />

        {/* 图片上传区域 */}
        <div className="image-upload-section">
          <div className="section-title">添加图片</div>
          <div className="image-grid">
            {images.map(image => (
              <div key={image.id} className="image-item">
                <img src={image.url} alt="上传的图片" />
                <div 
                  className="delete-btn"
                  onClick={() => handleImageDelete(image.id)}
                >
                  <DeleteO size="16px" />
                </div>
              </div>
            ))}
            {images.length < 9 && (
              <div className="upload-btn" onClick={() => fileInputRef.current?.click()}>
                <PhotoO size="24px" />
                <span>添加图片</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              const files = Array.from(e.target.files || [])
              if (files.length + images.length > 9) {
                Toast.fail('最多只能上传9张图片')
                return
              }
              handleImageUpload(files)
              e.target.value = ''
            }}
          />
        </div>

        {/* 心情和天气选择 */}
        <div className="mood-weather-section">
          <div className="mood-weather-row">
            <div 
              className="mood-selector"
              onClick={() => setShowMoodSheet(true)}
            >
              <span className="label">心情:</span>
              <span className="value">{mood || '选择心情'}</span>
            </div>
            <div 
              className="weather-selector"
              onClick={() => setShowWeatherSheet(true)}
            >
              <span className="label">天气:</span>
              <span className="value">{weather || '选择天气'}</span>
            </div>
          </div>
        </div>

        {/* 标签管理 */}
        <div className="tags-section">
          <div className="section-title">添加标签</div>
          <div className="tags-input">
            <Field
              value={newTag}
              onChange={setNewTag}
              placeholder="输入标签"
              maxLength={10}
            />
            <Button 
              type="primary" 
              size="small"
              onClick={handleAddTag}
              disabled={!newTag.trim() || tags.length >= 5}
            >
              添加
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="tags-list">
              {tags.map((tag, index) => (
                <Button
                  key={index}
                  size="mini"
                  className="tag-item"
                  onClick={() => handleDeleteTag(tag)}
                >
                  {tag} ×
                </Button>
              ))}
            </div>
          )}
          {tags.length >= 5 && (
            <div className="tag-limit-tip">最多添加5个标签</div>
          )}
        </div>

        {/* 发布按钮 */}
        <div className="publish-actions">
          <Button
            type="primary"
            size="large"
            onClick={handlePublish}
            loading={publishing}
            className="publish-btn"
          >
            {publishing ? '发布中...' : '发布日记'}
          </Button>
        </div>
      </div>

      {/* 心情选择弹窗 */}
      <ActionSheet
        visible={showMoodSheet}
        onCancel={() => setShowMoodSheet(false)}
        title="选择心情"
        actions={moodOptions.map(mood => ({
          name: mood.name,
          callback: () => handleMoodSelect(mood)
        }))}
        closeable={false}
      />

      {/* 天气选择弹窗 */}
      <ActionSheet
        visible={showWeatherSheet}
        onCancel={() => setShowWeatherSheet(false)}
        title="选择天气"
        actions={weatherOptions.map(weather => ({
          name: weather.name,
          callback: () => handleWeatherSelect(weather)
        }))}
        closeable={false}
      />
    </div>
  )
}

export default Publish