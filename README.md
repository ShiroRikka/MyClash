# Mihomo (Clash Meta) 代理组生成脚本

按代理协议类型自动分类，生成协议级 select 分组（含自动回退）。  
**当前版本：v4.30**

---

## 快速开始

### 在 Clash Verge / Mihomo Party 中使用

1. 打开设置 → **拓展脚本** / **Script**
2. 粘贴 `ShiroRikka.js` 的完整代码
3. 重启应用，拉取覆写生效

### 在其他客户端中使用

将脚本 URL 添加到 `mihomo.yaml`：

```yaml
script:
  code:
    !import https://raw.githubusercontent.com/ShiroRikka/MyClash/main/ShiroRikka.js
```

---

## 分组架构

```
GLOBAL (select)
│
├─ 节点选择 (select)                  ← 主入口，含 DIRECT
│   ├─ 负载均衡 (load-balance, hidden)     ← 全局负载均衡（协议组间 round-robin）
│   │   ├─ Hysteria2 (select)         ← 默认=自动回退
│   │   ├─ TUIC (select)              ← 同上
│   │   ├─ Masque (select)            ← 同上
│   │   ├─ AnyTLS (select)            ← 同上
│   │   ├─ VLESS (select)             ← 同上
│   │   └─ …其他协议组…
│   ├─ Hysteria2 (select)             ← 手动选协议组
│   │   ├─ Hysteria2-自动回退 (fallback, hidden)
│   │   └─ [该协议所有节点]
│   ├─ TUIC (select)                  ← 同上
│   ├─ Masque (select)                ← 同上
│   ├─ AnyTLS (select)                ← 同上
│   ├─ VLESS (select)                 ← 同上
│   ├─ …其他协议组…
│   └─ DIRECT
│
├─ 漏网之鱼 (select)                  → 节点选择 / DIRECT
├─ 广告拦截 (select)                  → REJECT / DIRECT
└─ 应用净化 (select)                  → REJECT / DIRECT
```

### 分组说明

| 分组 | 类型 | 说明 |
|------|------|------|
| **节点选择** | `select` | 主入口，包含负载均衡 + 各协议组 + DIRECT |
| **负载均衡** | `load-balance` (hidden) | 在协议组间 round-robin 轮询分发流量 |
| **Hysteria2 / TUIC / Masque / AnyTLS / VLESS** | `select` | 单协议组，默认=自动回退，含自动回退 + 所有节点 |
| **{name}-自动回退** | `fallback` (hidden) | 按顺序选第一个可用节点，稳定优先（默认策略） |
| **广告拦截 / 应用净化** | `select` | 选择 REJECT 拦截或 DIRECT 放行 |
| **漏网之鱼** | `select` | 默认走节点选择，可手动切直连 |
| **GLOBAL** | `select` | 顶层主控，包含所有分组 |

### 自动策略参数

每个协议组生成一个隐藏的自动回退策略组（fallback），默认选中：

**自动回退 (fallback, hidden) — 协议组内默认策略：**
```yaml
type: fallback
url: https://www.gstatic.com/generate_204
interval: 300
timeout: 3000
lazy: false
max-failed-times: 3
hidden: true
```

**负载均衡 (load-balance, hidden) — 全局默认策略（协议组间 round-robin）：**
```yaml
type: load-balance
url: https://www.gstatic.com/generate_204
interval: 300
timeout: 3000
lazy: false
strategy: round-robin
hidden: true
```

支持的其他负载均衡策略：
- `consistent-hashing` — 相同目标地址始终分配到同一协议组
- `sticky-sessions` — 相同来源地址+目标地址分配到同一协议组，缓存 10 分钟

---

## 分类规则

脚本读取每个代理节点的 `type` 字段，自动归类：

| 代理类型 `proxy.type` | 归入分组 |  筛选条件  |
|----------------------|---------|-----------|
| `hysteria2` / `hy2` | Hysteria2 | 全部 |
| `tuic` | TUIC | 全部 |
| `masque` | Masque | 全部 |
| `anytls` | AnyTLS | 全部 |
| `vless` | VLESS | **有 `reality-opts` / `network: xhttp` 任一即可**（去掉 `encryption` 条件） |
| `wireguard` | WireGuard | 全部 |
| `mieru` | Mieru | 全部 |
| 其余（vmess / shadowsocks / trojan / hysteria / socks5 / http 等） | 不归入任何分组 | — |

> 不需要在节点名中添加特殊标记，脚本直接从 `proxy.type` 识别协议类型。

### 空分组容错

如果某个协议没有节点，该协议组及其隐藏策略组不会创建，`节点选择` 的选项列表也会自动调整。

---

## 路由规则

脚本使用 **Loyalsoldier/v2ray-rules-dat** 的 geosite.dat/geoip.dat，通过 GEOSITE/GEOIP 内置规则直接引用（无需 RULE-SET 和 rule-providers）：

