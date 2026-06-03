# Mihomo (Clash Meta) 代理组生成脚本

按代理协议类型自动分类，生成简洁的 S级 / A级 / 兜底 三级代理组配置。

**当前版本：v4.13**

## 快速开始

### 在 Clash Verge 中使用

1. 打开 Clash Verge → 设置 → 拓展脚本
2. 添加新脚本，粘贴 `ShiroRikka.js` 的代码
3. 重启 Clash

### 在其他客户端中使用

将脚本 URL 添加到配置文件：

[脚本地址](https://raw.githubusercontent.com/ShiroRikka/MyClash/main/ShiroRikka.js)

## 分组架构

```
GLOBAL (select)
 └─ 节点选择 (select)
     ├─ S级 (select)               ← 高性能协议
     │   ├─ Hysteria2 (fallback)    ← Hysteria2 / hy2 节点，自动回退
     │   └─ TUIC (fallback)         ← TUIC 节点，自动回退
     ├─ A级 (select)               ← 稳定协议
     │   ├─ Trojan (fallback)       ← Trojan 节点，自动回退
     │   └─ VLESS (fallback)        ← VLESS 节点，自动回退
     └─ 兜底 (select)              ← 其余协议
         └─ AnyTLS (fallback)       ← VMess / Shadowsocks / Hysteria 等，自动回退
 └─ 漏网之鱼 (select) → 节点选择 / DIRECT
 └─ 广告拦截 / 应用净化 (select) → REJECT / DIRECT
```

### 分组说明

| 分组 | 类型 | 说明 |
|------|------|------|
| **S级** | `select` | 包含 Hysteria2 和 TUIC 子分组，用户手动切换或选择 AUTO |
| **A级** | `select` | 包含 Trojan 和 VLESS 子分组，用户手动切换或选择 AUTO |
| **兜底** | `select` | 包含 AnyTLS 子分组（其余协议），用户手动切换或选择 AUTO |
| **Hysteria2 / TUIC / Trojan / VLESS / AnyTLS** | `fallback` | 自动测速，选用延迟最低的可用节点，故障自动切换 |
| **广告拦截 / 应用净化** | `select` | 选择 REJECT 拦截或 DIRECT 放行 |
| **漏网之鱼** | `select` | 默认走节点选择，可手动切直连 |
| **GLOBAL** | `select` | 顶层主控，包含所有分组 |

### 自动回退策略

所有协议子分组均使用 Mihomo 的 `fallback` 类型，参数参考 [AIsouler/MyClash](https://github.com/AIsouler/MyClash)：

```yaml
type: fallback
url: https://www.gstatic.com/generate_204
interval: 600       # 每 10 分钟测速一次
timeout: 3000       # 单次测速 3 秒超时
lazy: true          # 有流量时触发测速
max-failed-times: 3 # 连续失败 3 次切换
```

## 分类规则

脚本读取每个代理节点的 `type` 字段，自动归类：

| 代理类型 `proxy.type` | 归入分组 | 所在等级 |
|----------------------|---------|---------|
| `hysteria2` / `hy2` | Hysteria2 | **S级** |
| `tuic` | TUIC | **S级** |
| `trojan` | Trojan | **A级** |
| `vless` | VLESS | **A级** |
| 其余（vmess / shadowsocks / hysteria / socks5 / http / direct 等） | AnyTLS | **兜底** |

> 不需要在节点名中添加特殊标记，脚本直接识别协议类型，自动搞定分类。

### 空分组容错

如果某个协议完全没有对应节点，该分组不会创建，上层选择器也会自动调整。例如无 Hysteria2 和 TUIC 节点时，S级及其子分组不会出现在配置中。

## 规则说明

脚本自动生成 Loyalsoldier 规则集订阅，并应用以下路由规则：

```
applications → DIRECT
private → DIRECT
reject → REJECT
icloud → DIRECT
apple → DIRECT
google → 节点选择
proxy → 节点选择
direct → DIRECT
lancidr → DIRECT
cncidr → DIRECT
telegramcidr → 节点选择
GEOIP,LAN → DIRECT
GEOIP,CN → DIRECT
MATCH → 漏网之鱼
```

> 最后一跳 `MATCH` 路由到 **漏网之鱼**，用户可在 GUI 中切换走代理或直连。

## DNS 配置

脚本自动生成以下 DNS 配置：

- **fake-ip 模式**，缓存算法为 ARC
- **国内 DNS**：阿里 DNS (`dns.alidns.com`)、腾讯 DNS (`doh.pub`) — 走 DIRECT
- **国外 DNS**：Cloudflare (`dns.cloudflare.com`)、Google (`dns.google`) — 走 节点选择
- **Hosts 映射**：加速 DNS 解析，屏蔽 B 站 PCDN
- **IPv6 支持**：默认开启

## 本地测试

```bash
npm install
```

准备测试配置 `Proxies.yaml`，包含 `proxies` 数组（每个节点需含 `type` 和 `name`）：

```yaml
proxies:
  - name: "🇭🇰 HK Hysteria2"
    type: hysteria2
    server: example.com
    port: 443
    # ...
  - name: "🇯🇵 JP Trojan"
    type: trojan
    server: example.jp
    port: 443
    # ...
```

运行：

```bash
node -e "const yaml=require('js-yaml'),fs=require('fs'); const c=yaml.load(fs.readFileSync('Proxies.yaml','utf8')); console.log(yaml.dump(require('./ShiroRikka.js').main(c)))" > processed_config.yaml
```

## 项目结构

```
MyClash/
├── ShiroRikka.js       # 主脚本 (v4.13) — 按协议类型生成代理组
├── AGENTS.md           # 开发规范与注意事项
├── README.md           # 本文档
└── package.json        # 项目依赖
```

## License

GPL-3.0
