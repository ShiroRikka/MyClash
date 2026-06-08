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

### 分组架构（v4.13）

**分三级：S级 → A级 → 兜底**

- **协议分类**：遍历所有代理节点的 `type` 字段，通过 `switch/case` 分配到对应桶：
  - `hysteria2` / `hy2` → Hysteria2（S级）
  - `tuic` → TUIC（S级）
  - `trojan` → Trojan（A级）
  - `vless` → VLESS（A级）
  - 其余（vmess / shadowsocks / hysteria / socks5 / http / direct）→ AnyTLS（兜底）

- **等级组**（S级 / A级 / 兜底）：`type: "select"`，用户手动在子分组之间切换
- **协议组**（Hysteria2 / TUIC / Trojan / VLESS / AnyTLS）：`type: "fallback"`，自动回退策略

### 自动回退策略

参考 [AIsouler/MyClash](https://github.com/AIsouler/MyClash) 的 url-test 参数改良：

```js
const fallbackBaseOption = {
  type: "fallback",
  url: "https://www.gstatic.com/generate_204",
  interval: 600,       // 每 600 秒测速一次
  timeout: 3000,       // 单次连 3 秒超时
  lazy: false,         // 主动测速——每 600 秒定期测速，无需流量触发
  "max-failed-times": 3, // 连续失败 3 次切换
}
```

### 空分组容错

如果某协议无匹配节点，该分组**不创建**，上层选择器自动排除。例如：

- 无 hysteria2/hy2 节点 → Hysteria2 分组不存在
- 无 tuic 节点 → TUIC 分组不存在
- 两者皆无 → S级整个不创建

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
