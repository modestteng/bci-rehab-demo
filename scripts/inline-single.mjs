import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const OUT_DIR = 'dist-single'
const HTML = join(OUT_DIR, 'index.html')
const JS = join(OUT_DIR, 'app.js')
const CSS = join(OUT_DIR, 'app.css')
const FRIENDLY = join(OUT_DIR, '脑机协同康复机械臂闭环可视化系统.html')

if (!existsSync(HTML) || !existsSync(JS)) {
  console.error('缺少构建产物，请先运行 vite build --config vite.single.config.ts')
  process.exit(1)
}

let html = readFileSync(HTML, 'utf8')
const js = readFileSync(JS, 'utf8')
const css = existsSync(CSS) ? readFileSync(CSS, 'utf8') : ''

// 出现在 JS/CSS 里的 </script、</style 只可能位于字符串或注释中，转义后不改变语义
const safeJs = js.replace(/<\/script/gi, '<\\/script')
const safeCss = css.replace(/<\/style/gi, '<\\/style')

const scriptTag = /<script\b[^>]*\bsrc=["'][^"']*app\.js["'][^>]*><\/script>/i
const linkTag = /<link\b[^>]*\bhref=["'][^"']*app\.css["'][^>]*>/i

if (!scriptTag.test(html)) {
  console.error('未在 index.html 中找到 app.js 的 <script> 标签，内联失败')
  process.exit(1)
}

if (!html.includes('</body>')) {
  console.error('index.html 缺少 </body>，无法安放内联脚本')
  process.exit(1)
}

// 内联脚本必须搬到 </body> 之前：原来的 type="module" 在 <head> 里是默认 defer 的，
// 而内联的经典脚本会立即执行——那时 <div id="root"> 还不存在，React 挂载会失败。
// 用 iife（经典脚本）而非 module，是为了让 file:// 下不受 module script 的 CORS 限制。
// 替换一律用 replacer 函数：产物里含 $& / $` / $' 等序列，
// 作为替换字符串会被 String.replace 当成替换模式展开。
html = html.replace(scriptTag, () => '')
html = html.replace('</body>', () => `<script>${safeJs}</script></body>`)

if (safeCss) {
  html = linkTag.test(html)
    ? html.replace(linkTag, () => `<style>${safeCss}</style>`)
    : html.replace('</head>', () => `<style>${safeCss}</style></head>`)
}

// 自检：内联后不允许再残留任何对外部文件的引用
const leftover = html.match(/<(?:script|link)\b[^>]*\b(?:src|href)=["'][^"']*app\.(?:js|css)["']/gi)
if (leftover) {
  console.error(`内联失败：仍残留 ${leftover.length} 处外部引用 ->`, leftover[0])
  process.exit(1)
}
if (/<script\b[^>]*type=["']module["']/i.test(html)) {
  console.error('内联失败：仍存在 type="module" 脚本标签，file:// 下会被 CORS 拦截')
  process.exit(1)
}

writeFileSync(HTML, html, 'utf8')
writeFileSync(FRIENDLY, html, 'utf8')

for (const leftoverFile of [JS, CSS]) {
  if (existsSync(leftoverFile)) {
    unlinkSync(leftoverFile)
  }
}

if (existsSync(JS) || existsSync(CSS)) {
  console.error('清理失败：dist-single 下仍残留 app.js / app.css，请手动删除后再分发')
  process.exit(1)
}

const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(0)
console.log(`✓ 单文件已生成：${FRIENDLY}（${kb} kB，双击即可离线打开）`)
