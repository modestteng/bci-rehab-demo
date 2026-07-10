import React from 'react'
import ReactDOM from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import App from './App'
import './styles/globals.css'

// 装进 APK 后，Android 会画自己的状态栏和手势条，
// 页面里那套模拟的状态栏 / home indicator 就会重复出现，因此在原生环境下隐藏。
if (Capacitor.isNativePlatform()) {
  document.documentElement.dataset.native = 'true'
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
