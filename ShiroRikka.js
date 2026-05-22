// v4.12
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

  // 主要地区：每个地区独立分组
  const mainRegionsMap = {
    "🇭🇰": { name: "中国-香港", key: "hk" },
    "🇹🇼": { name: "中国-台湾", key: "tw" },
    "🇯🇵": { name: "日本", key: "jp" },
    "🇺🇸": { name: "美国", key: "us" },
    "🇸🇬": { name: "新加坡", key: "sg" },
  }

  // 不需要 otherRegionsMap — 见下方排除法逻辑

  // ABC 质量正则：匹配 A/B/C 前缀
  const qualityRegex = /^(A|B|C)\s*-\s*/

  // 倍率正则：匹配 【Nx】 标签（如【10x】、【2x】、【0.1x】）
  const multiplierRegex = /【(\d+(?:\.\d+)?)x】/

  // 排除法检测地区：
  // 从所有代理名扫描国旗 emoji，主要地区独立分组，其余全部归入「其他地区」
  const allFlags = new Set()
  for (const proxy of validProxies) {
    const flagMatches = proxy.name.match(/[\u{1F1E6}-\u{1F1FF}]/gu)
    if (flagMatches) {
      flagMatches.forEach(f => allFlags.add(f))
    }
  }

  // ===== 地区检测 =====
  const foundMainFlags = new Set(
    Object.keys(mainRegionsMap).filter(flag => allFlags.has(flag))
  )
  // 其他地区：所有出现但不是主要地区的国旗自动归入（排除法）
  const foundOtherFlags = new Set(
    [...allFlags].filter(flag => !mainRegionsMap[flag])
  )

  const availableRegions = [...foundMainFlags].map((flag) => ({
    name: `${flag}${mainRegionsMap[flag].name}`,
    flag: mainRegionsMap[flag].key,
    filter: flag,
  }))

  availableRegions.sort((a, b) => a.name.localeCompare(b.name, "zh"))

  const hasOtherRegions = foundOtherFlags.size > 0
  // 其他地区合并筛选正则
  const otherRegionFilter = hasOtherRegions
    ? [...foundOtherFlags].join("|")
    : null

  // ===== 倍率分组（按实际倍率值分组，步进 0.1）=====
  const multiplierValues = new Set()
  for (const proxy of validProxies) {
    const match = proxy.name.match(multiplierRegex)
    if (match) {
      multiplierValues.add(parseFloat(match[1]))
    }
  }

  const sortedMultiplierValues = [...multiplierValues].sort((a, b) => b - a)
  const multiplierGroups = {}
  for (const value of sortedMultiplierValues) {
    const key = `${value}x`
    multiplierGroups[key] = validProxies
      .filter(p => {
        const m = p.name.match(multiplierRegex)
        return m && Math.abs(parseFloat(m[1]) - value) < 0.01
      })
      .map(p => p.name)
  }

  const availableMultiplierTiers = Object.keys(multiplierGroups)

  // ===== ABC 质量分组分类 =====
  const qualityGroups = { A: [], B: [], C: [] }
  for (const proxy of validProxies) {
    const match = proxy.name.match(qualityRegex)
    if (match) {
      qualityGroups[match[1]].push(proxy.name)
    }
  }

  const qualityTierNames = Object.entries(qualityGroups)
    .filter(([_, nodes]) => nodes.length > 0)
    .map(([tier, _]) => `${tier}级节点`)

  // ===== 带宽分组 =====
  const speedRegex = /(\d+(?:\.\d+)?)\s*MB\/s/i
  const bandwidthGroups = {}
  for (const proxy of validProxies) {
    const match = proxy.name.match(speedRegex)
    if (match) {
      const speed = parseFloat(match[1])
      let tier
      if (speed >= 6) {
        tier = "6+MB/s"
      } else {
        const floorSpeed = Math.floor(speed)
        tier = floorSpeed < 1 ? "<1MB/s" : `${floorSpeed}MB/s`
      }
      if (!bandwidthGroups[tier]) {
        bandwidthGroups[tier] = []
      }
      bandwidthGroups[tier].push(proxy.name)
    }
  }

  const availableTiers = Object.keys(bandwidthGroups).sort((a, b) => {
    const isAHigh = a.startsWith("6+")
    const isBHigh = b.startsWith("6+")
    if (isAHigh) return -1
    if (isBHigh) return 1
    const numA = parseInt(a)
    const numB = parseInt(b)
    return numB - numA
  })

  // ===== 平台解锁分组配置 =====
  const unlockMap = {
    "GPT": { name: "GPT解锁", filter: "GPT", icon: "ChatGPT.png" },
    "NF": { name: "Netflix解锁", filter: "NF", icon: "Netflix.png" },
    "GM": { name: "Gemini解锁", filter: "GM", icon: "https://cdn.jsdelivr.net/npm/@lobehub/icons-static-svg@latest/icons/gemini.svg" },
    "D+": { name: "Disney+解锁", filter: "D\\+", icon: "StreamingCN.png" },
    "YT": { name: "YouTube解锁", filter: "YT-", icon: "YouTube.png" },
    "CL": { name: "Claude解锁", filter: "CL-", icon: "AI.png" },
    "SP": { name: "Spotify解锁", filter: "SP-", icon: "Spotify.png" },
  }

  const availableUnlockGroups = Object.entries(unlockMap)
    .filter(([key, val]) => {
      const regex = new RegExp(val.filter)
      return validProxies.some(p => regex.test(p.name))
    })
    .map(([key, val]) => ({
      name: val.name,
      filter: val.filter,
      icon: val.icon.startsWith("http") ? val.icon : `${CDN_QURE}${val.icon}`,
    }))

  const globalStrategies = [
    "自动回退",
  ]

  const regionNames = availableRegions.map((r) => r.name)
  const unlockGroupNames = availableUnlockGroups.map((g) => g.name)

  const proxyGroups = []

  // 节点选择：按优先级排列（质量 > 倍率 > 地区 > 其他地区 > 解锁 > 带宽 > 全局策略）
  proxyGroups.push({
    name: "节点选择",
    icon: `${CDN_QURE}Proxy.png`,
    type: "select",
    proxies: [
      // 质量分组（最高优先级）
      ...qualityTierNames,
      // 倍率分组
      ...availableMultiplierTiers,
      // 主要地区分组
      ...regionNames,
      // 其他地区分组
      ...(hasOtherRegions ? ["其他地区"] : []),
      // 解锁分组
      ...unlockGroupNames,
      // 带宽分组
      ...availableTiers,
      // 全局策略
      ...globalStrategies,
      "DIRECT",
    ],
  })

  // 自动回退：全局兜底，排除国内节点
  proxyGroups.push({
    name: "自动回退",
    icon: `${CDN_STASH}fallback.png`,
    "include-all": true,
    "exclude-filter": "CN|China",
    type: "fallback",
    url: "https://www.gstatic.com/generate_204",
    interval: 300,
  })

  // ABC 质量分级分组（fallback：自动回退到同组可用节点）
  for (const tier of ["A", "B", "C"]) {
    const nodes = qualityGroups[tier]
    if (nodes.length > 0) {
      proxyGroups.push({
        name: `${tier}级节点`,
        icon: `${CDN_VERGE}balance.svg`,
        type: "fallback",
        proxies: nodes,
        url: "https://www.gstatic.com/generate_204",
        interval: 300,
      })
    }
  }

  // 倍率分组（fallback：按实际倍率值分组）
  for (const tier of availableMultiplierTiers) {
    proxyGroups.push({
      name: tier,
      icon: `${CDN_VERGE}balance.svg`,
      type: "fallback",
      proxies: multiplierGroups[tier],
      url: "https://www.gstatic.com/generate_204",
      interval: 300,
    })
  }

  // 主要地区分组（fallback）
  for (const region of availableRegions) {
    proxyGroups.push({
      name: region.name,
      icon: `${CDN_FLAGS}${region.flag}.svg`,
      "include-all": true,
      filter: region.filter,
      type: "fallback",
      url: "https://www.gstatic.com/generate_204",
      interval: 300,
    })
  }

  // 其他地区分组（fallback）
  if (hasOtherRegions) {
    proxyGroups.push({
      name: "其他地区",
      icon: `${CDN_VERGE}globe.svg`,
      "include-all": true,
      filter: otherRegionFilter,
      type: "fallback",
      url: "https://www.gstatic.com/generate_204",
      interval: 300,
    })
  }

  // 平台解锁分组（fallback）
  for (const group of availableUnlockGroups) {
    proxyGroups.push({
      name: group.name,
      icon: group.icon,
      "include-all": true,
      filter: group.filter,
      type: "fallback",
      url: "https://www.gstatic.com/generate_204",
      interval: 300,
    })
  }

  // 带宽分组（load-balance）
  for (const tier of availableTiers) {
    const proxies = bandwidthGroups[tier]
    if (proxies.length > 0) {
      proxyGroups.push({
        name: tier,
        icon: `${CDN_VERGE}balance.svg`,
        type: "load-balance",
        proxies: proxies,
        url: "https://www.gstatic.com/generate_204",
        interval: 300,
        strategy: "round-robin",
      })
    }
  }

  proxyGroups.push({
    name: "广告拦截",
    icon: `${CDN_QURE}AdBlack.png`,
    type: "select",
    proxies: ["REJECT", "DIRECT"],
  })

  proxyGroups.push({
    name: "应用净化",
    icon: `${CDN_QURE}Hijacking.png`,
    type: "select",
    proxies: ["REJECT", "DIRECT"],
  })

  // 漏网之鱼：未匹配规则的流量，默认走代理，用户可切换到直连
  proxyGroups.push({
    name: "漏网之鱼",
    icon: `${CDN_QURE}Final.png`,
    type: "select",
    proxies: ["节点选择", "DIRECT"],
  })

  proxyGroups.push({
    name: "GLOBAL",
    icon: `${CDN_QURE}Global.png`,
    "include-all": true,
    type: "select",
    proxies: [
      "节点选择",
      "漏网之鱼",
      // 质量分组
      ...qualityTierNames,
      // 倍率分组
      ...availableMultiplierTiers,
      // 全局策略
      ...globalStrategies,
      // 主要地区分组
      ...regionNames,
      // 其他地区分组
      ...(hasOtherRegions ? ["其他地区"] : []),
      // 解锁分组
      ...unlockGroupNames,
      // 带宽分组
      ...availableTiers,
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