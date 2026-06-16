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

### 分组架构（v4.26）

**协议级 fallback + url-test + select 三段式**

- **协议分类**：遍历所有代理节点的 `type` 字段，通过 `switch/case` 分配到对应桶：
  - `hysteria2` / `hy2` → Hysteria2
  - `tuic` → TUIC
  - `masque` → Masque
  - `anytls` → AnyTLS
  - `vless` → VLESS **（有 `reality-opts` / `network: xhttp` 任一即可，不再接受仅 `encryption` 的节点）**
  - `wireguard` → WireGuard **（全部）**
  - `mieru` → Mieru **（全部）**
    - 其余（vmess / shadowsocks / trojan / hysteria / socks5 / http / direct）不归入任何分组，**直接丢弃，不会出现在输出中**

- **协议组**（Hysteria2 / TUIC / Masque / AnyTLS / VLESS / WireGuard / Mieru）：每个协议生成三个分组：
  - `{name}-自动回退`（fallback, hidden）— 按顺序选第一个可用节点，稳定优先
  - `{name}-自动选择`（url-test, hidden）— 测速选最低延迟，速度优先
  - `{name}`（select）— 手动选择，默认指向 `{name}-自动回退`

- **节点过滤**：`config.proxies` 在输出時只保留被归类的节点，未匹配的杂鱼节点被彻底删除。`GLOBAL` 組不再使用 `include-all`，避免意外引入未归类节点。

### 自动选择（url-test）与自动回退（fallback）

**url-test（自动选择）**：参考 [AIsouler/MyClash](https://github.com/AIsouler/MyClash) 的 url-test 参数改良，速度优先：

```js
const urlTestBaseOption = {
  type: "url-test",
  url: "https://www.gstatic.com/generate_204",
  interval: 300,       // 每 300 秒测速一次
    timeout: 3000,       // 单次连 3 秒超时
    tolerance: 10,       // 延迟容差 10ms
    lazy: false,         // 主动测速——每 300 秒定期测速，无需流量触发
  "max-failed-times": 3, // 连续失败 3 次切换
  hidden: true,        // 隐藏，不在面板显示
}
```

**fallback（自动回退）**：按顺序检测，选第一个可用节点，稳定性优先，作为默认策略：

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

两种策略并存，用户可通过 select 组手动切换。

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

### 规则集

从 Loyalsoldier/clash-rules 加载（同 v4.12），默认结转 `MATCH,漏网之鱼`。

## 注意

1. 每次更改都需要版本更新：根据本次修改的大小，修改顶部 `// vX.Y` 注释
2. 中文代理组名和注释不翻译保留
3. **禁止添加 module.exports** - 某些客户端不支持，会报错
4. 每次修改后，检查 `README.md` 是否需要同步更新
