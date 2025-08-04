// Toast工具函数

// Toast管理器
class ToastManager {
  constructor() {
    this.toasts = []
    this.container = null
    this.createContainer()
  }

  createContainer() {
    if (!this.container) {
      this.container = document.createElement('div')
      this.container.className = 'custom-toast-container'
      document.body.appendChild(this.container)
    }
  }

  show(message, type = 'info', duration = 3000) {
    const id = Date.now() + Math.random()
    const toast = {
      id,
      message,
      type,
      duration
    }

    this.toasts.push(toast)
    this.render()

    // 自动移除
    setTimeout(() => {
      this.remove(id)
    }, duration + 300)
  }

  remove(id) {
    this.toasts = this.toasts.filter(toast => toast.id !== id)
    this.render()
  }

  render() {
    if (!this.container) return

    // 清空容器
    this.container.innerHTML = ''

    // 渲染所有toast
    this.toasts.forEach(toast => {
      const toastElement = document.createElement('div')
      toastElement.className = `custom-toast custom-toast--${toast.type} custom-toast--visible`
      toastElement.innerHTML = `
        <span class="custom-toast__icon">${this.getIcon(toast.type)}</span>
        <span class="custom-toast__message">${toast.message}</span>
      `
      this.container.appendChild(toastElement)
    })
  }

  getIcon(type) {
    switch (type) {
      case 'success':
        return '✅'
      case 'error':
      case 'fail':
        return '❌'
      case 'warning':
        return '⚠️'
      case 'loading':
        return '⏳'
      default:
        return 'ℹ️'
    }
  }
}

// 创建全局实例
const toastManager = new ToastManager()

// 导出Toast方法
export const Toast = {
  success: (message, duration = 3000) => toastManager.show(message, 'success', duration),
  fail: (message, duration = 3000) => toastManager.show(message, 'fail', duration),
  error: (message, duration = 3000) => toastManager.show(message, 'error', duration),
  warning: (message, duration = 3000) => toastManager.show(message, 'warning', duration),
  info: (message, duration = 3000) => toastManager.show(message, 'info', duration),
  loading: (message, duration = 3000) => toastManager.show(message, 'loading', duration)
}