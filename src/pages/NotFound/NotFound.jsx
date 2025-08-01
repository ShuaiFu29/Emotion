import {
  useNavigate
} from 'react-router-dom'
import './NotFound.less'

const NotFound = () => {
  const navigate = useNavigate()

  const handleGoBack = () => {
    navigate(-1)
  }

  const handleGoHome = () => {
    navigate('/')
  }

  return (
    <div className="not-found">
      <div className="not-found-container">
        <div className="not-found-icon">
          <div className="icon-404">404</div>
        </div>

        <div className="not-found-content">
          <h2 className="not-found-title">页面走丢了</h2>
          <p className="not-found-description">
            抱歉，您访问的页面不存在或已被移除
          </p>
        </div>

        <div className="not-found-actions">
          <button
            className="btn btn-secondary"
            onClick={handleGoBack}
          >
            返回上页
          </button>
          <button
            className="btn btn-primary"
            onClick={handleGoHome}
          >
            回到首页
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotFound 