import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, unlinkSync, mkdirSync, copyFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const isWindows = process.platform === 'win32'
// shell: true 下 cmd 不会从 cwd 解析 gradlew.bat，必须给绝对路径（并加引号，路径含中文/可能含空格）
const gradlew = `"${resolve('android', isWindows ? 'gradlew.bat' : 'gradlew')}"`

const env = { ...process.env }
// 本机的 Gradle 缓存放在纯 ASCII 路径下（用户目录含中文，且缓存很大）
if (!env.GRADLE_USER_HOME && existsSync('D:/gradle-home')) {
  env.GRADLE_USER_HOME = 'D:\\gradle-home'
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: true, env, ...options })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

/** 清掉 dist 里的历史 hash 产物，避免旧 bundle 被一起打进 APK */
function cleanDistAssets() {
  const dir = 'dist/assets'
  if (!existsSync(dir)) {
    return
  }
  for (const file of readdirSync(dir)) {
    unlinkSync(join(dir, file))
  }
}

cleanDistAssets()
run('npm', ['run', 'build'])
run('npx', ['cap', 'sync', 'android'])
run(gradlew, ['assembleRelease'], { cwd: 'android' })

const apk = 'android/app/build/outputs/apk/release/app-release.apk'
if (!existsSync(apk)) {
  console.error('构建结束但未找到 APK：', apk)
  process.exit(1)
}

mkdirSync('release', { recursive: true })
const target = 'release/脑机康复闭环演示.apk'
copyFileSync(apk, target)
console.log(`\n✓ APK 已生成：${target}`)
