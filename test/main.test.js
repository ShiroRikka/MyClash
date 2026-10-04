// 回归测试：读取 ShiroRikka.js，在内存中补充 module.exports 后执行
"use strict"

const fs = require("fs")
const path = require("path")

const src = fs.readFileSync(path.join(__dirname, "..", "ShiroRikka.js"), "utf8")
const { main } = eval(src + '\nmodule.exports = { main }')

// ===== 测试用例 =====
// 应保留的节点（覆盖脚本支持的全部协议 + 别名）
const keepNodes = [
  { type: "vless", name: "Vless1", server: "a.com", port: 443, uuid: "x", encryption: "none" },
  { type: "vless", name: "Vless2", server: "b.com", port: 443, uuid: "x", encryption: "none" },
  { type: "vmess", name: "Vmess1", server: "c.com", port: 443, uuid: "x", method: "auto", security: "auto" },
  { type: "ss", name: "Ss1", server: "d.com", port: 443, password: "p", method: "aes-256-gcm" },
  { type: "ssr", name: "Ssr1", server: "f.com", port: 443, password: "p", method: "chacha20-ietf", obfs: "plain" },
  { type: "hysteria2", name: "Hy2", server: "g.com", port: 443, password: "p", sni: "g.com", up: 50, down: 50 },
  { type: "hysteria", name: "Hy1", server: "h.com", port: 443, password: "p", sni: "h.com", obfs: "none", up: 50, down: 50 },
  { type: "tuic", name: "Tuic1", server: "j.com", port: 443, uuid: "x", password: "p", sni: "j.com", concurrency: 1 },
  { type: "masque", name: "Masque1", server: "k.com", port: 443, "public-key": "pk", "private-key": "sk", sni: "k.com" },
  { type: "anytls", name: "AnyTls1", server: "l.com", port: 443, password: "p", sni: "l.com" },
  { type: "wireguard", name: "WG1", server: "m.com", port: 51820, "private-key": "sk", "public-key": "pk", ip: "10.0.0.2", mtu: 1420 },
  { type: "mieru", name: "Mieru1", server: "n.com", port: 443, username: "u", password: "p", sni: "n.com" },
  { type: "trojan", name: "Trojan1", server: "r.com", port: 443, password: "p", sni: "r.com" },
  { type: "snell", name: "Snell1", server: "s.com", port: 443, password: "p", psk: "x" },
  { type: "socks", name: "Socks1", server: "t.com", port: 1080 },
  { type: "socks5", name: "Socks5Alias", server: "u.com", port: 1080 },
  { type: "http", name: "Http1", server: "w.com", port: 8080 },
  { type: "shadowquic", name: "SQ1", server: "x.com", port: 443, password: "p", sni: "x.com" },
  { type: "tls", name: "Tls1", server: "y.com", port: 443, sni: "y.com" },
  { type: "ssh", name: "Ssh1", server: "z.com", port: 22, username: "u", password: "p" },
]

// 不应保留的节点（内核不支持的 NaïveProxy + 内核不识别的别名 + 文档收录但脚本未归类的类型）
const dropNodes = [
  // Mihomo 内核不支持的协议
  { type: "naive", name: "NaiveAlias1", server: "o.com", port: 443, password: "p", sni: "o.com" },
  { type: "naiveproxy", name: "NaiveAlias2", server: "p.com", port: 443, password: "p", sni: "p.com" },
  { type: "naïveproxy", name: "NaiveAlias3", server: "q.com", port: 443, password: "p", sni: "q.com" },
  // 内核不识别的别名
  { type: "hy2", name: "Hy2Alias", server: "i.com", port: 443, password: "p", sni: "i.com", up: 50, down: 50 },
  { type: "shadowsocks", name: "Ss2Alias", server: "e.com", port: 443, password: "p", method: "aes-256-gcm" },
  { type: "sockss", name: "SockssAlias", server: "v.com", port: 1080 },
  // 文档收录但脚本未归类的类型
  { type: "easytier", name: "EasyTier1", server: "et.com", port: 2443, "peer-id": "x" },
  { type: "tailscale", name: "Tailscale1", server: "ts.com", port: 41641, key: "x" },
  { type: "openvpn", name: "OpenVpn1", server: "ovp.com", port: 1194, config: "xxx" },
  { type: "sudoku", name: "Sudoku1", server: "sk.com", port: 443, password: "p" },
  { type: "trusttunnel", name: "TrustTunnel1", server: "tt.com", port: 443, "public-key": "pk", sni: "tt.com" },
  { type: "zerotier", name: "ZeroTier1", server: "zt.com", port: 9993, controller: "0.0.0.0:9993", token: "x", network: "x" },
  { type: "direct", name: "Direct1" },
  { type: "dns", name: "Dns1", server: "8.8.8.8" },
]

const allProxies = [...keepNodes, ...dropNodes]
const result = main({ proxies: allProxies })

let failures = 0
function check(cond, msg) {
  if (!cond) {
    console.error(`❌ ${msg}`)
    failures++
  }
}

// 1. 节点数
const actualCount = result.proxies.length
check(actualCount === keepNodes.length, `节点数：预期 ${keepNodes.length}，实际 ${actualCount}`)

