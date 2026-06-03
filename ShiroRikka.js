// v4.13 — 协议级 select 分组，含隐藏的自动回退/自动选择策略（参考 AIsouler/MyClash）
function main(config) {
  // 参数校验：确保传入有效的配置对象
  if (!config || typeof config !== "object") {
    throw new TypeError("config 必须是对象")
  }
  const allProxies = Array.isArray(config.proxies) ? config.proxies : []

  // 过滤缺少 name 字段的异常节点
  const validProxies = allProxies.filter(p => p && typeof p.name === "string")

  const CDN = "https://cdn.jsdelivr.net/gh/"
  const CDN_FLAGS = `${CDN}lipis/flag-icons@main/flags/4x3/`
  const CDN_QURE = `${CDN}Koolson/Qure@master/IconSet/Color/`
  const CDN_VERGE = `${CDN}clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/`
  const CDN_STASH = `${CDN}shindgewongxj/WHATSINStash@master/icon/`

  // ===== 按协议类型分类节点 =====
  const protocolBins = {
    hysteria2: [],
    tuic: [],
    trojan: [],
    vless: [],
    other: [], // 兜底：其余所有协议（vmess, shadowsocks, hysteria, socks5, http 等）
  }

  for (const proxy of validProxies) {
    const type = (proxy.type || "").toLowerCase()
    switch (type) {
      case "hysteria2":
      case "hy2":
        protocolBins.hysteria2.push(proxy.name)
        break
      case "tuic":
        protocolBins.tuic.push(proxy.name)
        break
      case "trojan":
        protocolBins.trojan.push(proxy.name)
        break
      case "vless":
        protocolBins.vless.push(proxy.name)
        break
      default:
        // Shadowsocks, VMess, Hysteria, Socks5, HTTP, Direct 等均归入兜底
        protocolBins.other.push(proxy.name)
        break
    }
  }

  // ===== 策略组基础配置 =====

  // fallback 自动回退（隐藏，参考 AIsouler/MyClash 的 url-test 参数）
  const fallbackBaseOption = {
    type: "fallback",
    url: "https://www.gstatic.com/generate_204",
    interval: 600,
    timeout: 3000,
    lazy: true,
    "max-failed-times": 3,
    hidden: true,
  }

  // url-test 自动选择（隐藏，参考 AIsouler/MyClash 的 url-test 参数）
  const urlTestBaseOption = {
    type: "url-test",
    url: "https://www.gstatic.com/generate_204",
    interval: 600,
    timeout: 3000,
    tolerance: 100,
    lazy: true,
    "max-failed-times": 3,
    hidden: true,
  }

  // ===== 构建协议分组（参考 createRegionGroup 模式）=====

  /**
   * 为每个协议创建三个分组：
   *   1. {name}-自动回退  (fallback, hidden) — 自动选第一个可用
   *   2. {name}-自动选择  (url-test, hidden)  — 自动选延迟最低
   *   3. {name}            (select)           — 手动选节点或自动策略
   */
  function createProtocolGroup(name, icon, proxies) {
    const fallbackName = `${name}-自动回退`
    const autoName = `${name}-自动选择`
    return [
      {
        name: fallbackName,
        ...fallbackBaseOption,
        proxies,
      },
      {
        name: autoName,
        ...urlTestBaseOption,
        icon: `${CDN_QURE}Auto.png`,
        proxies,
      },
      {
        name,
        icon,
        type: "select",
        proxies: [...proxies, fallbackName, autoName],
      },
    ]
  }

  const proxyGroups = []

  // Hysteria2
  if (protocolBins.hysteria2.length > 0) {
    proxyGroups.push(
      ...createProtocolGroup("Hysteria2", `${CDN_QURE}Hysteria2.png`, protocolBins.hysteria2)
    )
  }

  // TUIC
  if (protocolBins.tuic.length > 0) {
    proxyGroups.push(
      ...createProtocolGroup("TUIC", `${CDN_QURE}TUIC.png`, protocolBins.tuic)
    )
  }

  // Trojan
  if (protocolBins.trojan.length > 0) {
    proxyGroups.push(
      ...createProtocolGroup("Trojan", `${CDN_QURE}Trojan.png`, protocolBins.trojan)
    )
  }

  // VLESS
  if (protocolBins.vless.length > 0) {
    proxyGroups.push(
      ...createProtocolGroup("VLESS", `${CDN_QURE}VLESS.png`, protocolBins.vless)
    )
  }

  // AnyTLS（兜底）
  if (protocolBins.other.length > 0) {
    proxyGroups.push(
      ...createProtocolGroup(
        "AnyTLS",
        `${CDN_VERGE}globe.svg`,
        protocolBins.other
      )
    )
  }

  // ===== 等级选择分组（手动 select） =====

  const mainGroupNames = ["Hysteria2", "TUIC", "Trojan", "VLESS", "AnyTLS"]
    .filter(n => proxyGroups.some(g => g.name === n))

  // S 级：包含 Hysteria2 + TUIC
  const sChildren = ["Hysteria2", "TUIC"].filter(n => proxyGroups.some(g => g.name === n))
  if (sChildren.length > 0) {
    proxyGroups.push({
      name: "S级",
      icon: `${CDN_STASH}ssr.png`,
      type: "select",
      proxies: [...sChildren, "DIRECT"],
    })
  }

  // A 级：包含 Trojan + VLESS
  const aChildren = ["Trojan", "VLESS"].filter(n => proxyGroups.some(g => g.name === n))
  if (aChildren.length > 0) {
    proxyGroups.push({
      name: "A级",
      icon: `${CDN_STASH}ssr.png`,
      type: "select",
      proxies: [...aChildren, "DIRECT"],
    })
  }

  // 兜底
  const hasAnyTLS = proxyGroups.some(g => g.name === "AnyTLS")
  if (hasAnyTLS) {
    proxyGroups.push({
      name: "兜底",
      icon: `${CDN_QURE}Fallback.png`,
      type: "select",
      proxies: ["AnyTLS", "DIRECT"],
    })
  }

  // ========== 顶层选择器 ==========

  const tierGroups = ["S级", "A级", "兜底"].filter(n => proxyGroups.some(g => g.name === n))

  // 节点选择
  proxyGroups.push({
    name: "节点选择",
    icon: `${CDN_QURE}Proxy.png`,
    type: "select",
    proxies: [...tierGroups, "DIRECT"],
  })

  // 广告拦截
  proxyGroups.push({
    name: "广告拦截",
    icon: `${CDN_QURE}AdBlack.png`,
    type: "select",
    proxies: ["REJECT", "DIRECT"],
  })

  // 应用净化
  proxyGroups.push({
    name: "应用净化",
    icon: `${CDN_QURE}Hijacking.png`,
    type: "select",
    proxies: ["REJECT", "DIRECT"],
  })

  // 漏网之鱼
  proxyGroups.push({
    name: "漏网之鱼",
    icon: `${CDN_QURE}Final.png`,
    type: "select",
    proxies: ["节点选择", "DIRECT"],
  })

  // GLOBAL
  proxyGroups.push({
    name: "GLOBAL",
    icon: `${CDN_QURE}Global.png`,
    "include-all": true,
    type: "select",
    proxies: [
      "节点选择",
      "漏网之鱼",
      ...tierGroups,
      ...mainGroupNames,
      "广告拦截",
      "应用净化",
    ],
  })

  config["proxy-groups"] = proxyGroups

  // ===== DNS 锚点 =====
  const chinaDNS = [
    "https://dns.alidns.com/dns-query#DIRECT",
    "https://doh.pub/dns-query#DIRECT",
  ]
  const foreignDNS = [
    "https://dns.cloudflare.com/dns-query#节点选择",
    "https://dns.google/dns-query#节点选择",
  ]

  // ===== DNS 配置 =====
  config.dns = {
    enable: true,
    ipv6: true,
    listen: ":1053",
    "cache-algorithm": "arc",
    "use-hosts": true,
    "use-system-hosts": true,
    "enhanced-mode": "fake-ip",
    "fake-ip-range": "198.18.0.1/16",
    "fake-ip-range-v6": "fc00::/18",
    "fake-ip-filter": ["rule-set:private"],
    "proxy-server-nameserver": chinaDNS,
    "default-nameserver": ["223.5.5.5", "119.29.29.29"],
    nameserver: foreignDNS,
    "nameserver-policy": {
      "*": "system",
      "rule-set:direct": chinaDNS,
    },
    "direct-nameserver": ["system", "223.5.5.5", "119.29.29.29"],
  }

  // ===== Hosts =====
  config.hosts = {
    "dns.alidns.com": ["223.5.5.5", "223.6.6.6"],
    "doh.pub": ["1.12.12.12", "120.53.53.53"],
    "dns.cloudflare.com": ["1.1.1.1", "1.0.0.1"],
    "dns.google": ["8.8.8.8", "8.8.4.4"],
    "services.googleapis.cn": ["services.googleapis.com"],
    "+.mcdn.bilivideo.com": ["0.0.0.0"],
    "+.mcdn.bilivideo.cn": ["0.0.0.0"],
  }

  const ruleProviderBase = { type: "http", interval: 86400 }
  const ruleProvidersData = [
    { name: "reject", behavior: "domain" },
    { name: "private", behavior: "domain" },
    { name: "icloud", behavior: "domain" },
    { name: "apple", behavior: "domain" },
    { name: "google", behavior: "domain" },
    { name: "proxy", behavior: "domain" },
    { name: "direct", behavior: "domain" },
    { name: "gfw", behavior: "domain" },
    { name: "lancidr", behavior: "ipcidr" },
    { name: "cncidr", behavior: "ipcidr" },
    { name: "telegramcidr", behavior: "ipcidr" },
    { name: "applications", behavior: "classical" },
  ]

  config["rule-providers"] = Object.fromEntries(
    ruleProvidersData.map(({ name, behavior }) => [
      name,
      {
        ...ruleProviderBase,
        behavior,
        url: `${CDN}Loyalsoldier/clash-rules@release/${name}.txt`,
        path: `./ruleset/${name}.yaml`,
      },
    ]),
  )

  config["rules"] = [
    "RULE-SET,applications,DIRECT",
    "DOMAIN,clash.razord.top,DIRECT",
    "DOMAIN,yacd.haishan.me,DIRECT",
    "RULE-SET,private,DIRECT",
    "RULE-SET,reject,REJECT",
    "RULE-SET,icloud,DIRECT",
    "RULE-SET,apple,DIRECT",
    "RULE-SET,google,节点选择",
    "RULE-SET,proxy,节点选择",
    "RULE-SET,direct,DIRECT",
    "RULE-SET,lancidr,DIRECT",
    "RULE-SET,cncidr,DIRECT",
    "RULE-SET,telegramcidr,节点选择",
    "GEOIP,LAN,DIRECT",
    "GEOIP,CN,DIRECT",
    "MATCH,漏网之鱼",
  ]

  return config
}
