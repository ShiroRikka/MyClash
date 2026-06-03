// v4.15 — 协议组 select 只含自动回退/自动选择，不列节点
function main(config) {
  if (!config || typeof config !== "object") {
    throw new TypeError("config 必须是对象")
  }
  const allProxies = Array.isArray(config.proxies) ? config.proxies : []
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
    other: [],
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
        protocolBins.other.push(proxy.name)
        break
    }
  }

  // ===== 策略组基础配置 =====

  // 自动回退（fallback）— 稳定性优先，选第一个可用（可见，用户可切换过来）
  const fallbackBaseOption = {
    type: "fallback",
    url: "https://www.gstatic.com/generate_204",
    interval: 600,
    timeout: 3000,
    lazy: true,
    "max-failed-times": 3,
  }

  // 自动选择（url-test, hidden）— 速度优先，选延迟最低
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

  // ===== 构建协议分组 =====
  // 每个协议生成三个分组：
  //   1. {name}-自动回退  (fallback)      — 选第一个可用节点
  //   2. {name}-自动选择  (url-test, hidden) — 选延迟最低节点
  //   3. {name}            (select)       — 在以上两个策略之间切换
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
        proxies: [fallbackName, autoName],
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
      ...createProtocolGroup("AnyTLS", `${CDN_VERGE}globe.svg`, protocolBins.other)
    )
  }

  // ===== 顶层选择器 =====
  const mainGroupNames = ["Hysteria2", "TUIC", "Trojan", "VLESS", "AnyTLS"]
    .filter(n => proxyGroups.some(g => g.name === n))

  // 节点选择：直接包含各协议组
  proxyGroups.push({
    name: "节点选择",
    icon: `${CDN_QURE}Proxy.png`,
    type: "select",
    proxies: [...mainGroupNames, "DIRECT"],
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
      ...mainGroupNames,
      "广告拦截",
      "应用净化",
    ],
  })

  // 将「节点选择」移到最前面（面板中显示在首位）
  const ngIdx = proxyGroups.findIndex(g => g.name === "节点选择")
  if (ngIdx > 0) {
    const [nodeSelect] = proxyGroups.splice(ngIdx, 1)
    proxyGroups.unshift(nodeSelect)
  }

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
