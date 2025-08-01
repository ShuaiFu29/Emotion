import {
  useState,
  useEffect
} from 'react'
import {
  useNavigate,
  Link
} from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import './index.less'

const Login = () => {
  const navigate = useNavigate()
  const { login, loading, error, isAuthenticated, clearError } = useAuthStore()

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home')
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    return () => {
      clearError()
    }
  }, [clearError])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      return
    }

    const result = await login(formData)
    if (result.success) {
      navigate('/home')
    }
  }

  return (
    <main className="login-container">
      <header className="login-header">
        <h1 className="login-title">欢迎回来</h1>
        <p className="login-subtitle">请登录您的账户</p>
      </header>

      <form className="login-form" onSubmit={handleSubmit}>
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="email">邮箱</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="请输入您的邮箱"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">密码</label>
          <div className="password-input">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="请输入您的密码"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="login-button"
          disabled={loading}
        >
          {loading ? '登录中...' : '登录'}
        </button>

        <footer className="login-footer">
          <p>
            还没有账户？
            <Link to="/register" className="register-link">
              立即注册
            </Link>
          </p>
        </footer>
      </form>
    </main>
  )
}

export default Login