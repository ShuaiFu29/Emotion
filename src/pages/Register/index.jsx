import {
  useState,
  useEffect
} from 'react'
import {
  useNavigate,
  Link
} from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import './Register.less'

const Register = () => {
  const navigate = useNavigate()
  const { register, loading, error, isAuthenticated, clearError } = useAuthStore()

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})

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

    // 清除对应字段的验证错误
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.username.trim()) {
      errors.username = '用户名不能为空'
    } else if (formData.username.length < 3) {
      errors.username = '用户名至少3个字符'
    }

    if (!formData.email.trim()) {
      errors.email = '邮箱不能为空'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '请输入有效的邮箱地址'
    }

    if (!formData.password) {
      errors.password = '密码不能为空'
    } else if (formData.password.length < 6) {
      errors.password = '密码至少6个字符'
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = '请确认密码'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const { confirmPassword: _, ...registerData } = formData
    const result = await register(registerData)
    if (result.success) {
      navigate('/home')
    }
  }

  return (
    <main className="register-container">
      <header className="register-header">
        <h1 className="register-title">创建账户</h1>
        <p className="register-subtitle">加入我们，开始您的旅程</p>
      </header>

      <form className="register-form" onSubmit={handleSubmit}>
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="username">用户名</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            placeholder="请输入用户名"
            className={validationErrors.username ? 'error' : ''}
          />
          {validationErrors.username && (
            <span className="field-error">{validationErrors.username}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email">邮箱</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="请输入您的邮箱"
            className={validationErrors.email ? 'error' : ''}
          />
          {validationErrors.email && (
            <span className="field-error">{validationErrors.email}</span>
          )}
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
              placeholder="请输入密码（至少6位）"
              className={validationErrors.password ? 'error' : ''}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {validationErrors.password && (
            <span className="field-error">{validationErrors.password}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">确认密码</label>
          <div className="password-input">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="请再次输入密码"
              className={validationErrors.confirmPassword ? 'error' : ''}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {validationErrors.confirmPassword && (
            <span className="field-error">{validationErrors.confirmPassword}</span>
          )}
        </div>

        <button
          type="submit"
          className="register-button"
          disabled={loading}
        >
          {loading ? '注册中...' : '注册'}
        </button>

        <footer className="register-footer">
          <p>
            已有账户？
            <Link to="/login" className="login-link">
              立即登录
            </Link>
          </p>
        </footer>
      </form>
    </main>
  )
}

export default Register