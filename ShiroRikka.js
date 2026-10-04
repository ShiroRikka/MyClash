// v4.41 — 清理 Mihomo 内核不识别的别名 hy2/shadowsocks/sockss（保留 socks5，内核实测接受）
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
  // 覆盖 MetaCubeX/mihomo 文档收录的代理类型，避免主流订阅（vmess/ss/ssr）整段丢失
  const protocolBins = {
    hysteria2: [],
    hysteria: [],
    tuic: [],
    masque: [],
    anytls: [],
    vless: [],
    vmess: [],
    ss: [],
    ssr: [],
    snell: [],
    socks: [],
    http: [],
    shadowquic: [],
    wireguard: [],
    mieru: [],
    trojan: [],
    tls: [],
    ssh: [],
  }

  // 收集被归类的节点对象，未归类的杂鱼直接丢弃
  const matchedProxies = []

  for (const proxy of validProxies) {
    const type = (proxy.type || "").toLowerCase()
    switch (type) {
      case "hysteria2":
        protocolBins.hysteria2.push(proxy.name)
        matchedProxies.push(proxy)
        break
      case "hysteria":
        protocolBins.hysteria.push(proxy.name)
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
        protocolBins.vless.push(proxy.name)
        matchedProxies.push(proxy)
        break
      case "vmess":
        protocolBins.vmess.push(proxy.name)
        matchedProxies.push(proxy)
        break
      case "ss":
        protocolBins.ss.push(proxy.name)
        matchedProxies.push(proxy)
        break
      case "ssr":
        protocolBins.ssr.push(proxy.name)
        matchedProxies.push(proxy)
        break
      case "snell":
        protocolBins.snell.push(proxy.name)
        matchedProxies.push(proxy)
        break
      case "socks":
      case "socks5":
        protocolBins.socks.push(proxy.name)
        matchedProxies.push(proxy)
        break
      case "http":
        protocolBins.http.push(proxy.name)
        matchedProxies.push(proxy)
        break
      case "shadowquic":
        protocolBins.shadowquic.push(proxy.name)
        matchedProxies.push(proxy)
        break
      case "wireguard":
        protocolBins.wireguard.push(proxy.name)
        matchedProxies.push(proxy)
        break
      case "mieru":
        protocolBins.mieru.push(proxy.name)
        matchedProxies.push(proxy)
        break
      case "trojan":
        protocolBins.trojan.push(proxy.name)
        matchedProxies.push(proxy)
        break
      case "tls":
        protocolBins.tls.push(proxy.name)
        matchedProxies.push(proxy)
        break
      case "ssh":
        protocolBins.ssh.push(proxy.name)
        matchedProxies.push(proxy)
        break
      // 其他协议类型不归入任何分组，直接丢弃
    }
  }

  // 用归类后的节点列表覆盖原始 proxies，杂鱼全部清除
  config.proxies = matchedProxies

  config["geodata-mode"] = true
  config["unified-delay"] = true
  config["tcp-concurrent"] = true
  config["ipv6"] = true
  config.profile = {
    "store-selected": true,
    "store-fake-ip": true,
  }
  // 官方源：MetaCubeX/meta-rules-dat（geodata-mode=true 场景用 -lite 变体更精简）
  config["geox-url"] = {
    geoip: "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip-lite.dat",
    geosite: "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat",
    mmdb: "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/country-lite.mmdb",
    asn: "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/GeoLite2-ASN.mmdb",
  }

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
  function createProtocolGroup(name, icon, proxies) {
    const fallbackName = `${name}-自动回退`
    return [
      {
        name: fallbackName,
        ...fallbackBaseOption,
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

  // 协议分组清单：binKey → [显示名, 图标]
  // 图标优先用仓库自带的 CDN_ICONS，未收录的协议回退到 Qure/Color/Proxy.png
  const PROTOCOLS = [
    ["hysteria2",    "Hysteria2",    `${CDN_ICONS}hysteria2.svg`],
    ["hysteria",     "Hysteria",     `${CDN_QURE}Proxy.png`],
    ["tuic",         "TUIC",         `${CDN_ICONS}tuic.svg`],
    ["masque",       "Masque",       `${CDN_ICONS}masque.svg`],
    ["anytls",       "AnyTLS",       `${CDN_ICONS}anytls.svg`],
    ["vless",        "VLESS",        `${CDN_ICONS}vless.svg`],
    ["vmess",        "VMess",        `${CDN_QURE}Proxy.png`],
    ["ss",           "Shadowsocks",  `${CDN_QURE}Proxy.png`],
    ["ssr",          "Shadowsocksr", `${CDN_QURE}Proxy.png`],
    ["snell",        "Snell",        `${CDN_QURE}Proxy.png`],
    ["socks",        "Socks",        `${CDN_QURE}Proxy.png`],
    ["http",         "HTTP",         `${CDN_QURE}Proxy.png`],
    ["shadowquic",   "ShadowQuic",   `${CDN_QURE}Proxy.png`],
    ["wireguard",    "WireGuard",    `${CDN_ICONS}wireguard.svg`],
    ["mieru",        "Mieru",        `${CDN_ICONS}mieru.svg`],
    ["trojan",       "Trojan",       `${CDN_ICONS}trojan.svg`],
    ["tls",          "TLS",          `${CDN_QURE}Proxy.png`],
    ["ssh",          "SSH",          `${CDN_QURE}Proxy.png`],
  ]

  const proxyGroups = []
  const mainGroupNames = []

  for (const [binKey, groupName, icon] of PROTOCOLS) {
    const nodes = protocolBins[binKey]
    if (nodes.length > 0) {
      proxyGroups.push(...createProtocolGroup(groupName, icon, nodes))
      mainGroupNames.push(groupName)
    }
  }

  // 负载均衡（load-balance, hidden）— 在协议组间均衡分配流量
  if (mainGroupNames.length > 0) {
    proxyGroups.push({
      name: "负载均衡",
      type: "load-balance",
      url: "https://www.gstatic.com/generate_204",
      interval: 300,
      timeout: 3000,
      lazy: false,
      strategy: "round-robin",
      hidden: true,
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
      ...(mainGroupNames.length > 0 ? ["负载均衡"] : []),
      ...mainGroupNames,
      "DIRECT",
    ],
  })

  // 漏网之鱼
  proxyGroups.push({
    name: "漏网之鱼",
    icon: `${CDN_QURE}Final.png`,
    type: "select",
    proxies: ["节点选择", "DIRECT"],
  })
  // GLOBAL — 按文档建议书写完整：包含所有非 GLOBAL 分组（含 -自动回退 子组与负载均衡）
  proxyGroups.push({
    name: "GLOBAL",
    icon: `${CDN_QURE}Global.png`,
    type: "select",
    proxies: proxyGroups.map(g => g.name),
  })

  // 将「节点选择」移到最前面
  const ngIdx = proxyGroups.findIndex(g => g.name === "节点选择")
  if (ngIdx > 0) {
    const [nodeSelect] = proxyGroups.splice(ngIdx, 1)
    proxyGroups.unshift(nodeSelect)
  }

  config["proxy-groups"] = proxyGroups

  // ===== DNS 配置 =====
  config.dns = {
    enable: true,
    ipv6: true,
    listen: "0.0.0.0:1053",
    "cache-algorithm": "arc",
    "use-hosts": true,
    "use-system-hosts": true,
    "enhanced-mode": "fake-ip",
    "fake-ip-range": "198.18.0.1/16",
    "fake-ip-range6": "fdfe:dcba:9876::1/64",
    "fake-ip-filter": [
      "geosite:connectivity-check",
      "geosite:private",
    ],
    "proxy-server-nameserver": ["https://dns.alidns.com/dns-query#DIRECT", "https://dns.doh.pub/dns-query#DIRECT"],
    "default-nameserver": ["223.5.5.5", "119.29.29.29"],
    "nameserver-policy": {
      "geosite:gfw": [
        "https://dns.cloudflare.com/dns-query#节点选择",
        "https://dns.google/dns-query#节点选择",
      ],
    },
    nameserver: [
      "https://dns.alidns.com/dns-query",
      "https://dns.doh.pub/dns-query",
    ],
    fallback: [
      "https://dns.cloudflare.com/dns-query#节点选择",
      "https://dns.google/dns-query#节点选择",
    ],
    "fallback-filter": {
      geoip: true,
      "geoip-code": "CN",
      ipcidr: [
        "240.0.0.0/4",
        "0.0.0.0/32",
        "127.0.0.0/8",
        "100.64.0.0/10",
      ],
    },
    "direct-nameserver": [
      "https://dns.alidns.com/dns-query#DIRECT",
      "https://dns.doh.pub/dns-query#DIRECT",
    ],
  }

  // ===== Hosts =====
  config.hosts = {
    "dns.alidns.com": ["223.5.5.5", "223.6.6.6"],
    "dns.doh.pub": ["1.12.12.12", "120.53.53.53"],
    "doh.pub": ["1.12.12.12", "120.53.53.53"],
    "dns.cloudflare.com": ["1.1.1.1", "1.0.0.1"],
    "dns.google": ["8.8.8.8", "8.8.4.4"],
    "services.googleapis.cn": "services.googleapis.com",
    "+.mcdn.bilivideo.com": ["0.0.0.0"],
    "+.mcdn.bilivideo.cn": ["0.0.0.0"],
  }

  // 数据源：https://github.com/MetaCubeX/meta-rules-dat

  // ===== Sniffer 配置 =====
  config.sniffer = {
    enable: true,
    "force-dns-mapping": true,
    "parse-pure-ip": true,
    "override-destination": true,
    sniff: {
      HTTP: {
        ports: [80, "8080-8880"],
        "override-destination": true,
      },
      TLS: {
        ports: [443, 8443],
      },
      QUIC: {
        ports: [443, 8443],
      },
    },
    "skip-domain": [
      "Mijia Cloud",
      "+.push.apple.com",
    ],
  }

  // ===== Rules =====
  // GEOIP 国家代码统一大写，对齐文档示例
  config["rules"] = [
    // 广告拦截（最优先）
    "GEOSITE,category-ads-all,REJECT",
    // 私有域名直连
    "GEOSITE,private,DIRECT",
    // 国内域名直连
    "GEOSITE,CN,DIRECT",
    // 国外域名走代理
    "GEOSITE,geolocation-!cn,节点选择",
    // IP 规则
    "GEOIP,private,DIRECT,no-resolve",
    "GEOIP,CN,DIRECT,no-resolve",
    "GEOIP,telegram,节点选择,no-resolve",
    // 兜底
    "MATCH,漏网之鱼",
  ]

  return config
}