```yaml
# 广告拦截（最优先）
GEOSITE,category-ads-all,REJECT

# 私有域名直连
GEOSITE,private,DIRECT

# Apple 可直连域名（Loyalsoldier 特有）
GEOSITE,apple-cn,DIRECT

# Google 可直连域名（Loyalsoldier 特有）
GEOSITE,google-cn,DIRECT

# 国区游戏直连 @cn（Steam 等国内 CDN）
GEOSITE,category-games@cn,DIRECT

# 国内 TLD 直连
GEOSITE,tld-cn,DIRECT

# 国外域名走代理（含 GFW、Google、Telegram 等）
GEOSITE,geolocation-!cn,节点选择

# 国内域名直连（Loyalsoldier 增强版 cn）
GEOSITE,cn,DIRECT

# IP 规则
GEOIP,private,DIRECT,no-resolve
GEOIP,cn,DIRECT,no-resolve
GEOIP,telegram,节点选择,no-resolve

# 兜底 → 漏网之鱼（用户可在面板切换走代理或直连）
MATCH,漏网之鱼
```

### 规则说明

| 规则 | 类型 | 用途 | 来源 |
|------|------|------|------|
| `category-ads-all` | geosite | 广告/追踪域名（含 EasyList + AdGuard + Peter Lowe 等多源合并） | Loyalsoldier 增强 |
| `private` | geosite | 内网/私有域名 | 上游 v2fly |
| `apple-cn` | geosite | Apple 国内可直连域名 | Loyalsoldier 特有 |
| `google-cn` | geosite | Google 国内可直连域名 | Loyalsoldier 特有 |
| `category-games@cn` | geosite | 国区游戏 CDN 直连（Steam/EA/Blizzard 等） | 上游 v2fly + `@cn` 属性 |
| `tld-cn` | geosite | `.cn` 等中国 TLD 域名 | 上游 v2fly |
| `geolocation-!cn` | geosite | 非中国域名（含 GFW/Google/Telegram 等） | 上游 v2fly |
| `cn` | geosite | 国内域名（Loyalsoldier 增强版，含 dnsmasq-china-list） | Loyalsoldier 增强 |
| `geoip:private` | geoip | 内网 IP 段 | 上游 |
| `geoip:cn` | geoip | 中国 IP 段（IPv4: china-operator-ip, IPv6: china-operator-ip） | Loyalsoldier 增强 |
| `geoip:telegram` | geoip | Telegram IP 段 | Loyalsoldier 增强 |

> 数据源：`https://cdn.jsdelivr.net/gh/Loyalsoldier/v2ray-rules-dat@release/geosite.dat`
> 自动构建：GitHub Actions 每天北京时间 06:00 更新

---

## DNS 配置

```yaml
dns:
  enable: true
  ipv6: true
  listen: :1053
  cache-algorithm: arc
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  fake-ip-range-v6: fc00::/18
  fake-ip-filter:
    - "geosite:connectivity-check"  # 覆盖所有平台连通性检测（Windows/Android/Apple/KDE 等）
    - "geosite:private"             # 私有域名放行

  # 代理服务器 DNS（走 DIRECT 避免死循环）
  proxy-server-nameserver:
    - https://dns.alidns.com/dns-query#DIRECT
    - https://doh.pub/dns-query#DIRECT

  default-nameserver: [223.5.5.5, 119.29.29.29]

  # 普通域名 DNS（走代理避免 DNS 污染）
  nameserver:
    - https://dns.cloudflare.com/dns-query#节点选择
    - https://dns.google/dns-query#节点选择

  # 直连流量 DNS（使用纯净 DoH，减少劫持）
  direct-nameserver:
    - https://dns.alidns.com/dns-query#DIRECT
    - https://doh.pub/dns-query#DIRECT
```

### Hosts 映射

```yaml
hosts:
  "dns.alidns.com": [223.5.5.5, 223.6.6.6]      # 固定阿里 DNS IP
  "doh.pub": [1.12.12.12, 120.53.53.53]           # 固定腾讯 DNS IP
  "dns.cloudflare.com": [1.1.1.1, 1.0.0.1]       # 固定 Cloudflare DNS IP
  "dns.google": [8.8.8.8, 8.8.4.4]               # 固定 Google DNS IP
  "services.googleapis.cn": ["services.googleapis.com"]  # Google 服务正确解析
  "+.mcdn.bilivideo.com": [0.0.0.0]               # 屏蔽 B 站 PCDN
  "+.mcdn.bilivideo.cn": [0.0.0.0]                # 屏蔽 B 站 PCDN
```

---

## 本地测试

```bash
npm install
```

准备测试配置 `Proxies.yaml`（需含 `proxies` 数组，每个节点需 `type` 和 `name` 字段）：

```yaml
proxies:
  - name: "🇭🇰 HK Hysteria2"
    type: hysteria2
    server: example.com
    port: 443
  - name: "🇯🇵 JP Masque"
    type: masque
    server: example.jp
    port: 443
```

运行：

```bash
node -e "
  const yaml = require('js-yaml'), fs = require('fs');
  const c = yaml.load(fs.readFileSync('Proxies.yaml', 'utf8'));
  console.log(yaml.dump(require('./ShiroRikka.js').main(c)))
" > processed_config.yaml
```

---

## 项目结构

```
MyClash/
├── ShiroRikka.js    # 主脚本 (v4.30) — GEOSITE/GEOIP 内置规则 + Loyalsoldier 数据源
├── README.md        # 本文档
├── AGENTS.md        # 开发规范与注意事项
└── package.json     # 项目依赖
```

---

## License

GPL-3.0
