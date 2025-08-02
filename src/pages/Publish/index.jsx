import { useState } from 'react'
import { Button, Field, Toast, NavBar } from 'react-vant'
import { useNavigate } from 'react-router-dom'
import './index.less'

const Publish = () => {
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')

  const handlePublish = () => {
    if (!title.trim() || !content.trim()) {
      Toast.fail('请填写标题和内容')
      return
    }

    // 这里可以添加发布逻辑
    Toast.success('发布成功！')
    navigate('/home')
  }

  return (
    <div className="publish-page">
      <NavBar
        title="发布日记"
        leftText="取消"
        rightText="发布"
        onClickLeft={() => navigate(-1)}
        onClickRight={handlePublish}
      />

      <div className="publish-content">
        <Field
          label="标题"
          value={title}
          onChange={setTitle}
          placeholder="请输入日记标题"
          className="title-field"
        />

        <Field
          label="内容"
          value={content}
          onChange={setContent}
          placeholder="分享你的心情..."
          type="textarea"
          rows={10}
          className="content-field"
        />

        <div className="publish-actions">
          <Button
            type="primary"
            size="large"
            onClick={handlePublish}
            className="publish-btn"
          >
            发布日记
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Publish