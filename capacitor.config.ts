import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.bci.rehab.demo',
  appName: '脑机康复闭环演示',
  // 直接复用 vite 的生产构建产物；资源全部打进 APK，安装后完全离线可用
  webDir: 'dist',
  android: {
    backgroundColor: '#f4fbfe',
  },
}

export default config
