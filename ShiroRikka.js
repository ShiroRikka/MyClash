// v4.12-modified — 按协议分组（S级/A级/兜底），自动回退策略参考 AIsouler/MyClash
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

  // ===== 构建策略组 =====

  // fallback 自动回退策略（参考 AIsouler/MyClash 的 url-test 策略参数）
  const fallbackBaseOption = {
    type: "fallback",
    url: "https://www.gstatic.com/generate_204",
    interval: 600,
    timeout: 3000,
    lazy: true,
    "max-failed-times": 3,
  }

  const proxyGroups = []

  // ========== 协议级分组（自动回退 fallback） ==========

  // Hysteria2 分组
  if (protocolBins.hysteria2.length > 0) {
    proxyGroups.push({
      name: "Hysteria2",
      icon: `${CDN_QURE}Hysteria2.png`,
      ...fallbackBaseOption,
      proxies: protocolBins.hysteria2,
    })
  }

  // TUIC 分组
  if (protocolBins.tuic.length > 0) {
    proxyGroups.push({
      name: "TUIC",
      icon: `${CDN_QURE}TUIC.png`,
      ...fallbackBaseOption,
      proxies: protocolBins.tuic,
    })
  }

  // Trojan 分组
  if (protocolBins.trojan.length > 0) {
    proxyGroups.push({
      name: "Trojan",
      icon: `${CDN_QURE}Trojan.png`,
      ...fallbackBaseOption,
      proxies: protocolBins.trojan,
    })
  }

  // VLESS 分组
  if (protocolBins.vless.length > 0) {
    proxyGroups.push({
      name: "VLESS",
      icon: `${CDN_QURE}VLESS.png`,
      ...fallbackBaseOption,
      proxies: protocolBins.vless,
    })
  }

  // AnyTLS 分组（兜底）—— 包含所有剩余协议节点
  if (protocolBins.other.length > 0) {
    proxyGroups.push({
      name: "AnyTLS",
      icon: `${CDN_VERGE}globe.svg`,
      ...fallbackBaseOption,
      proxies: protocolBins.other,
    })
  }

  // ========== 等级选择分组（手动 select） ==========

  // S 级：包含 Hysteria2 + TUIC
  const sChildren = ["Hysteria2", "TUIC"].filter(
    name => proxyGroups.some(g => g.name === name)
  )
  if (sChildren.length > 0) {
    proxyGroups.push({
      name: "S级",
      icon: `${CDN_STASH}ssr.png`,
      type: "select",
      proxies: [...sChildren, "DIRECT"],
    })
  }

  // A 级：包含 Trojan + VLESS
  const aChildren = ["Trojan", "VLESS"].filter(
    name => proxyGroups.some(g => g.name === name)
  )
  if (aChildren.length > 0) {
    proxyGroups.push({
      name: "A级",
      icon: `${CDN_STASH}ssr.png`,
      type: "select",
      proxies: [...aChildren, "DIRECT"],
    })
  }

  // 兜底：包含 AnyTLS
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

  // 节点选择：将所有等级组纳入
  const tierGroups = ["S级", "A级", "兜底"].filter(
    name => proxyGroups.some(g => g.name === name)
  )
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

  // 漏网之鱼：未匹配规则的流量
  proxyGroups.push({
    name: "漏网之鱼",
    icon: `${CDN_QURE}Final.png`,
    type: "select",
    proxies: ["节点选择", "DIRECT"],
  })

  // GLOBAL：顶层包括所有
  const allGroupNames = proxyGroups.map(g => g.name)
  proxyGroups.push({
    name: "GLOBAL",
    icon: `${CDN_QURE}Global.png`,
    "include-all": true,
    type: "select",
    proxies: [
      "节点选择",
      "漏网之鱼",
      ...tierGroups,
      ...(proxyGroups.some(g => g.name === "Hysteria2") ? ["Hysteria2"] : []),
      ...(proxyGroups.some(g => g.name === "TUIC") ? ["TUIC"] : []),
      ...(proxyGroups.some(g => g.name === "Trojan") ? ["Trojan"] : []),
      ...(proxyGroups.some(g => g.name === "VLESS") ? ["VLESS"] : []),
      ...(hasAnyTLS ? ["AnyTLS"] : []),
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
