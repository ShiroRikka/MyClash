// 回归测试：读取 ShiroRikka.js，在内存中补充 module.exports 后执行
// 不写入源文件，不引入新依赖（js-yaml 已存在但这里不需要）
"use strict"

const fs = require("fs")
const path = require("path")

const src = fs.readFileSync(path.join(__dirname, "..", "ShiroRikka.js"), "utf8")
const { main } = eval(src + '\nmodule.exports = { main }')

// ===== 测试用例 =====
// 应筛选出的（Reality）
const realityNodes = [
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
]

// 不应筛选出的
const nonRealityNodes = [
  // VLESS 无 reality-opts
  {
    type: "vless", server: "b.com", port: 443, uuid: "x",
    tls: true, sni: "b.com", "client-fingerprint": "chrome",
    network: "ws", "ws-opts": { path: "/" }, encryption: "none",
    name: "NonRealityVless",
  },
  // type 不是 vless
  {
    type: "vmess", server: "c.com", port: 443, uuid: "x",
    tls: true, "reality-opts": { "public-key": "abc" },
    name: "VmessWithReality",
  },
  // VLESS 裸节点
  {
    type: "vless", server: "d.com", port: 443, uuid: "x",
    tls: false, encryption: "none", name: "BareVless",
  },
  // xhttp 但无 reality-opts（回归：之前会被保留，现在应丢弃）
  {
    type: "vless", server: "e.com", port: 443, uuid: "x",
    tls: true, network: "xhttp", "xhttp-opts": { path: "/" },
    "client-fingerprint": "chrome", sni: "e.com", encryption: "none",
    name: "XhttpNoReality",
  },
  // reality-opts 为 null
  {
    type: "vless", server: "f.com", port: 443, uuid: "x",
    tls: true, "reality-opts": null, name: "NullRealityOpts",
  },
  // reality-opts 为空对象
  {
    type: "vless", server: "g.com", port: 443, uuid: "x",
    tls: true, "reality-opts": {}, name: "EmptyRealityOpts",
  },
  // reality-opts 不是对象（脏数据）
  {
    type: "vless", server: "h.com", port: 443, uuid: "x",
    tls: true, "reality-opts": "string", name: "StringRealityOpts",
  },
]

const allProxies = [...realityNodes, ...nonRealityNodes]
const result = main({ proxies: allProxies })

// ===== 验证 =====
let failures = 0

// 1. 总数
const expectedCount = realityNodes.length
const actualCount = result.proxies.length
if (actualCount !== expectedCount) {
  console.error(`❌ 节点数: 预期 ${expectedCount}, 实际 ${actualCount}`)
  failures++
} else {
  console.log(`✅ 节点数: ${actualCount} (预期 ${expectedCount})`)
}

// 2. 每个输出节点都是 vless + reality-opts
for (const p of result.proxies) {
  if (p.type !== "vless") {
    console.error(`❌ ${p.name}: type 应为 vless，实际 ${p.type}`)
    failures++
  }
  if (!p["reality-opts"] || typeof p["reality-opts"] !== "object" || Object.keys(p["reality-opts"]).length === 0) {
    console.error(`❌ ${p.name}: reality-opts 无效`, JSON.stringify(p["reality-opts"]))
    failures++
  }
}

// 3. 所有 Reality 节点都被保留
const outputNames = new Set(result.proxies.map(p => p.name))
for (const n of realityNodes) {
  if (!outputNames.has(n.name)) {
    console.error(`❌ 预期节点缺失: ${n.name}`)
    failures++
  }
}

// 4. 所有非 Reality 节点都被丢弃
for (const n of nonRealityNodes) {
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