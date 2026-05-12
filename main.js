// v4.5.5
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

  const flagMap = {
    "🇭🇰": { name: "中国-香港", key: "hk" },
    "🇹🇼": { name: "中国-台湾", key: "tw" },
    "🇯🇵": { name: "日本", key: "jp" },
    "🇺🇸": { name: "美国", key: "us" },
  }

  // 优化地区检测：将所有代理名拼接后一次性扫描，避免双重循环
  const allNames = validProxies.map(p => p.name).join(" ")
  const foundFlags = new Set(
    Object.keys(flagMap).filter(flag => allNames.includes(flag))
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

  const proxyGroups = []

  proxyGroups.push({
    name: "节点选择",
    icon: `${CDN_QURE}Proxy.png`,
    type: "select",
    proxies: [
      ...regionNames,
      ...unlockGroupNames,
      ...availableTiers,
      ...globalStrategies,
      "DIRECT",
    ],
  })

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
      ...globalStrategies,
      ...regionNames,
      ...unlockGroupNames,
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

  // DNS防泄露+智能分流配置 (v4.5.5)
  config["dns"] = {
    enable: true,
    listen: "0.0.0.0:1053",
    "prefer-h3": true,
    "use-hosts": true,
    "use-system-hosts": true,
    // 核心：DNS查询遵循代理路由规则，防泄露关键
    "respect-rules": true,
    ipv6: false,
    // 解析DNS服务器域名专用（必须直连）
    "default-nameserver": [
      "223.5.5.5",
      "119.29.29.29",
    ],
    "enhanced-mode": "fake-ip",
    "fake-ip-range": "198.18.0.1/16",
    // 扩大fake-ip过滤范围，避免关键服务走fake-ip异常
    "fake-ip-filter": [
      "*.lan",
      "localhost.ptlogin2.qq.com",
      "+.local",
      "time.*.com",
      "ntp.*.com",
      "time.windows.com",
      "time.apple.com",
      "swscan.apple.com",
      "stun.*",
      "+.stun.*",
      "geosite:private",
      "geosite:cn",
    ],
    // 策略分流：不同域名走不同DNS
    "nameserver-policy": {
      // 国内域名/直连域名 → 国内DoH（直连，不泄露）
      "geosite:cn,private": [
        "https://dns.alidns.com/dns-query",
        "https://doh.pub/dns-query",
      ],
      // 国外域名 → 国外DoH（走代理，防泄露）
      "geosite:geolocation-!cn": [
        "https://dns.google/dns-query",
        "https://cloudflare-dns.com/dns-query",
      ],
    },
    // 兜底nameserver
    nameserver: [
      "https://dns.alidns.com/dns-query",
      "https://doh.pub/dns-query",
    ],
    // fallback全部使用DoH，DoT的853端口容易被干扰
    fallback: [
      "https://dns.google/dns-query",
      "https://cloudflare-dns.com/dns-query",
      "https://1.1.1.1/dns-query",
    ],
    // 解析代理服务器域名专用（必须直连，确保能连上代理）
    "proxy-server-nameserver": [
      "223.5.5.5",
      "119.29.29.29",
    ],
    "fallback-filter": {
      geoip: true,
      "geoip-code": "CN",
      geosite: [
        "gfw",
      ],
      ipcidr: [
        "240.0.0.0/4",
      ],
      domain: [
        "+.google.com",
        "+.facebook.com",
        "+.youtube.com",
      ],
    },
  }

  return config
}