import { useState, useRef } from 'react'
import { Button, Field, NavBar, Uploader, ActionSheet } from 'react-vant'
import { PhotoO, DeleteO } from '@react-vant/icons'
import useDiaryStore from '@/store/diaryStore'
import useAuthStore from '@/store/authStore'
import './index.less'

const Publish = () => {

  const { createDiary } = useDiaryStore()
  const { user } = useAuthStore()
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [images, setImages] = useState([])
  const [mood, setMood] = useState('')
  const [weather, setWeather] = useState('')

  const [showMoodSheet, setShowMoodSheet] = useState(false)
  const [showWeatherSheet, setShowWeatherSheet] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [customToast, setCustomToast] = useState({ show: false, message: '', type: 'info' })
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
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target.result
        console.log('图片转换为base64:', {
          fileName: file.name,
          fileSize: file.size,
          base64Length: base64.length,
          isBase64: base64.startsWith('data:'),
          preview: base64.substring(0, 50) + '...'
        })
        
        // 确保只存储base64数据，不保留file对象
        const newImage = {
          id: Date.now() + Math.random(),
          url: base64,
          content: base64
        }
        setImages(prev => [...prev, newImage])
      }
      reader.onerror = (error) => {
        console.error('图片读取失败:', error)
        showToast('图片读取失败，请重试', 'error')
      }
      reader.readAsDataURL(file)
    })
  }

  // 删除图片
  const handleImageDelete = (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId))
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

  const showToast = (message, type = 'info') => {
    setCustomToast({ show: true, message, type })
    setTimeout(() => {
      setCustomToast({ show: false, message: '', type: 'info' })
    }, 3000)
  }

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      showToast('请填写标题和内容', 'error')
      return
    }

    setPublishing(true)
    try {
      const imageData = images.map(img => img.content || img.url)
      console.log('准备发布的图片数据:', imageData.map((img, index) => ({
        index,
        type: typeof img,
        isBase64: img && img.startsWith && img.startsWith('data:'),
        isBlob: img && img.startsWith && img.startsWith('blob:'),
        length: img ? img.length : 0,
        preview: img ? img.substring(0, 50) + '...' : 'null'
      })))
      
      const diaryData = {
          title: title.trim(),
          content: content.trim(),
          images: imageData,
          mood,
          weather,
          authorId: user?.id,
          author: user?.username || user?.nickname || '匿名用户'
        }

      console.log('开始发布日记:', diaryData)
      const result = await createDiary(diaryData)
      console.log('发布结果:', result)
      
      if (result.success) {
        showToast('🎉 发布成功！', 'success')
        
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
              showToast('正在返回主页...', 'success')
              setTimeout(() => {
                window.location.href = '/'
              }, 2000)
            }
          } catch {
            console.log('无法自动关闭标签页，跳转到主页')
            showToast('正在返回主页...', 'success')
            setTimeout(() => {
              window.location.href = '/'
            }, 2000)
          }
        }, 1500)
      } else {
        showToast(result.error || '发布失败，请重试', 'error')
      }
    } catch (error) {
      console.error('发布失败:', error)
      showToast('发布失败，请重试', 'error')
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
                showToast('最多只能上传9张图片', 'error')
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

      {/* 自定义 Toast */}
      {customToast.show && (
        <div className={`custom-toast custom-toast-${customToast.type}`}>
          {customToast.message}
        </div>
      )}
    </div>
  )
}

export default Publish