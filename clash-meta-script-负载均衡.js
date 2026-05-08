// v3.0.1-负载均衡版
function main(config) {
  const allProxies = config.proxies || [];
  const CDN = "https://cdn.jsdelivr.net/gh/";
  const CDN_FLAGS = `${CDN}lipis/flag-icons@main/flags/4x3/`;
  const CDN_QURE = `${CDN}Koolson/Qure@master/IconSet/Color/`;
  const CDN_VERGE = `${CDN}clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/`;
  const CDN_STASH = `${CDN}shindgewongxj/WHATSINStash@master/icon/`;

  const flagMap = {
    "🇨🇳": { name: "中国", key: "cn" },
    "🇺🇸": { name: "美国", key: "us" },
    "🇯🇵": { name: "日本", key: "jp" },
    "🇰🇷": { name: "韩国", key: "kr" },
    "🇭🇰": { name: "中国-香港", key: "hk" },
    "🇹🇼": { name: "中国-台湾", key: "tw" },
    "🇸🇬": { name: "新加坡", key: "sg" },
    "🇬🇧": { name: "英国", key: "gb" },
    "🇩🇪": { name: "德国", key: "de" },
    "🇳🇱": { name: "荷兰", key: "nl" },
    "🇫🇷": { name: "法国", key: "fr" },
    "🇦🇺": { name: "澳大利亚", key: "au" },
    "🇨🇦": { name: "加拿大", key: "ca" },
    "🇮🇳": { name: "印度", key: "in" },
    "🇷🇺": { name: "俄罗斯", key: "ru" },
    "🇫🇮": { name: "芬兰", key: "fi" },
    "🇵🇱": { name: "波兰", key: "pl" },
    "🇻🇳": { name: "越南", key: "vn" },
    "🇹🇭": { name: "泰国", key: "th" },
    "🇧🇷": { name: "巴西", key: "br" },
    "🇨🇴": { name: "哥伦比亚", key: "co" },
    "🇮🇸": { name: "冰岛", key: "is" },
    "🇪🇸": { name: "西班牙", key: "es" },
    "🇮🇹": { name: "意大利", key: "it" },
    "🇳🇴": { name: "挪威", key: "no" },
    "🇿🇦": { name: "南非", key: "za" },
    "🇲🇽": { name: "墨西哥", key: "mx" },
    "🇮🇩": { name: "印尼", key: "id" },
    "🇹🇷": { name: "土耳其", key: "tr" },
    "🇦🇪": { name: "阿联酋", key: "ae" },
    "🇸🇦": { name: "沙特", key: "sa" },
    "🇰🇼": { name: "科威特", key: "kw" },
    "🇶🇦": { name: "卡塔尔", key: "qa" },
    "🇧🇭": { name: "巴林", key: "bh" },
    "🇴🇲": { name: "阿曼", key: "om" },
    "🇮🇱": { name: "以色列", key: "il" },
    "🇵🇭": { name: "菲律宾", key: "ph" },
    "🇲🇾": { name: "马来西亚", key: "my" },
    "🇦🇷": { name: "阿根廷", key: "ar" },
    "🇨🇱": { name: "智利", key: "cl" },
    "🇵🇪": { name: "秘鲁", key: "pe" },
    "🇻🇪": { name: "委内瑞拉", key: "ve" },
    "🇪🇨": { name: "厄瓜多尔", key: "ec" },
    "🇺🇾": { name: "乌拉圭", key: "uy" },
    "🇧🇴": { name: "玻利维亚", key: "bo" },
    "🇵🇦": { name: "巴拿马", key: "pa" },
    "🇨🇷": { name: "哥斯达黎加", key: "cr" },
    "🇬🇹": { name: "危地马拉", key: "gt" },
    "🇩🇴": { name: "多米尼加", key: "do" },
    "🇯🇲": { name: "牙买加", key: "jm" },
    "🇹🇹": { name: "特立尼达", key: "tt" },
    "🇷🇪": { name: "留尼汪", key: "re" },
    "🇲🇶": { name: "马提尼克", key: "mq" },
    "🇬🇵": { name: "瓜德罗普", key: "gp" },
    "🇧🇧": { name: "巴巴多斯", key: "bb" },
    "🇧🇿": { name: "伯利兹", key: "bz" },
    "🇸🇻": { name: "萨尔瓦多", key: "sv" },
    "🇭🇳": { name: "洪都拉斯", key: "hn" },
    "🇳🇮": { name: "尼加拉瓜", key: "ni" },
    "🇵🇷": { name: "波多黎各", key: "pr" },
    "🇻🇬": { name: "英属维尔京", key: "vg" },
    "🇰🇾": { name: "开曼", key: "ky" },
    "🇧🇲": { name: "百慕大", key: "bm" },
    "🇦🇬": { name: "安提瓜", key: "ag" },
    "🇩🇲": { name: "多米尼克", key: "dm" },
    "🇸🇨": { name: "塞舌尔", key: "sc" },
    "🇲🇬": { name: "马达加斯加", key: "mg" },
    "🇲🇺": { name: "毛里求斯", key: "mu" },
    "🇳🇬": { name: "尼日利亚", key: "ng" },
    "🇰🇪": { name: "肯尼亚", key: "ke" },
    "🇿🇲": { name: "赞比亚", key: "zm" },
    "🇲🇿": { name: "莫桑比克", key: "mz" },
    "🇪🇹": { name: "埃塞俄比亚", key: "et" },
    "🇬🇭": { name: "加纳", key: "gh" },
    "🇹🇿": { name: "坦桑尼亚", key: "tz" },
    "🇺🇬": { name: "乌干达", key: "ug" },
    "🇨🇲": { name: "喀麦隆", key: "cm" },
    "🇸🇳": { name: "塞内加尔", key: "sn" },
    "🇨🇮": { name: "科特迪瓦", key: "ci" },
    "🇧🇫": { name: "布基纳法索", key: "bf" },
    "🇲🇱": { name: "马里", key: "ml" },
    "🇳🇪": { name: "尼日尔", key: "ne" },
    "🇹🇩": { name: "乍得", key: "td" },
    "🇨🇩": { name: "刚果金", key: "cd" },
    "🇨🇬": { name: "刚果布", key: "cg" },
    "🇩🇿": { name: "阿尔及利亚", key: "dz" },
    "🇹🇳": { name: "突尼斯", key: "tn" },
    "🇲🇦": { name: "摩洛哥", key: "ma" },
    "🇱🇾": { name: "利比亚", key: "ly" },
    "🇸🇩": { name: "苏丹", key: "sd" },
    "🇪🇬": { name: "埃及", key: "eg" },
    "🇯🇴": { name: "约旦", key: "jo" },
    "🇱🇧": { name: "黎巴嫩", key: "lb" },
    "🇸🇾": { name: "叙利亚", key: "sy" },
    "🇮🇶": { name: "伊拉克", key: "iq" },
    "🇮🇷": { name: "伊朗", key: "ir" },
    "🇦🇫": { name: "阿富汗", key: "af" },
    "🇵🇰": { name: "巴基斯坦", key: "pk" },
    "🇧🇩": { name: "孟加拉", key: "bd" },
    "🇳🇵": { name: "尼泊尔", key: "np" },
    "🇱🇰": { name: "斯里兰卡", key: "lk" },
    "🇲🇻": { name: "马尔代夫", key: "mv" },
    "🇧🇹": { name: "不丹", key: "bt" },
    "🇲🇳": { name: "蒙古", key: "mn" },
    "🇰🇿": { name: "哈萨克斯坦", key: "kz" },
    "🇺🇿": { name: "乌兹别克斯坦", key: "uz" },
    "🇹🇲": { name: "土库曼斯坦", key: "tm" },
    "🇰🇬": { name: "吉尔吉斯斯坦", key: "kg" },
    "🇹🇯": { name: "塔吉克斯坦", key: "tj" },
    "🇦🇲": { name: "亚美尼亚", key: "am" },
    "🇦🇿": { name: "阿塞拜疆", key: "az" },
    "🇬🇪": { name: "格鲁吉亚", key: "ge" },
    "🇺🇦": { name: "乌克兰", key: "ua" },
    "🇧🇾": { name: "白俄罗斯", key: "by" },
    "🇲🇩": { name: "摩尔多瓦", key: "md" },
    "🇷🇴": { name: "罗马尼亚", key: "ro" },
    "🇭🇺": { name: "匈牙利", key: "hu" },
    "🇨🇿": { name: "捷克", key: "cz" },
    "🇸🇰": { name: "斯洛伐克", key: "sk" },
    "🇸🇮": { name: "斯洛文尼亚", key: "si" },
    "🇭🇷": { name: "克罗地亚", key: "hr" },
    "🇷🇸": { name: "塞尔维亚", key: "rs" },
    "🇧🇦": { name: "波黑", key: "ba" },
    "🇲🇪": { name: "黑山", key: "me" },
    "🇦🇱": { name: "阿尔巴尼亚", key: "al" },
    "🇲🇰": { name: "北马其顿", key: "mk" },
    "🇧🇬": { name: "保加利亚", key: "bg" },
    "🇬🇷": { name: "希腊", key: "gr" },
    "🇨🇾": { name: "塞浦路斯", key: "cy" },
    "🇲🇹": { name: "马耳他", key: "mt" },
    "🇱🇮": { name: "列支敦士登", key: "li" },
    "🇨🇭": { name: "瑞士", key: "ch" },
    "🇦🇹": { name: "奥地利", key: "at" },
    "🇧🇪": { name: "比利时", key: "be" },
    "🇱🇺": { name: "卢森堡", key: "lu" },
    "🇮🇪": { name: "爱尔兰", key: "ie" },
    "🇩🇰": { name: "丹麦", key: "dk" },
    "🇸🇪": { name: "瑞典", key: "se" },
    "🇫🇮": { name: "芬兰", key: "fi" },
    "🇪🇪": { name: "爱沙尼亚", key: "ee" },
    "🇱🇻": { name: "拉脱维亚", key: "lv" },
    "🇱🇹": { name: "立陶宛", key: "lt" },
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
    const match = proxy.name.match(/(\d+)\s*MB\/s/i);
    if (match) {
      const speed = parseInt(match[1]);
      const tier = `${speed}MB/s`;
      if (!bandwidthGroups[tier]) {
        bandwidthGroups[tier] = [];
      }
      bandwidthGroups[tier].push(proxy.name);
    }
  }

  const availableTiers = Object.keys(bandwidthGroups).sort((a, b) => parseInt(b) - parseInt(a));

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
