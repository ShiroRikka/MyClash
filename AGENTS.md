# AGENTS.md - Mihomo（Clash Meta）脚本

## 快速开始

```bash
npm install
```

脚本是**函数模块**，非独立可执行文件。调用方式：`main(config)` 传入 Clash YAML 配置对象，返回增强后的配置对象。

## 本地测试

测试文件命名 `Proxies.yaml`，包含 `proxies` 数组（每个节点需有 `type` 和 `name` 字段）：

```bash
node -e "const yaml=require('js-yaml'),fs=require('fs'); const c=yaml.load(fs.readFileSync('Proxies.yaml','utf8')); console.log(yaml.dump(require('./ShiroRikka.js').main(c)))" > processed_config.yaml
```

注意：脚本无 `module.exports`，某些客户端不支持。如需测试，需临时添加：

```js
module.exports = { main };
// 测试后删除
```

## 代码风格

- 注释使用中文
- 2 空格缩进，无分号
- 模板字符串(反引号)，对象键无引号
- CDN 常量使用大写

## 核心实现

### 分组架构（v4.29）

**负载均衡 + fallback + select 三段式（load-balance 取代全局 fallback）**

- **协议分类**：遍历所有代理节点的 `type` 字段，通过 `switch/case` 分配到对应桶：
  - `hysteria2` / `hy2` → Hysteria2
  - `tuic` → TUIC
  - `masque` → Masque
  - `anytls` → AnyTLS
  - `vless` → VLESS **（有 `reality-opts` / `network: xhttp` 任一即可，不再接受仅 encryption）**
  - `wireguard` → WireGuard **（全部）**
  - `mieru` → Mieru **（全部）**
    - 其余（vmess / shadowsocks / trojan / hysteria / socks5 / http / direct）不归入任何分组，**直接丢弃，不会出现在输出中**

- **协议组**（Hysteria2 / TUIC / Masque / AnyTLS / VLESS / WireGuard / Mieru）：每个协议生成 `{name}-自动回退`（fallback, hidden）+ `{name}`（select）两个分组。select 组默认选中 `{name}-自动回退`。
  - `{name}-自动回退`（fallback, hidden）— 按顺序选第一个可用节点，稳定优先
  - `{name}`（select）— 手动选择，默认指向 `{name}-自动回退`

- **全局负载均衡**：新增 `负载均衡`（load-balance, hidden）在协议组间均衡分配流量，采用 round-robin 策略。
  - 取代原有的全局 `自动回退`（fallback），`节点选择` 默认选中 `负载均衡`

- **节点过滤**：`config.proxies` 在输出時只保留被归类的节点，未匹配的杂鱼节点被彻底删除。`GLOBAL` 組不再使用 `include-all`，避免意外引入未归类节点。

### 自动回退（fallback）

**fallback（自动回退）**：按顺序检测，选第一个可用节点，稳定性优先，作为唯一策略：

```js
const fallbackBaseOption = {
  type: "fallback",
  url: "https://www.gstatic.com/generate_204",
  interval: 300,       // 每 300 秒检测一次
    timeout: 3000,       // 单次连 3 秒超时
    lazy: false,         // 主动检测
  "max-failed-times": 3, // 连续失败 3 次切换
  hidden: true,        // 隐藏，不在面板显示
}
```

- **协议组内部**：每个协议组有 `{name}-自动回退`（fallback）在组内节点间按顺序回退
- **全局层面**：新增 `负载均衡`（load-balance，hidden）在协议组间轮询分发流量，作为 `节点选择` 的默认选中项
  - 策略：`round-robin` — 将请求轮询分发到不同协议组
  - 可选策略：`consistent-hashing`（相同目标地址→同一协议组）、`sticky-sessions`（相同来源+目标地址→同一协议组，缓存 10 分钟）

### 空分组容错

如果某协议无匹配节点，该分组**不创建**，上层选择器自动排除。例如：

- 无 hysteria2/hy2 节点 → Hysteria2 分组不存在
- 无 tuic 节点 → TUIC 分组不存在
- 无 masque 节点 → Masque 分组不存在
- 无 wireguard 节点 → WireGuard 分组不存在
- 无 mieru 节点 → Mieru 分组不存在

通过 `proxyGroups.some(g => g.name === name)` 动态检测。

### DNS 与 Hosts

保持 v4.12 原样：
- fake-ip 模式，ARC 缓存
- 国内 DNS（alidns、doh.pub）走 DIRECT
- 国外 DNS（Cloudflare、Google）走 节点选择
- hosts 映射：阿里 DNS、Google DNS、B站 PCDN 屏蔽

### 规则集（v4.30）

使用 Loyalsoldier/v2ray-rules-dat 的 geosite.dat/geoip.dat，通过 GEOSITE/GEOIP 内置规则直接引用，无需 RULE-SET 和 rule-providers。

**白名单模式规则顺序**（注意：`@cn` 规则必须在 `geolocation-!cn` 之前）：

```yaml
# 广告拦截
- GEOSITE,category-ads-all,REJECT
# 私有域名直连
- GEOSITE,private,DIRECT
# Apple 可直连域名（Loyalsoldier 特有，apple-cn）
- GEOSITE,apple-cn,DIRECT
# Google 可直连域名（Loyalsoldier 特有，google-cn）
- GEOSITE,google-cn,DIRECT
# 国区游戏直连 @cn（Steam 等国内 CDN）
- GEOSITE,category-games@cn,DIRECT
# 国内 TLD 直连
- GEOSITE,tld-cn,DIRECT
# 国外域名走代理（含 GFW、Google、Telegram 等）
- GEOSITE,geolocation-!cn,节点选择
# 国内域名直连（Loyalsoldier 增强版 cn）
- GEOSITE,cn,DIRECT
# IP 规则
- GEOIP,private,DIRECT,no-resolve
- GEOIP,cn,DIRECT,no-resolve
- GEOIP,telegram,节点选择,no-resolve
# 兜底
- MATCH,漏网之鱼
```

- 去掉了 `gfw` / `google` / `telegram` 单独分组，统一由 `geolocation-!cn` 覆盖
- 兜底从 `MATCH,节点选择` 改为 `MATCH,漏网之鱼`，更灵活

**DNS 配置变化**：
- `fake-ip-filter` 改用 `geosite:connectivity-check` 覆盖所有平台连通性检测
- 移除 `nameserver-policy: {"*": "system"}`（原配置错误）
- `direct-nameserver` 改用 DoH（alidns / doh.pub）

## 注意

1. 每次更改都需要版本更新：根据本次修改的大小，修改顶部 `// vX.Y` 注释
2. 中文代理组名和注释不翻译保留
3. **禁止添加 module.exports** - 某些客户端不支持，会报错
4. 每次修改后，检查 `README.md` 是否需要同步更新
