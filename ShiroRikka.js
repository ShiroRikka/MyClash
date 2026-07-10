// v4.28 — 全面 fallback 化
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
  const CDN_ICONS = `${CDN}ShiroRikka/MyClash@main/icons/`

  // ===== 按协议类型分类节点 =====
  const protocolBins = {
    hysteria2: [],
    tuic: [],
    masque: [],
    anytls: [],
    vless: [],
    wireguard: [],
    mieru: [],
  }

  // 收集被归类的节点对象，未归类的杂鱼直接丢弃
  const matchedProxies = []

  for (const proxy of validProxies) {
    const type = (proxy.type || "").toLowerCase()
    switch (type) {
      case "hysteria2":
      case "hy2":
        protocolBins.hysteria2.push(proxy.name)
        matchedProxies.push(proxy)
        break
      case "tuic":
        protocolBins.tuic.push(proxy.name)
        matchedProxies.push(proxy)
        break
      case "masque":
        protocolBins.masque.push(proxy.name)
        matchedProxies.push(proxy)
        break
      case "anytls":
        protocolBins.anytls.push(proxy.name)
        matchedProxies.push(proxy)
        break
      case "vless":
        // VLESS 节点：仅保留有 reality-opts（REALITY）或 network=xhttp（XHTTP）的节点
        if (proxy.network === "xhttp" || proxy["reality-opts"]) {
          protocolBins.vless.push(proxy.name)
          matchedProxies.push(proxy)
        }
        break
      case "wireguard":
        protocolBins.wireguard.push(proxy.name)
        matchedProxies.push(proxy)
        break
      case "mieru":
        protocolBins.mieru.push(proxy.name)
        matchedProxies.push(proxy)
        break
      // 其他协议类型不归入任何分组，直接丢弃
    }
  }

  // 用归类后的节点列表覆盖原始 proxies，杂鱼全部清除
  config.proxies = matchedProxies

  // ===== 策略组基础配置 =====

  // 自动回退（fallback, hidden）— 按顺序选第一个可用节点，更稳定
  const fallbackBaseOption = {
    type: "fallback",
    url: "https://www.gstatic.com/generate_204",
    interval: 300,
    timeout: 3000,
    lazy: false,
    "max-failed-times": 3,
    hidden: true,
  }

  // ===== 构建协议分组 =====
  function createProtocolGroup(name, icon, proxies, extraOptions = {}) {
    const fallbackName = `${name}-自动回退`
    return [
      {
        name: fallbackName,
        ...fallbackBaseOption,
        ...extraOptions,
        icon: `${CDN_QURE}Auto.png`,
        proxies,
      },
      {
        name,
        icon,
        type: "select",
        proxies: [fallbackName, ...proxies],
      },
    ]
  }

  const proxyGroups = []

  if (protocolBins.hysteria2.length > 0) {
    proxyGroups.push(
      ...createProtocolGroup("Hysteria2", `${CDN_ICONS}hysteria2.svg`, protocolBins.hysteria2)
    )
  }
  if (protocolBins.tuic.length > 0) {
    proxyGroups.push(
      ...createProtocolGroup("TUIC", `${CDN_ICONS}tuic.svg`, protocolBins.tuic)
    )
  }
  if (protocolBins.masque.length > 0) {
    proxyGroups.push(
      ...createProtocolGroup("Masque", `${CDN_ICONS}masque.svg`, protocolBins.masque)
    )
  }
  if (protocolBins.anytls.length > 0) {
    proxyGroups.push(
      ...createProtocolGroup("AnyTLS", `${CDN_ICONS}anytls.svg`, protocolBins.anytls)
    )
  }
  if (protocolBins.vless.length > 0) {
    proxyGroups.push(
      ...createProtocolGroup("VLESS", `${CDN_ICONS}vless.svg`, protocolBins.vless)
    )
  }
  if (protocolBins.wireguard.length > 0) {
    proxyGroups.push(
      ...createProtocolGroup("WireGuard", `${CDN_ICONS}wireguard.svg`, protocolBins.wireguard)
    )
  }
  if (protocolBins.mieru.length > 0) {
    proxyGroups.push(
      ...createProtocolGroup("Mieru", `${CDN_ICONS}mieru.svg`, protocolBins.mieru)
    )
  }

  const mainGroupNames = ["Hysteria2", "TUIC", "Masque", "AnyTLS", "VLESS", "WireGuard", "Mieru"]
    .filter(n => proxyGroups.some(g => g.name === n))

  // 自动回退（fallback, hidden）— 在所有协议组间按顺序选第一个可用节点
  if (mainGroupNames.length > 0) {
    proxyGroups.push({
      name: "自动回退",
      ...fallbackBaseOption,
      icon: `${CDN_QURE}Auto.png`,
      proxies: [...mainGroupNames],
    })
  }

  // 节点选择
  proxyGroups.push({
    name: "节点选择",
    icon: `${CDN_QURE}Proxy.png`,
    type: "select",
    proxies: [
      ...(mainGroupNames.length > 0 ? ["自动回退"] : []),
      ...mainGroupNames,
      "DIRECT",
    ],
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