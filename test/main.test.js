// 回归测试：读取 ShiroRikka.js，在内存中补充 module.exports 后执行
// 不写入源文件，不引入新依赖（js-yaml 已存在但这里不需要）
"use strict"

const fs = require("fs")
const path = require("path")

const src = fs.readFileSync(path.join(__dirname, "..", "ShiroRikka.js"), "utf8")
const { main } = eval(src + '\nmodule.exports = { main }')

// ===== 测试用例 =====
// 应保留的 VLESS 节点（不再筛选 reality-opts）
const vlessNodes = [
  {
    type: "vless", server: "88.218.44.4", port: 443, uuid: "x",
    tls: true, sni: "swcdn.apple.com", "client-fingerprint": "firefox",
    "reality-opts": { "public-key": "Nnpwm8dqFl9dlMJmg0M9G11vmgCKzNagFTn4tH4sWy4", "short-id": "" },
    encryption: "none", udp: true, name: "RealityNode1",
  },
  {
    type: "vless", server: "a.com", port: 443, uuid: "x",
    tls: true, "reality-opts": { "public-key": "abc", "short-id": "123" },
    encryption: "none", network: "tcp", "client-fingerprint": "chrome",
    sni: "www.microsoft.com", name: "RealityNode2",
  },
  {
    type: "vless", server: "b.com", port: 443, uuid: "x",
    tls: true, sni: "b.com", "client-fingerprint": "chrome",
    network: "ws", "ws-opts": { path: "/" }, encryption: "none",
    name: "WsVless",
  },
  {
    type: "vless", server: "d.com", port: 443, uuid: "x",
    tls: false, encryption: "none", name: "BareVless",
  },
  {
    type: "vless", server: "e.com", port: 443, uuid: "x",
    tls: true, network: "xhttp", "xhttp-opts": { path: "/" },
    "client-fingerprint": "chrome", sni: "e.com", encryption: "none",
    name: "XhttpVless",
  },
  {
    type: "vless", server: "f.com", port: 443, uuid: "x",
    tls: true, "reality-opts": null, name: "NullRealityOpts",
  },
  {
    type: "vless", server: "g.com", port: 443, uuid: "x",
    tls: true, "reality-opts": {}, name: "EmptyRealityOpts",
  },
  {
    type: "vless", server: "h.com", port: 443, uuid: "x",
    tls: true, "reality-opts": "string", name: "StringRealityOpts",
  },
]

// 不应保留的节点（非 vless 协议）
const nonVlessNodes = [
  {
    type: "vmess", server: "c.com", port: 443, uuid: "x",
    tls: true, "reality-opts": { "public-key": "abc" },
    name: "VmessWithReality",
  },
  {
    type: "shadowsocks", server: "s.com", port: 443, password: "p", cipher: "aes-256-gcm",
    name: "SsNode",
  },
]

const allProxies = [...vlessNodes, ...nonVlessNodes]
const result = main({ proxies: allProxies })

// ===== 验证 =====
let failures = 0

// 1. 总数
const expectedCount = vlessNodes.length
const actualCount = result.proxies.length
if (actualCount !== expectedCount) {
  console.error(`❌ 节点数: 预期 ${expectedCount}, 实际 ${actualCount}`)
  failures++
} else {
  console.log(`✅ 节点数: ${actualCount} (预期 ${expectedCount})`)
}

// 2. 每个输出节点都是 vless
for (const p of result.proxies) {
  if (p.type !== "vless") {
    console.error(`❌ ${p.name}: type 应为 vless，实际 ${p.type}`)
    failures++
  }
}

// 3. 所有 VLESS 节点都被保留
const outputNames = new Set(result.proxies.map(p => p.name))
for (const n of vlessNodes) {
  if (!outputNames.has(n.name)) {
    console.error(`❌ 预期节点缺失: ${n.name}`)
    failures++
  }
}

// 4. 所有非 VLESS 节点都被丢弃
for (const n of nonVlessNodes) {
  if (outputNames.has(n.name)) {
    console.error(`❌ 不应保留的节点出现: ${n.name}`)
    failures++
  }
}

// 5. 输出节点名
console.log(`输出: [${result.proxies.map(p => p.name).join(", ")}]`)

if (failures === 0) {
  console.log(`\n🎉 全部通过，${allProxies.length} 进 ${actualCount} 出`)
  process.exit(0)
} else {
  console.error(`\n💥 ${failures} 项失败`)
  process.exit(1)
}