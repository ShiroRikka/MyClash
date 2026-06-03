// v4.15 — 协议级 select 分组 + 仅 MetaCubeX 官方规则源
function main(config) {
  // 参数校验
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

  // 自动回退（fallback, hidden）
  const fallbackBaseOption = {
    type: "fallback",
    url: "https://www.gstatic.com/generate_204",
    interval: 600,
    timeout: 3000,
    lazy: true,
    "max-failed-times": 3,
    hidden: true,
  }

  // 自动选择（url-test, hidden）
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

  if (protocolBins.hysteria2.length > 0) {
    proxyGroups.push(
      ...createProtocolGroup("Hysteria2", `${CDN_QURE}Hysteria2.png`, protocolBins.hysteria2)
    )
  }
  if (protocolBins.tuic.length > 0) {
    proxyGroups.push(
      ...createProtocolGroup("TUIC", `${CDN_QURE}TUIC.png`, protocolBins.tuic)
    )
  }
  if (protocolBins.trojan.length > 0) {
    proxyGroups.push(
      ...createProtocolGroup("Trojan", `${CDN_QURE}Trojan.png`, protocolBins.trojan)
    )
  }
  if (protocolBins.vless.length > 0) {
    proxyGroups.push(
      ...createProtocolGroup("VLESS", `${CDN_QURE}VLESS.png`, protocolBins.vless)
    )
  }
  if (protocolBins.other.length > 0) {
    proxyGroups.push(
      ...createProtocolGroup("AnyTLS", `${CDN_VERGE}globe.svg`, protocolBins.other)
    )
  }

  const mainGroupNames = ["Hysteria2", "TUIC", "Trojan", "VLESS", "AnyTLS"]
    .filter(n => proxyGroups.some(g => g.name === n))

  // 节点选择
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
      "节点选择", "漏网之鱼",
      ...mainGroupNames,
      "广告拦截", "应用净化",
    ],
  })

  // 将「节点选择」移到最前面
  const ngIdx = proxyGroups.findIndex(g => g.name === "节点选择")
  if (ngIdx > 0) {
    const [nodeSelect] = proxyGroups.splice(ngIdx, 1)
    proxyGroups.unshift(nodeSelect)
  }

  config["proxy-groups"] = proxyGroups

  // ===== DNS 配置 =====
  const metaCDN = "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta"

  const chinaDNS = [
    "https://dns.alidns.com/dns-query#DIRECT",
    "https://doh.pub/dns-query#DIRECT",
  ]
  const foreignDNS = [
    "https://dns.cloudflare.com/dns-query#节点选择",
    "https://dns.google/dns-query#节点选择",
  ]

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

  // ===== Rule Providers（仅 MetaCubeX 官方 .mrs 源）=====
  const ruleProviderCommon = {
    type: "http",
    interval: 86400,
    format: "mrs",
  }

  config["rule-providers"] = {
    // --- geosite（域名分类）---
    "category-ads-all": {
      ...ruleProviderCommon,
      behavior: "domain",
      url: `${metaCDN}/geo/geosite/category-ads-all.mrs`,
      path: "./ruleset/category-ads-all.mrs",
    },
    "private": {
      ...ruleProviderCommon,
      behavior: "domain",
      url: `${metaCDN}/geo/geosite/private.mrs`,
      path: "./ruleset/private.mrs",
    },
    "cn": {
      ...ruleProviderCommon,
      behavior: "domain",
      url: `${metaCDN}/geo/geosite/cn.mrs`,
      path: "./ruleset/cn.mrs",
    },
    "gfw": {
      ...ruleProviderCommon,
      behavior: "domain",
      url: `${metaCDN}/geo/geosite/gfw.mrs`,
      path: "./ruleset/gfw.mrs",
    },
    "google": {
      ...ruleProviderCommon,
      behavior: "domain",
      url: `${metaCDN}/geo/geosite/google.mrs`,
      path: "./ruleset/google.mrs",
    },
    "telegram": {
      ...ruleProviderCommon,
      behavior: "domain",
      url: `${metaCDN}/geo/geosite/telegram.mrs`,
      path: "./ruleset/telegram.mrs",
    },
    // --- geoip（IP 分类）---
    "geoip-private": {
      ...ruleProviderCommon,
      behavior: "ipcidr",
      url: `${metaCDN}/geo/geoip/private.mrs`,
      path: "./ruleset/geoip-private.mrs",
    },
    "geoip-cn": {
      ...ruleProviderCommon,
      behavior: "ipcidr",
      url: `${metaCDN}/geo/geoip/cn.mrs`,
      path: "./ruleset/geoip-cn.mrs",
    },
    "geoip-telegram": {
      ...ruleProviderCommon,
      behavior: "ipcidr",
      url: `${metaCDN}/geo/geoip/telegram.mrs`,
      path: "./ruleset/geoip-telegram.mrs",
    },
  }

  // ===== Rules =====
  config["rules"] = [
    // 广告拦截（最优先）
    "RULE-SET,category-ads-all,REJECT",
    // 内网域名直连
    "RULE-SET,private,DIRECT",
    // 国内域名直连
    "RULE-SET,cn,DIRECT",
    // 被墙域名走代理
    "RULE-SET,gfw,节点选择",
    // Google 走代理
    "RULE-SET,google,节点选择",
    // Telegram 走代理
    "RULE-SET,telegram,节点选择",
    // IP 规则
    "RULE-SET,geoip-private,DIRECT,no-resolve",
    "RULE-SET,geoip-cn,DIRECT,no-resolve",
    "RULE-SET,geoip-telegram,节点选择,no-resolve",
    // 兜底
    "MATCH,节点选择",
  ]

  return config
}