const outputNames = new Set(result.proxies.map(p => p.name))

// 2. 应保留的节点全在
for (const n of keepNodes) {
  check(outputNames.has(n.name), `预期节点缺失：${n.name}`)
}

// 3. 应丢弃的节点都不在
for (const n of dropNodes) {
  check(!outputNames.has(n.name), `不应保留的节点出现：${n.name}`)
}

// 4. proxy-groups：所有协议都应有对应分组
const groupNames = new Set(result["proxy-groups"].map(g => g.name))
const expectedMainGroups = [
  "Hysteria2", "Hysteria", "TUIC", "Masque", "AnyTLS", "VLESS",
  "VMess", "Shadowsocks", "Shadowsocksr", "Snell", "Socks", "HTTP",
  "ShadowQuic", "WireGuard", "Mieru", "Trojan", "TLS", "SSH",
]
for (const g of expectedMainGroups) {
  check(groupNames.has(g), `缺少协议分组：${g}`)
  check(groupNames.has(`${g}-自动回退`), `缺少自动回退分组：${g}-自动回退`)
}

// 5. 特殊分组
check(groupNames.has("负载均衡"), "缺少负载均衡分组")
check(groupNames.has("节点选择"), "缺少节点选择分组")
check(groupNames.has("漏网之鱼"), "缺少漏网之鱼分组")
check(groupNames.has("GLOBAL"), "缺少 GLOBAL 分组")

// 6. 节点选择顺序
const nodeSelect = result["proxy-groups"].find(g => g.name === "节点选择")
check(nodeSelect.proxies[0] === "负载均衡", `节点选择第一项应为负载均衡，实际 ${nodeSelect.proxies[0]}`)
check(nodeSelect.proxies[nodeSelect.proxies.length - 1] === "DIRECT", `节点选择最后一项应为 DIRECT，实际 ${nodeSelect.proxies[nodeSelect.proxies.length - 1]}`)
for (const g of expectedMainGroups) {
  check(nodeSelect.proxies.includes(g), `节点选择应包含协议组：${g}`)
}

// 7. GLOBAL 完整：包含所有非 GLOBAL 分组
const globalGroup = result["proxy-groups"].find(g => g.name === "GLOBAL")
const nonGlobalNames = result["proxy-groups"].filter(g => g.name !== "GLOBAL").map(g => g.name)
check(globalGroup.proxies.length === nonGlobalNames.length, `GLOBAL proxies 数应为 ${nonGlobalNames.length}，实际 ${globalGroup.proxies.length}`)
for (const n of nonGlobalNames) {
  check(globalGroup.proxies.includes(n), `GLOBAL 应包含：${n}`)
}
check(!globalGroup.proxies.includes("GLOBAL"), "GLOBAL 不应包含自己")

// 8. GEOIP 大写统一
check(result["rules"].includes("GEOSITE,CN,DIRECT"), "应有 GEOSITE,CN,DIRECT（大写 CN）")
check(result["rules"].includes("GEOIP,CN,DIRECT,no-resolve"), "应有 GEOIP,CN,DIRECT,no-resolve（大写 CN）")
check(!result["rules"].includes("GEOSITE,cn,DIRECT"), "不应有小写 cn 的 GEOSITE 规则")
check(!result["rules"].includes("GEOIP,cn,DIRECT,no-resolve"), "不应有小写 cn 的 GEOIP 规则")

// 9. geox-url 官方源
check(result["geox-url"].geoip.includes("github.com/MetaCubeX/meta-rules-dat"), `geoip 应用官方源，实际 ${result["geox-url"].geoip}`)
check(result["geox-url"].asn.includes("github.com/MetaCubeX/meta-rules-dat"), `asn 应用官方源，实际 ${result["geox-url"].asn}`)
check(!result["geox-url"].geoip.includes("testingcf"), "不应再用 testingcf.jsdelivr.net")
check(!result["geox-url"].asn.includes("xishang0128"), "不应再用个人 fork xishang0128")

// 10. dns.doh.pub
check(result.dns.nameserver.includes("https://dns.doh.pub/dns-query"), "nameserver 应包含 dns.doh.pub")
check(result.dns["proxy-server-nameserver"].includes("https://dns.doh.pub/dns-query#DIRECT"), "proxy-server-nameserver 应包含 dns.doh.pub")
check(result.dns["direct-nameserver"].includes("https://dns.doh.pub/dns-query#DIRECT"), "direct-nameserver 应包含 dns.doh.pub")

// 11. hosts 含 dns.doh.pub
check("dns.doh.pub" in result.hosts, "hosts 应含 dns.doh.pub")

// 输出摘要
console.log(`✅ 节点数：${actualCount}（${keepNodes.length} 保留 + ${dropNodes.length} 丢弃）`)
console.log(`✅ 协议分组数：${expectedMainGroups.length}`)
console.log(`✅ GLOBAL 包含：${globalGroup.proxies.length} 个非 GLOBAL 分组`)

if (failures === 0) {
  console.log(`\n🎉 全部通过`)
  process.exit(0)
} else {
  console.error(`\n💥 ${failures} 项失败`)
  process.exit(1)
}
