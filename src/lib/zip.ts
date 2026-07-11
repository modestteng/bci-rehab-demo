/**
 * 极简 ZIP 写入器（仅 STORED，无压缩）。
 *
 * .docx 本质上就是一个装着若干 XML 的 ZIP 包，因此手写一个 ZIP 写入器
 * 就能在浏览器里生成真正的 Word 文档 —— 不引入任何第三方库，
 * 也不发起任何网络请求，符合本项目「数据不出端」的约束。
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i += 1) {
    let c = i
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[i] = c >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i += 1) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

export type ZipEntry = { name: string; content: string }

/** 固定时间戳，使同样的内容每次生成的字节完全一致 */
const DOS_TIME = 0
const DOS_DATE = 0x2821 // 2020-01-01

export function createZip(entries: ZipEntry[]): Blob {
  const encoder = new TextEncoder()
  const chunks: Uint8Array[] = []
  const central: Uint8Array[] = []
  let offset = 0

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name)
    const data = encoder.encode(entry.content)
    const crc = crc32(data)

    const local = new Uint8Array(30 + nameBytes.length)
    const lv = new DataView(local.buffer)
    lv.setUint32(0, 0x04034b50, true) // 本地文件头签名
    lv.setUint16(4, 20, true) // 解压所需版本
    lv.setUint16(6, 0x0800, true) // 标志位：文件名为 UTF-8
    lv.setUint16(8, 0, true) // 压缩方法：0 = STORED
    lv.setUint16(10, DOS_TIME, true)
    lv.setUint16(12, DOS_DATE, true)
    lv.setUint32(14, crc, true)
    lv.setUint32(18, data.length, true) // 压缩后大小
    lv.setUint32(22, data.length, true) // 原始大小
    lv.setUint16(26, nameBytes.length, true)
    lv.setUint16(28, 0, true) // 扩展字段长度
    local.set(nameBytes, 30)

    chunks.push(local, data)

    const dir = new Uint8Array(46 + nameBytes.length)
    const dv = new DataView(dir.buffer)
    dv.setUint32(0, 0x02014b50, true) // 中央目录签名
    dv.setUint16(4, 20, true) // 创建版本
    dv.setUint16(6, 20, true) // 解压所需版本
    dv.setUint16(8, 0x0800, true)
    dv.setUint16(10, 0, true)
    dv.setUint16(12, DOS_TIME, true)
    dv.setUint16(14, DOS_DATE, true)
    dv.setUint32(16, crc, true)
    dv.setUint32(20, data.length, true)
    dv.setUint32(24, data.length, true)
    dv.setUint16(28, nameBytes.length, true)
    dv.setUint16(30, 0, true)
    dv.setUint16(32, 0, true) // 文件注释长度
    dv.setUint16(34, 0, true) // 磁盘号
    dv.setUint16(36, 0, true) // 内部属性
    dv.setUint32(38, 0, true) // 外部属性
    dv.setUint32(42, offset, true) // 本地文件头偏移
    dir.set(nameBytes, 46)
    central.push(dir)

    offset += local.length + data.length
  }

  const centralSize = central.reduce((sum, part) => sum + part.length, 0)

  const end = new Uint8Array(22)
  const ev = new DataView(end.buffer)
  ev.setUint32(0, 0x06054b50, true) // 中央目录结束签名
  ev.setUint16(4, 0, true)
  ev.setUint16(6, 0, true)
  ev.setUint16(8, entries.length, true)
  ev.setUint16(10, entries.length, true)
  ev.setUint32(12, centralSize, true)
  ev.setUint32(16, offset, true) // 中央目录起始偏移
  ev.setUint16(20, 0, true)

  const parts = [...chunks, ...central, end]
  const total = parts.reduce((sum, part) => sum + part.length, 0)
  const out = new Uint8Array(total)
  let cursor = 0
  for (const part of parts) {
    out.set(part, cursor)
    cursor += part.length
  }

  return new Blob([out], { type: 'application/zip' })
}
