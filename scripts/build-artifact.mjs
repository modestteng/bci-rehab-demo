import { readFileSync, writeFileSync } from 'node:fs'

/**
 * 把 dist-single 的单文件产物改造成 Artifact 可发布的页面片段。
 * Artifact 会在发布时自动补上 <!doctype>/<html>/<head>/<body> 外壳，
 * 因此这里只能输出 <title> + <style> + 内容 + <script>，不能带自己的骨架标签。
 */
const SOURCE = process.argv[2] ?? 'dist-single/index.html'
const TARGET = process.argv[3]

if (!TARGET) {
  console.error('用法: node scripts/build-artifact.mjs <源 html> <目标 html>')
  process.exit(1)
}

const html = readFileSync(SOURCE, 'utf8')

function sliceTag(source, tag) {
  const open = source.indexOf(`<${tag}>`)
  const close = source.lastIndexOf(`</${tag}>`)
  if (open === -1 || close === -1 || close < open) {
    throw new Error(`未能在 ${SOURCE} 中定位 <${tag}> 块`)
  }
  return source.slice(open + tag.length + 2, close)
}

// CSS 里的 </style 与 JS 里的 </script 在内联时已被转义，所以首尾定位是安全的
const css = sliceTag(html, 'style')
const js = sliceTag(html, 'script')

if (js.length < 100_000) {
  throw new Error(`提取到的脚本只有 ${js.length} 字节，疑似定位错误`)
}

// 这是一个刻意选定的浅色医疗风产品 UI，不随查看者的深色主题反转。
// Artifact 的主题切换会在根元素上打 data-theme，这里用更高优先级把底色钉死。
const themeLock = `
:root,
:root[data-theme='light'],
:root[data-theme='dark'] {
  color-scheme: light;
}

:root[data-theme='light'] body,
:root[data-theme='dark'] body,
body {
  margin: 0;
  color: #16323f;
  background:
    radial-gradient(circle at 14% 8%, rgba(79, 182, 230, 0.18), transparent 26%),
    radial-gradient(circle at 82% 10%, rgba(124, 108, 240, 0.14), transparent 22%),
    radial-gradient(circle at 75% 90%, rgba(47, 198, 173, 0.12), transparent 20%),
    linear-gradient(180deg, #f8fdff 0%, #eff8fc 42%, #f6fbfe 100%);
}
`.trim()

const out = `<title>脑机协同康复机械臂闭环可视化系统</title>
<style>
${css}
</style>
<style>
${themeLock}
</style>

<div id="root"></div>
<noscript>
  <div style="max-width: 420px; margin: 80px auto; padding: 0 24px; font-family: system-ui, sans-serif; color: #16323f; line-height: 1.7">
    <h1 style="font-size: 1.1rem">脑机协同康复机械臂闭环可视化系统</h1>
    <p>本演示需要启用 JavaScript。请在浏览器设置中开启后刷新，或改用 Chrome / Edge 打开。</p>
  </div>
</noscript>

<script>${js}</script>
`

for (const forbidden of ['<!doctype', '<html', '<head>', '<body']) {
  if (out.slice(0, out.indexOf('<script>')).toLowerCase().includes(forbidden)) {
    throw new Error(`产物中残留骨架标签 ${forbidden}`)
  }
}

writeFileSync(TARGET, out, 'utf8')
console.log(`OK: ${TARGET} (${(Buffer.byteLength(out, 'utf8') / 1024).toFixed(0)} kB, css ${(css.length / 1024).toFixed(0)} kB, js ${(js.length / 1024).toFixed(0)} kB)`)
