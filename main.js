// v4.9
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

  // 其他地区：合并到「其他地区」分组
  const otherRegionsMap = {
    "🇨🇳": { name: "中国", key: "cn" },
    "🇬🇧": { name: "英国", key: "gb" },
    "🇩🇪": { name: "德国", key: "de" },
    "🇫🇷": { name: "法国", key: "fr" },
    "🇦🇺": { name: "澳大利亚", key: "au" },
    "🇨🇦": { name: "加拿大", key: "ca" },
  }

  // ABC 质量正则：匹配 A/B/C 前缀
  const qualityRegex = /^(A|B|C)\s*-\s*/

  // 倍率正则：匹配 【Nx】 标签（如【10x】、【2x】、【0.1x】）
  const multiplierRegex = /【(\d+(?:\.\d+)?)x】/

  // 汇总所有代理名，一次性扫描
  const allNames = validProxies.map(p => p.name).join(" ")

  // ===== 地区检测 =====
  const foundMainFlags = new Set(
    Object.keys(mainRegionsMap).filter(flag => allNames.includes(flag))
  )
  const foundOtherFlags = new Set(
    Object.keys(otherRegionsMap).filter(flag => allNames.includes(flag))
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