// v1.0
function main(config) {
  // 参数校验：确保传入有效的配置对象
  if (!config || typeof config !== "object") {
    throw new TypeError("config 必须是对象")
  }

  // 从 config 中获取用户配置（订阅 URL 等）
  const subscriptionUrl = config.subscriptionUrl || "此处填入机场订阅链接"
  const customProxies = Array.isArray(config.proxies) ? config.proxies : []

  // CDN 常量
  const CDN = "https://fastly.jsdelivr.net/gh/"
  const CDN_QURE = `${CDN}Koolson/Qure@master/IconSet/Color/`
  const CDN_METACUBE = `${CDN}MetaCubeX/meta-rules-dat@meta/geo/`
  const CDN_666OS = `${CDN}666OS/rules@release/mihomo/`
  const CDN_AIBLOCK = `${CDN}217heidai/adblockfilters@main/rules/`
  const CDN_WWQ = `${CDN}wwqgtxx/clash-rules@release/`
  const CDN_MYCLASH = "https://fastly.jsdelivr.net/gh/AIsouler/MyClash@main/Rules/"
  const CDN_CN_ADDITIONAL = "https://static-file-global.353355.xyz/rules/"

  // ===== 锚点：代理提供者通用属性 =====
  const proxyProvidersCommon = {
    type: "http",
    interval: 86400,
    proxy: "DIRECT",
    "health-check": {
      enable: true,
      url: "https://g.cn/generate_204",
      interval: 600,
      lazy: true,
    },
  }

  // ===== 锚点：全局过滤规则 =====
  const excludeFilter =
    "群|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|备用|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|频道|无法|说明|使用|提示|特别|访问|支持|教程|关注|更新|作者|加入|超时|收藏|福利|邀请|好友|失联|选择|剩余|公益|发布|DIZTNA|通路|登录|禁止|定时|渠道|牢记|永久|余额|阁下|本站|刷新|导航|⚠️|@|Expire|http|com"

  // ===== 代理提供者 =====
  const proxyProviders = {
    provider1: {
      ...proxyProvidersCommon,
      "exclude-filter": excludeFilter,
      url: subscriptionUrl,
      path: "./proxy_providers/provider1.yaml",
    },
  }

  // ===== 直连节点 =====
  const proxies = [
    { name: "🇨🇳 直连 | IPv4优先", type: "direct", "ip-version": "ipv4-prefer" },
    { name: "🇨🇳 直连 | IPv6优先", type: "direct", "ip-version": "ipv6-prefer" },
    { name: "🇨🇳 直连 | 双栈", type: "direct" },
  ]

  // ===== DNS 锚点 =====
  const chinaDNS = [
    "https://dns.alidns.com/dns-query#DIRECT",
    "https://doh.pub/dns-query#DIRECT",
  ]
  const foreignDNS = [
    "https://dns.cloudflare.com/dns-query#默认代理",
    "https://dns.google/dns-query#默认代理",
  ]

  // ===== DNS 配置 =====
  const dns = {
    enable: true,
    ipv6: true,
    listen: ":1053",
    "cache-algorithm": "arc",
    "use-hosts": true,
    "use-system-hosts": true,
    "enhanced-mode": "fake-ip",
    "fake-ip-range": "198.18.0.1/16",
    "fake-ip-range-v6": "fc00::/18",
    "fake-ip-filter": ["rule-set:private", "rule-set:fakeip_filter"],
    "proxy-server-nameserver": chinaDNS,
    "default-nameserver": ["223.5.5.5", "119.29.29.29"],
    nameserver: foreignDNS,
    "nameserver-policy": {
      "*": "system",
      "rule-set:cn": chinaDNS,
    },
    "direct-nameserver": ["system", "223.5.5.5", "119.29.29.29"],
  }

  // ===== Hosts =====
  const hosts = {
    "dns.alidns.com": ["223.5.5.5", "223.6.6.6"],
    "doh.pub": ["1.12.12.12", "120.53.53.53"],
    "dns.cloudflare.com": ["1.1.1.1", "1.0.0.1"],
    "dns.google": ["8.8.8.8", "8.8.4.4"],
    "services.googleapis.cn": ["services.googleapis.com"],
    "+.mcdn.bilivideo.com": ["0.0.0.0"],
    "+.mcdn.bilivideo.cn": ["0.0.0.0"],
  }

  // ===== NTP =====
  const ntp = {
    enable: true,
    "write-to-system": false,
    server: "ntp.aliyun.com",
    port: 123,
    interval: 60,
  }

  // ===== TUN =====
  const tun = {
    enable: true,
    stack: "system",
    "auto-route": true,
    "strict-route": true,
    "auto-redirect": true,
    "auto-detect-interface": true,
    "dns-hijack": ["udp://any:53", "tcp://any:53"],
  }

  // ===== 规则提供者通用配置 =====
  const rpDomain = { type: "http", interval: 86400, behavior: "domain" }
  const rpIP = { type: "http", interval: 86400, behavior: "ipcidr" }
  const rpClassical = { type: "http", interval: 86400, behavior: "classical" }

  // ===== 规则提供者 =====
  const ruleProviders = {
    adblockmihomolite: {
      ...rpDomain,
      format: "mrs",
      url: `${CDN_AIBLOCK}adblockmihomolite.mrs`,
      path: "./ruleset/adblockmihomolite.mrs",
    },
    DownloadApps: {
      ...rpClassical,
      format: "text",
      url: `${CDN_MYCLASH}DownloadApps.txt`,
      path: "./ruleset/DownloadApps.txt",
    },
    fakeip_filter: {
      ...rpDomain,
      format: "mrs",
      url: `${CDN_WWQ}fakeip-filter.mrs`,
      path: "./ruleset/fakeip-filter.mrs",
    },
    epicgames: {
      ...rpDomain,
      format: "mrs",
      url: `${CDN_METACUBE}geosite/epicgames.mrs`,
      path: "./ruleset/epicgames.mrs",
    },
    nvidia_cn: {
      ...rpDomain,
      format: "mrs",
      url: `${CDN_METACUBE}geosite/nvidia@cn.mrs`,
      path: "./ruleset/nvidia@cn.mrs",
    },
    ai: {
      ...rpDomain,
      format: "mrs",
      url: `${CDN_METACUBE}geosite/category-ai-!cn.mrs`,
      path: "./ruleset/ai.mrs",
    },
    youtube: {
      ...rpDomain,
      format: "mrs",
      url: `${CDN_METACUBE}geosite/youtube.mrs`,
      path: "./ruleset/youtube.mrs",
    },
    googlefcm: {
      ...rpDomain,
      format: "mrs",
      url: `${CDN_METACUBE}geosite/googlefcm.mrs`,
      path: "./ruleset/googlefcm.mrs",
    },
    google: {
      ...rpDomain,
      format: "mrs",
      url: `${CDN_METACUBE}geosite/google.mrs`,
      path: "./ruleset/google.mrs",
    },
    google_ip: {
      ...rpIP,
      format: "mrs",
      url: `${CDN_METACUBE}geoip/google.mrs`,
      path: "./ruleset/google_ip.mrs",
    },
    github: {
      ...rpDomain,
      format: "mrs",
      url: `${CDN_METACUBE}geosite/github.mrs`,
      path: "./ruleset/github.mrs",
    },
    microsoft: {
      ...rpDomain,
      format: "mrs",
      url: `${CDN_METACUBE}geosite/microsoft.mrs`,
      path: "./ruleset/microsoft.mrs",
    },
    telegram: {
      ...rpDomain,
      format: "mrs",
      url: `${CDN_METACUBE}geosite/telegram.mrs`,
      path: "./ruleset/telegram.mrs",
    },
    telegram_ip: {
      ...rpIP,
      format: "mrs",
      url: `${CDN_METACUBE}geoip/telegram.mrs`,
      path: "./ruleset/telegram_ip.mrs",
    },
    pixiv: {
      ...rpDomain,
      format: "mrs",
      url: `${CDN_METACUBE}geosite/pixiv.mrs`,
      path: "./ruleset/pixiv.mrs",
    },
    steam: {
      ...rpDomain,
      format: "mrs",
      url: `${CDN_METACUBE}geosite/steam.mrs`,
      path: "./ruleset/steam.mrs",
    },
    games_cn: {
      ...rpDomain,
      format: "mrs",
      url: `${CDN_METACUBE}geosite/category-games@cn.mrs`,
      path: "./ruleset/category-games@cn.mrs",
    },
    twitter: {
      ...rpDomain,
      format: "mrs",
      url: `${CDN_METACUBE}geosite/twitter.mrs`,
      path: "./ruleset/twitter.mrs",
    },
    twitter_ip: {
      ...rpIP,
      format: "mrs",
      url: `${CDN_METACUBE}geoip/twitter.mrs`,
      path: "./ruleset/twitter_ip.mrs",
    },
    private: {
      ...rpDomain,
      format: "mrs",
      url: `${CDN_METACUBE}geosite/private.mrs`,
      path: "./ruleset/private.mrs",
    },
    private_ip: {
      ...rpIP,
      format: "mrs",
      url: `${CDN_METACUBE}geoip/private.mrs`,
      path: "./ruleset/private_ip.mrs",
    },
    gfw: {
      ...rpDomain,
      format: "mrs",
      url: `${CDN_METACUBE}geosite/gfw.mrs`,
      path: "./ruleset/gfw.mrs",
    },
    cn_additional: {
      ...rpDomain,
      format: "mrs",
      url: `${CDN_CN_ADDITIONAL}cn-additional-list.mrs`,
      path: "./ruleset/cn-additional-list.mrs",
    },
    cn: {
      ...rpDomain,
      format: "mrs",
      url: `${CDN_WWQ}direct.mrs`,
      path: "./ruleset/cn.mrs",
    },
    cn_ip: {
      ...rpIP,
      format: "mrs",
      url: `${CDN_METACUBE}geoip/cn.mrs`,
      path: "./ruleset/cn_ip.mrs",
    },
    emby: {
      ...rpDomain,
      format: "mrs",
      url: `${CDN_666OS}domain/Emby.mrs`,
      path: "./ruleset/emby.mrs",
    },
    emby_ip: {
      ...rpIP,
      format: "mrs",
      url: `${CDN_666OS}ip/Emby.mrs`,
      path: "./ruleset/emby_ip.mrs",
    },
    spotify: {
      ...rpDomain,
      format: "mrs",
      url: `${CDN_METACUBE}geosite/spotify.mrs`,
      path: "./ruleset/spotify.mrs",
    },
    tiktok: {
      ...rpDomain,
      format: "mrs",
      url: `${CDN_METACUBE}geosite/tiktok.mrs`,
      path: "./ruleset/tiktok.mrs",
    },
    netflix: {
      ...rpDomain,
      format: "mrs",
      url: `${CDN_METACUBE}geosite/netflix.mrs`,
      path: "./ruleset/netflix.mrs",
    },
    netflix_ip: {
      ...rpIP,
      format: "mrs",
      url: `${CDN_METACUBE}geoip/netflix.mrs`,
      path: "./ruleset/netflix_ip.mrs",
    },
    cloudflare: {
      ...rpDomain,
      format: "mrs",
      url: `${CDN_METACUBE}geosite/cloudflare.mrs`,
      path: "./ruleset/cloudflare.mrs",
    },
    cloudflare_cn: {
      ...rpDomain,
      format: "mrs",
      url: `${CDN_METACUBE}geosite/cloudflare@cn.mrs`,
      path: "./ruleset/cloudflare@cn.mrs",
    },
    cloudflare_ip: {
      ...rpIP,
      format: "mrs",
      url: `${CDN_METACUBE}geoip/cloudflare.mrs`,
      path: "./ruleset/cloudflare_ip.mrs",
    },
    apple: {
      ...rpDomain,
      format: "mrs",
      url: `${CDN_METACUBE}geosite/apple.mrs`,
      path: "./ruleset/apple.mrs",
    },
    apple_cn: {
      ...rpDomain,
      format: "mrs",
      url: `${CDN_METACUBE}geosite/apple@cn.mrs`,
      path: "./ruleset/apple@cn.mrs",
    },
    instagram: {
      ...rpDomain,
      format: "mrs",
      url: `${CDN_METACUBE}geosite/instagram.mrs`,
      path: "./ruleset/instagram.mrs",
    },
  }

  // ===== 策略组通用配置 =====
  const groupCommonSelect = {
    type: "select",
    interval: 600,
    timeout: 3000,
    "max-failed-times": 3,
    url: "https://g.cn/generate_204",
    lazy: true,
  }

  const groupCommonAuto = {
    type: "url-test",
    interval: 600,
    timeout: 3000,
    "max-failed-times": 3,
    url: "https://g.cn/generate_204",
    lazy: true,
    tolerance: 100,
    "include-all": true,
    icon: `${CDN_QURE}Auto.png`,
    hidden: true,
  }

  // 通用代理节点组
  const proxCommon = [
    "默认代理",
    "香港",
    "日本",
    "美国",
    "新加坡",
    "台湾省",
    "低倍率节点",
    "高倍率节点",
    "其他节点",
  ]

  // ===== 策略组 =====
  const proxyGroups = [
    // 默认代理
    {
      name: "默认代理",
      ...groupCommonSelect,
      proxies: [
        "香港",
        "日本",
        "美国",
        "新加坡",
        "台湾省",
        "低倍率节点",
        "高倍率节点",
        "其他节点",
      ],
      icon: `${CDN_QURE}Proxy.png`,
    },

    // AI
    {
      name: "AI",
      ...groupCommonSelect,
      proxies: proxCommon,
      icon: `${CDN_QURE}ChatGPT.png`,
    },

    // YouTube
    {
      name: "YouTube",
      ...groupCommonSelect,
      proxies: proxCommon,
      icon: `${CDN_QURE}YouTube.png`,
    },

    // FCM
    {
      name: "FCM",
      ...groupCommonSelect,
      proxies: [
        "直连",
        "默认代理",
        "香港",
        "日本",
        "美国",
        "新加坡",
        "台湾省",
        "低倍率节点",
        "高倍率节点",
        "其他节点",
      ],
      icon: "https://fastly.jsdelivr.net/gh/MiToverG422/Qure@master/IconSet/Color/fcm.png",
    },

    // Google
    {
      name: "Google",
      ...groupCommonSelect,
      proxies: proxCommon,
      icon: `${CDN_QURE}Google_Search.png`,
    },

    // GitHub
    {
      name: "GitHub",
      ...groupCommonSelect,
      proxies: proxCommon,
      icon: `${CDN_QURE}GitHub.png`,
    },

    // Microsoft
    {
      name: "Microsoft",
      ...groupCommonSelect,
      proxies: [
        "默认代理",
        "直连",
        "香港",
        "日本",
        "美国",
        "新加坡",
        "台湾省",
        "低倍率节点",
        "高倍率节点",
        "其他节点",
      ],
      icon: `${CDN_QURE}Microsoft.png`,
    },

    // Apple
    {
      name: "Apple",
      ...groupCommonSelect,
      proxies: [
        "默认代理",
        "直连",
        "香港",
        "日本",
        "美国",
        "新加坡",
        "台湾省",
        "低倍率节点",
        "高倍率节点",
        "其他节点",
      ],
      icon: `${CDN_QURE}Apple.png`,
    },

    // Telegram
    {
      name: "Telegram",
      ...groupCommonSelect,
      proxies: proxCommon,
      icon: `${CDN_QURE}Telegram.png`,
    },

    // Cloudflare
    {
      name: "Cloudflare",
      ...groupCommonSelect,
      proxies: proxCommon,
      icon: `${CDN_QURE}Cloudflare.png`,
    },

    // Pixiv
    {
      name: "Pixiv",
      ...groupCommonSelect,
      proxies: proxCommon,
      icon: "https://play-lh.googleusercontent.com/Ls9opXo6-wfEWmbBU8heJaFS8HwWydssWE1J3vexIGvkF-UJDqcW7ZMD8w6dQABfygONd4z3Yt4TfRDZAPYq=w480-h960-rw",
    },

    // Steam
    {
      name: "Steam",
      ...groupCommonSelect,
      proxies: proxCommon,
      icon: `${CDN_QURE}Steam.png`,
    },

    // Twitter
    {
      name: "Twitter",
      ...groupCommonSelect,
      proxies: proxCommon,
      icon: `${CDN_QURE}Twitter.png`,
    },

    // Instagram
    {
      name: "Instagram",
      ...groupCommonSelect,
      proxies: proxCommon,
      icon: `${CDN_QURE}Instagram.png`,
    },

    // Emby
    {
      name: "Emby",
      ...groupCommonSelect,
      proxies: proxCommon,
      icon: `${CDN_QURE}Emby.png`,
    },

    // Spotify
    {
      name: "Spotify",
      ...groupCommonSelect,
      proxies: [
        "默认代理",
        "直连",
        "香港",
        "日本",
        "美国",
        "新加坡",
        "台湾省",
        "低倍率节点",
        "高倍率节点",
        "其他节点",
      ],
      icon: `${CDN_QURE}Spotify.png`,
    },

    // TikTok
    {
      name: "TikTok",
      ...groupCommonSelect,
      proxies: proxCommon,
      icon: `${CDN_QURE}TikTok.png`,
    },

    // Netflix
    {
      name: "Netflix",
      ...groupCommonSelect,
      proxies: proxCommon,
      icon: `${CDN_QURE}Netflix.png`,
    },

    // 广告拦截
    {
      name: "广告拦截",
      ...groupCommonSelect,
      proxies: ["REJECT", "REJECT-DROP", "PASS"],
      icon: `${CDN_QURE}Advertising.png`,
    },

    // 直连
    {
      name: "直连",
      ...groupCommonSelect,
      proxies: ["🇨🇳 直连 | IPv4优先", "🇨🇳 直连 | IPv6优先", "🇨🇳 直连 | 双栈"],
      url: "https://connectivitycheck.platform.hicloud.com/generate_204",
      icon: `${CDN_QURE}China_Map.png`,
    },

    // 香港
    {
      name: "香港",
      ...groupCommonSelect,
      "include-all": true,
      proxies: ["香港-自动选择"],
      filter: "🇭🇰|港|HK|[Hh]ong\\s*[Kk]ong",
      icon: `${CDN_QURE}Hong_Kong.png`,
    },
    // 香港-自动选择
    {
      name: "香港-自动选择",
      ...groupCommonAuto,
      filter: "🇭🇰|港|HK|[Hh]ong\\s*[Kk]ong",
    },

    // 日本
    {
      name: "日本",
      ...groupCommonSelect,
      "include-all": true,
      proxies: ["日本-自动选择"],
      filter: "🇯🇵|日本|JP|[Jj]apan",
      icon: `${CDN_QURE}Japan.png`,
    },
    // 日本-自动选择
    {
      name: "日本-自动选择",
      ...groupCommonAuto,
      filter: "🇯🇵|日本|JP|[Jj]apan",
    },

    // 美国
    {
      name: "美国",
      ...groupCommonSelect,
      "include-all": true,
      proxies: ["美国-自动选择"],
      filter: "🇺🇸|美|US|[Aa]merica|[Uu]nited\\s*[Ss]tates",
      icon: `${CDN_QURE}United_States.png`,
    },
    // 美国-自动选择
    {
      name: "美国-自动选择",
      ...groupCommonAuto,
      filter: "🇺🇸|美|US|[Aa]merica|[Uu]nited\\s*[Ss]tates",
    },

    // 新加坡
    {
      name: "新加坡",
      ...groupCommonSelect,
      "include-all": true,
      proxies: ["新加坡-自动选择"],
      filter: "🇸🇬|新加坡|狮城|SG|[Ss]ingapore",
      icon: `${CDN_QURE}Singapore.png`,
    },
    // 新加坡-自动选择
    {
      name: "新加坡-自动选择",
      ...groupCommonAuto,
      filter: "🇸🇬|新加坡|狮城|SG|[Ss]ingapore",
    },

    // 台湾省
    {
      name: "台湾省",
      ...groupCommonSelect,
      "include-all": true,
      proxies: ["台湾省-自动选择"],
      filter: "🇹🇼|台湾|TW|[Tt]aiwan",
      icon: `${CDN_QURE}Taiwan.png`,
    },
    // 台湾省-自动选择
    {
      name: "台湾省-自动选择",
      ...groupCommonAuto,
      filter: "🇹🇼|台湾|TW|[Tt]aiwan",
    },

    // 低倍率节点
    {
      name: "低倍率节点",
      ...groupCommonSelect,
      "include-all": true,
      filter: "^(?!.*(?:剩|期|客户端|软件)).*(?:(?<!\\d)0\\.[0-5]|下载|低倍)",
      icon: `${CDN_QURE}Available_1.png`,
    },

    // 高倍率节点
    {
      name: "高倍率节点",
      ...groupCommonSelect,
      "include-all": true,
      filter:
        "(?u)(?:[*×xX✕✖⨉]\\s*(?:[2-9]\\d*|[1-9]\\d+)(?:\\.\\d+)?)|(?:(?<![\\d.])(?:[2-9]\\d*|[1-9]\\d+)(?:\\.\\d+)?\\s*(?:倍|[*×xX✕✖⨉]))",
      icon: `${CDN_QURE}Airport.png`,
    },

    // 其他节点
    {
      name: "其他节点",
      ...groupCommonSelect,
      "include-all": true,
      proxies: ["其他节点-自动选择"],
      "exclude-filter":
        "港|HK|🇭🇰|日本|JP|🇯🇵|美|US|🇺🇸|新加坡|SG|🇸🇬|台湾|TW|🇹🇼|直连",
      icon: `${CDN_QURE}World_Map.png`,
    },
    // 其他节点-自动选择
    {
      name: "其他节点-自动选择",
      ...groupCommonAuto,
      "exclude-filter":
        "港|HK|🇭🇰|日本|JP|🇯🇵|美|US|🇺🇸|新加坡|SG|🇸🇬|台湾|TW|🇹🇼|直连",
    },
  ]

  // ===== 路由规则 =====
  const rules = [
    // 私有网络直连
    "RULE-SET,private,直连",
    "RULE-SET,private_ip,直连,no-resolve",

    // 国内直连
    "RULE-SET,games_cn,直连",
    "RULE-SET,epicgames,直连",
    "RULE-SET,nvidia_cn,直连",
    "RULE-SET,cloudflare_cn,直连",
    "RULE-SET,apple_cn,直连",
    "DOMAIN,fsend.cn,直连",

    // 进程规则
    "RULE-SET,DownloadApps,直连",
    "PROCESS-NAME,com.perol.pixez,Pixiv",
    "PROCESS-NAME,com.perol.play.pixez,Pixiv",

    // 广告拦截
    "RULE-SET,adblockmihomolite,广告拦截",

    // 阻断 YouTube UDP 流量
    "AND,((NETWORK,UDP),(DST-PORT,443),(RULE-SET,youtube)),REJECT",

    // 代理规则（域名）
    "RULE-SET,ai,AI",
    "RULE-SET,youtube,YouTube",
    "RULE-SET,googlefcm,FCM",
    "RULE-SET,google,Google",
    "RULE-SET,github,GitHub",
    "RULE-SET,microsoft,Microsoft",
    "RULE-SET,apple,Apple",
    "RULE-SET,telegram,Telegram",
    "RULE-SET,cloudflare,Cloudflare",
    "RULE-SET,pixiv,Pixiv",
    "RULE-SET,steam,Steam",
    "RULE-SET,twitter,Twitter",
    "RULE-SET,instagram,Instagram",
    "RULE-SET,emby,Emby",
    "DOMAIN-KEYWORD,emby,Emby",
    "RULE-SET,spotify,Spotify",
    "RULE-SET,tiktok,TikTok",
    "RULE-SET,netflix,Netflix",

    // 代理规则（IP）
    "RULE-SET,google_ip,Google,no-resolve",
    "RULE-SET,telegram_ip,Telegram,no-resolve",
    "RULE-SET,twitter_ip,Twitter,no-resolve",
    "RULE-SET,cloudflare_ip,Cloudflare,no-resolve",
    "RULE-SET,emby_ip,Emby,no-resolve",
    "RULE-SET,netflix_ip,Netflix,no-resolve",

    // 兜底规则
    "RULE-SET,gfw,默认代理",
    "RULE-SET,cn_additional,直连",
    "RULE-SET,cn_ip,直连",
    "MATCH,默认代理",
  ]

  // ===== 组装最终配置 =====
  const result = {
    ...config,
    "proxy-providers": proxyProviders,
    "allow-lan": true,
    ipv6: true,
    "bind-address": "*",
    "unified-delay": true,
    "tcp-concurrent": true,
    "keep-alive-idle": 600,
    "keep-alive-interval": 60,
    "find-process-mode": "strict",
    "external-controller": "[::]:9090",
    "external-ui": "ui",
    "external-ui-url":
      "https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip",
    profile: {
      "store-selected": true,
      "store-fake-ip": true,
    },
    proxies: [...proxies, ...customProxies],
    dns,
    hosts,
    ntp,
    tun,
    "rule-providers": ruleProviders,
    "proxy-groups": proxyGroups,
    rules,
  }

  return result
}
