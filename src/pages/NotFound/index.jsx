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
    <main className="not-found">
      <div className="not-found-container">
        <header className="not-found-icon">
          <div className="icon-404">404</div>
        </header>

        <section className="not-found-content">
          <h1 className="not-found-title">页面走丢了</h1>
          <p className="not-found-description">
            抱歉，您访问的页面不存在或已被移除
          </p>
        </section>

        <nav className="not-found-actions">
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
        </nav>
      </div>
    </main>
  )
}

export default NotFound