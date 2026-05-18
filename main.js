// v4.6
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

  // 扩展地区检测：新增8个地区，覆盖常见订阅源
  const flagMap = {
    "🇭🇰": { name: "中国-香港", key: "hk" },
    "🇹🇼": { name: "中国-台湾", key: "tw" },
    "🇯🇵": { name: "日本", key: "jp" },
    "🇺🇸": { name: "美国", key: "us" },
    "🇸🇬": { name: "新加坡", key: "sg" },
    "🇰🇷": { name: "韩国", key: "kr" },
    "🇨🇳": { name: "中国", key: "cn" },
    "🇬🇧": { name: "英国", key: "gb" },
    "🇩🇪": { name: "德国", key: "de" },
    "🇫🇷": { name: "法国", key: "fr" },
    "🇦🇺": { name: "澳大利亚", key: "au" },
    "🇨🇦": { name: "加拿大", key: "ca" },
  }

  // 区域文字标签映射（补充 flagMap 的 emoji 检测）
  const regionTagMap = {
    "亚洲": { name: "亚洲", key: "asia" },
    "北美洲": { name: "北美洲", key: "northamerica" },
    "欧洲": { name: "欧洲", key: "europe" },
    "南美洲": { name: "南美洲", key: "southamerica" },
    "大洋洲": { name: "大洋洲", key: "oceania" },
  }

  // 倍率正则：匹配 【Nx】 标签（如【10x】、【2x】、【0.1x】）
  const multiplierRegex = /【(\d+(?:\.\d+)?)x】/

  // ABC 质量正则：匹配 A/B/C 前缀
  const qualityRegex = /^(A|B|C)\s*-\s*/

  // 优化地区检测：将所有代理名拼接后一次性扫描，避免双重循环
  const allNames = validProxies.map(p => p.name).join(" ")
  const foundFlags = new Set(
    Object.keys(flagMap).filter(flag => allNames.includes(flag))
  )
  const foundRegionTags = new Set(
    Object.keys(regionTagMap).filter(tag => allNames.includes(tag))
  )

  const availableRegions = [...foundFlags].map((flag) => ({
    name: `${flag}${flagMap[flag].name}`,
    flag: flagMap[flag].key,
    filter: flag,
  }))

  availableRegions.sort((a, b) => a.name.localeCompare(b.name, "zh"))

  // 带宽分级正则预编译，避免重复构建
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
        // 修复：低速节点(<1MB/s)不再伪装成 1MB/s
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

  // ===== 倍率分组分类 =====
  // 按倍率范围分组：高倍率专线(>=10x)、普通倍率(2x-9.99x)、低倍率(<2x)
  const multiplierGroups = { 高倍率专线: [], 普通倍率: [], 低倍率: [] }
  for (const proxy of validProxies) {
    const match = proxy.name.match(multiplierRegex)
    if (match) {
      const value = parseFloat(match[1])
      let tier
      if (value >= 10) {
        tier = "高倍率专线"
      } else if (value >= 2) {
        tier = "普通倍率"
      } else {
        tier = "低倍率"
      }
      multiplierGroups[tier].push(proxy.name)
    }
  }

  const availableMultiplierTiers = Object.keys(multiplierGroups).filter(
    tier => multiplierGroups[tier].length > 0
  )

  // ===== ABC 质量分组分类 =====
  // 按 A/B/C 前缀分类，创建质量分级代理组
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

  // ===== 直连节点识别 =====
  // 识别节点名中包含"直连"标签的节点
  const directProxies = validProxies
    .filter(p => p.name.includes("直连"))
    .map(p => p.name)

  // ===== 区域标签分组 =====
  const availableRegionTagGroups = [...foundRegionTags].map(tag => ({
    name: `【${tag}】节点`,
    filter: tag,
  }))

  // ===== 平台解锁分组配置 =====
  // 根据代理名称中的标记动态生成分组，用户可手动选择对应解锁节点
  const unlockMap = {
    "GPT": { name: "GPT解锁", filter: "GPT", icon: "ChatGPT.png" },
    "NF": { name: "Netflix解锁", filter: "NF", icon: "Netflix.png" },
    "GM": { name: "Gemini解锁", filter: "GM", icon: "https://cdn.jsdelivr.net/npm/@lobehub/icons-static-svg@latest/icons/gemini.svg" },
    "D+": { name: "Disney+解锁", filter: "D\\+", icon: "StreamingCN.png" },
    "YT": { name: "YouTube解锁", filter: "YT-", icon: "YouTube.png" },
    "CL": { name: "Claude解锁", filter: "CL-", icon: "AI.png" },
    "SP": { name: "Spotify解锁", filter: "SP-", icon: "Spotify.png" },
  }

  // 预筛选：仅当代理列表中存在至少一个匹配节点时才创建对应解锁分组
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
    "自动选择",
    "自动回退",
  ]

  const regionNames = availableRegions.map((r) => r.name)
  const unlockGroupNames = availableUnlockGroups.map((g) => g.name)
  const regionTagGroupNames = availableRegionTagGroups.map((g) => g.name)

  const proxyGroups = []

  // 节点选择：按优先级排列（质量 > 倍率 > 直连 > 地区 > 区域 > 解锁 > 带宽 > 全局策略）
  proxyGroups.push({
    name: "节点选择",
    icon: `${CDN_QURE}Proxy.png`,
    type: "select",
    proxies: [
      // 质量分组（最高优先级）
      ...qualityTierNames,
      // 倍率分组
      ...availableMultiplierTiers,
      // 直连节点
      ...(directProxies.length > 0 ? ["直连节点"] : []),
      // 地区分组
      ...regionNames,
      // 区域标签分组
      ...regionTagGroupNames,
      // 解锁分组
      ...unlockGroupNames,
      // 带宽分组
      ...availableTiers,
      // 全局策略
      ...globalStrategies,
      "DIRECT",
    ],
  })

  // 质量回退分组：ABC 联合回退链（A级→B级→C级）
  if (qualityTierNames.length > 0) {
    proxyGroups.push({
      name: "质量回退",
      icon: `${CDN_STASH}fallback.png`,
      type: "fallback",
      proxies: qualityTierNames,
      url: "https://www.gstatic.com/generate_204",
      interval: 300,
    })
  }

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

  // 倍率分组（fallback：自动回退到同组可用节点）
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

  // 直连节点分组（select：用户手动选择）
  if (directProxies.length > 0) {
    proxyGroups.push({
      name: "直连节点",
      icon: `${CDN_STASH}direct.png`,
      type: "select",
      proxies: [...directProxies, "DIRECT"],
    })
  }

  // 区域标签分组（fallback：自动回退可用节点）
  for (const group of availableRegionTagGroups) {
    proxyGroups.push({
      name: group.name,
      icon: `${CDN_VERGE}balance.svg`,
      "include-all": true,
      filter: group.filter,
      type: "fallback",
      url: "https://www.gstatic.com/generate_204",
      interval: 300,
    })
  }

  proxyGroups.push({
    name: "自动回退",
    icon: `${CDN_STASH}fallback.png`,
    "include-all": true,
    "exclude-filter": "CN|China",
    type: "fallback",
    url: "https://www.gstatic.com/generate_204",
    interval: 300,
  })

  // 地区分组（fallback：自动回退到可用节点，用户可手动选择起始节点）
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

  // 平台解锁分组（fallback：自动回退可用节点）
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

  // 带宽分组
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
    name: "自动选择",
    icon: `${CDN_QURE}Auto.png`,
    "include-all": true,
    "exclude-filter": "CN|China",
    type: "url-test",
    interval: 300,
    tolerance: 50,
  })

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
      ...(qualityTierNames.length > 0 ? ["质量回退"] : []),
      ...qualityTierNames,
      // 倍率分组
      ...availableMultiplierTiers,
      // 直连节点
      ...(directProxies.length > 0 ? ["直连节点"] : []),
      // 全局策略
      ...globalStrategies,
      // 地区分组
      ...regionNames,
      // 区域标签分组
      ...regionTagGroupNames,
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