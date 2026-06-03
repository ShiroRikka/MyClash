# Mihomo (Clash Meta) 代理组生成脚本

按代理协议类型自动分类，生成协议级 select 分组（含自动回退/自动选择）。  
**当前版本：v4.15**

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
GLOBAL (select, include-all)
│
├─ 节点选择 (select)                  ← 主入口，含 DIRECT
│   ├─ 自动选择 (url-test, hidden)
│   │   ├─ Hysteria2 (select)
│   │   ├─ TUIC (select)
│   │   ├─ Trojan (select)
│   │   ├─ VLESS (select)
│   │   └─ AnyTLS (select)
│   ├─ Hysteria2 (select)
│   │   ├─ Hysteria2-自动选择 (url-test, hidden)  ← 选最低延迟
│   │   └─ Hysteria2协议的所有节点
│   ├─ TUIC (select)                 ← 同上结构
│   ├─ Trojan (select)               ← 同上
│   ├─ VLESS (select)                ← 同上
│   ├─ AnyTLS (select)               ← 同上
│   └─ DIRECT
│
├─ 漏网之鱼 (select)                  → 节点选择 / DIRECT
├─ 广告拦截 (select)                  → REJECT / DIRECT
└─ 应用净化 (select)                  → REJECT / DIRECT
```

### 分组说明

| 分组 | 类型 | 说明 |
|------|------|------|
| **节点选择** | `select` | 主入口，包含全局自动选择 + 各协议组 + DIRECT |
| **自动选择** | `url-test` (hidden) | 在所有协议组间选最低延迟 |
| **Hysteria2 / TUIC / Trojan / VLESS / AnyTLS** | `select` | 单协议组，包含协议下所有节点 + 自动选择子策略 |
| **{name}-自动选择** | `url-test` (hidden) | 该协议下选延迟最低节点（容差 100ms） |
| **广告拦截 / 应用净化** | `select` | 选择 REJECT 拦截或 DIRECT 放行 |
| **漏网之鱼** | `select` | 默认走节点选择，可手动切直连 |
| **GLOBAL** | `select` | 顶层主控，包含所有分组 |

### 自动策略参数

所有协议组均生成一个隐藏的自动选择策略组：

**自动选择 (url-test, hidden)：**
```yaml
type: url-test
url: https://www.gstatic.com/generate_204
interval: 600
timeout: 3000
tolerance: 100      # 延迟容差 100ms
lazy: true
max-failed-times: 3
hidden: true
```

---

## 分类规则

脚本读取每个代理节点的 `type` 字段，自动归类：

| 代理类型 `proxy.type` | 归入分组 |
|----------------------|---------|
| `hysteria2` / `hy2` | Hysteria2 |
| `tuic` | TUIC |
| `trojan` | Trojan |
| `vless` | VLESS |
| `anytls` | AnyTLS |
| 其余（vmess / shadowsocks / hysteria / socks5 / http 等） | 不归入任何分组 |

> 不需要在节点名中添加特殊标记，脚本直接从 `proxy.type` 识别协议类型。

### 空分组容错

如果某个协议没有节点，该协议组及其隐藏策略组不会创建，`节点选择` 的选项列表也会自动调整。

---

## 路由规则

脚本仅使用 **MetaCubeX 官方 `.mrs`** 规则源：

```yaml
# 广告拦截（最优先）
RULE-SET,category-ads-all,REJECT

# 内网域名直连
RULE-SET,private,DIRECT

# 国内域名直连
RULE-SET,cn,DIRECT

# 被墙域名走代理
RULE-SET,gfw,节点选择

# Google 走代理
RULE-SET,google,节点选择

# Telegram 走代理
RULE-SET,telegram,节点选择

# IP 规则
RULE-SET,geoip-private,DIRECT,no-resolve
RULE-SET,geoip-cn,DIRECT,no-resolve
RULE-SET,geoip-telegram,节点选择,no-resolve

# 兜底 → 节点选择（用户可在面板切换走代理或直连）
MATCH,节点选择
```

### 规则源说明

所有规则源来自 [MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat)，使用 `.mrs` 编译格式：

| 规则集 | 类型 | 用途 |
|--------|------|------|
| `category-ads-all` | geosite | 广告/追踪域名 |
| `private` | geosite | 内网/私有域名 |
| `cn` | geosite | 国内域名 |
| `gfw` | geosite | 被墙域名 |
| `google` | geosite | Google 服务 |
| `telegram` | geosite | Telegram |
| `geoip-private` | geoip | 内网 IP 段 |
| `geoip-cn` | geoip | 中国 IP 段 |
| `geoip-telegram` | geoip | Telegram IP 段 |

CDN: `https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/`

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
  fake-ip-filter: ["rule-set:private"]

  # 代理服务器 DNS（走 DIRECT 避免死循环）
  proxy-server-nameserver:
    - https://dns.alidns.com/dns-query#DIRECT
    - https://doh.pub/dns-query#DIRECT

  default-nameserver: [223.5.5.5, 119.29.29.29]

  # 普通域名 DNS（走代理避免 DNS 污染）
  nameserver:
    - https://dns.cloudflare.com/dns-query#节点选择
    - https://dns.google/dns-query#节点选择

  nameserver-policy:
    "*": system  # 未匹配走系统 DNS

  # 直连流量 DNS
  direct-nameserver: [system, 223.5.5.5, 119.29.29.29]
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
  - name: "🇯🇵 JP Trojan"
    type: trojan
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
├── ShiroRikka.js    # 主脚本 (v4.15) — 按协议类型生成代理组
├── README.md        # 本文档
├── AGENTS.md        # 开发规范与注意事项
└── package.json     # 项目依赖
```

---

## License

GPL-3.0
