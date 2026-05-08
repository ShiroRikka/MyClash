// v3.1.0-负载均衡版
function main(config) {
  const allProxies = config.proxies || [];
  const CDN = "https://cdn.jsdelivr.net/gh/";
  const CDN_FLAGS = `${CDN}lipis/flag-icons@main/flags/4x3/`;
  const CDN_QURE = `${CDN}Koolson/Qure@master/IconSet/Color/`;
  const CDN_VERGE = `${CDN}clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/`;
  const CDN_STASH = `${CDN}shindgewongxj/WHATSINStash@master/icon/`;

  const flagMap = {
    "🇨🇳": { name: "中国", key: "cn" },
    "🇭🇰": { name: "中国-香港", key: "hk" },
    "🇹🇼": { name: "中国-台湾", key: "tw" },
    "🇸🇬": { name: "新加坡", key: "sg" },
    "🇯🇵": { name: "日本", key: "jp" },
    "🇺🇸": { name: "美国", key: "us" },
    "🇰🇷": { name: "韩国", key: "kr" },
  };

  const foundFlags = new Set();
  for (const proxy of allProxies) {
    for (const flag of Object.keys(flagMap)) {
      if (proxy.name.includes(flag)) {
        foundFlags.add(flag);
      }
    }
  }

  const availableRegions = [...foundFlags].map((flag) => ({
    name: `${flag}${flagMap[flag].name}`,
    flag: flagMap[flag].key,
    filter: flag,
  }));

  availableRegions.sort((a, b) => a.name.localeCompare(b.name, "zh"));

  const bandwidthGroups = {};
  for (const proxy of allProxies) {
    const match = proxy.name.match(/(\d+(?:\.\d+)?)\s*MB\/s/i);
    if (match) {
      const speed = parseFloat(match[1]);
      const tier = `${Math.floor(speed)}MB/s`;
      if (!bandwidthGroups[tier]) {
        bandwidthGroups[tier] = [];
      }
      bandwidthGroups[tier].push(proxy.name);
    }
  }

  const availableTiers = Object.keys(bandwidthGroups).sort((a, b) => {
    const numA = parseInt(a);
    const numB = parseInt(b);
    return numB - numA;
  });

  const globalStrategies = [
    "自动选择",
    "自动回退",
    "负载均衡-轮询",
    "负载均衡-哈希",
    "负载均衡-粘滞",
    "手动切换",
  ];

  const regionNames = availableRegions.map((r) => r.name);

  const proxyGroups = [];

  proxyGroups.push({
    name: "节点选择",
    icon: `${CDN_QURE}Proxy.png`,
    type: "select",
    proxies: [
      ...regionNames,
      ...availableTiers,
      ...globalStrategies,
      "DIRECT",
    ],
  });

  proxyGroups.push({
    name: "手动切换",
    icon: `${CDN_STASH}select.png`,
    "include-all": true,
    type: "select",
  });

  for (const region of availableRegions) {
    proxyGroups.push({
      name: region.name,
      icon: `${CDN_FLAGS}${region.flag}.svg`,
      "include-all": true,
      filter: region.filter,
      type: "load-balance",
      url: "https://www.gstatic.com/generate_204",
      interval: 300,
      strategy: "round-robin",
    });
  }

  for (const tier of availableTiers) {
    const proxies = bandwidthGroups[tier];
    if (proxies.length > 0) {
      proxyGroups.push({
        name: tier,
        icon: `${CDN_VERGE}balance.svg`,
        type: "load-balance",
        proxies: proxies,
        url: "https://www.gstatic.com/generate_204",
        interval: 300,
        strategy: "round-robin",
      });
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
  });

  proxyGroups.push({
    name: "自动回退",
    icon: `${CDN_STASH}fallback.png`,
    "include-all": true,
    "exclude-filter": "CN|China",
    type: "fallback",
    url: "https://www.gstatic.com/generate_204",
    interval: 300,
  });

  proxyGroups.push({
    name: "负载均衡-轮询",
    icon: `${CDN_VERGE}balance.svg`,
    "include-all": true,
    "exclude-filter": "CN|China",
    type: "load-balance",
    url: "https://www.gstatic.com/generate_204",
    interval: 300,
    strategy: "round-robin",
  });

  proxyGroups.push({
    name: "负载均衡-哈希",
    icon: `${CDN_VERGE}merry_go.svg`,
    "include-all": true,
    "exclude-filter": "CN|China",
    type: "load-balance",
    url: "https://www.gstatic.com/generate_204",
    interval: 300,
    strategy: "consistent-hashing",
  });

  proxyGroups.push({
    name: "负载均衡-粘滞",
    icon: `${CDN_VERGE}link.svg`,
    "include-all": true,
    "exclude-filter": "CN|China",
    type: "load-balance",
    url: "https://www.gstatic.com/generate_204",
    interval: 300,
    strategy: "sticky-sessions",
  });

  proxyGroups.push({
    name: "广告拦截",
    icon: `${CDN_QURE}AdBlack.png`,
    type: "select",
    proxies: ["REJECT", "DIRECT"],
  });

  proxyGroups.push({
    name: "应用净化",
    icon: `${CDN_QURE}Hijacking.png`,
    type: "select",
    proxies: ["REJECT", "DIRECT"],
  });

  proxyGroups.push({
    name: "GLOBAL",
    icon: `${CDN_QURE}Global.png`,
    "include-all": true,
    type: "select",
    proxies: [
      "节点选择",
      ...globalStrategies,
      ...regionNames,
      ...availableTiers,
      "广告拦截",
      "应用净化",
    ],
  });

  config["proxy-groups"] = proxyGroups;

  const ruleProviderBase = { type: "http", interval: 86400 };
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
  ];

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
  );

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
    "MATCH,节点选择",
  ];

  return config;
}
