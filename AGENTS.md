# AGENTS.md

## ⚠️ 关键约束

- **禁止添加 `module.exports`** — 某些客户端不支持，会导致运行时错误。测试时临时添加，测试后立即删除。
- **不得引入任何其他 npm 包** — `js-yaml` 仅用于本地测试，不写入脚本。
- **`*.yaml` 被 gitignore** — 测试文件（如 `Proxies.yaml`）不会意外提交。`package-lock.json` 同样被忽略（`.gitignore:6`），`npm install` 不会产生版本化变更。

## 本地测试

创建 `Proxies.yaml`（需含 `proxies` 数组，每节点有 `type`、`name`）：
```bash
npm install
node -e "const yaml=require('js-yaml'),fs=require('fs'); const c=yaml.load(fs.readFileSync('Proxies.yaml','utf8')); console.log(yaml.dump(require('./ShiroRikka.js').main(c)))" > processed_config.yaml
```
测试前需临时添加 `module.exports = { main }`，测试后删除。添加新协议图标时同步放入 `icons/` 目录。`npm test` 是空桩，无测试框架。

## 代码风格

- 注释使用中文；2 空格缩进；无分号
- 模板字符串（反引号），对象键无引号
- CDN 常量使用大写（`CDN`, `CDN_FLAGS` 等）
- 顶部 `// vX.Y` 版本号随修改大小递增，每次必改

## 架构要点（代码中不易直接看出）

- **VLESS 筛选**：仅保留 `network === "xhttp"` 或含 `reality-opts` 的节点（`ShiroRikka.js:54`），不再接受仅 `encryption`。
- **未匹配节点丢弃**：switch/case 不匹配的协议类型（vmess/shadowsocks/trojan/hysteria/socks5/http/direct 等）从 `config.proxies` 彻底删除（`ShiroRikka.js:72`）。
- **空分组跳过**：某协议无节点时，该协议组及其 fallback 子组均不创建。`负载均衡` 的 `proxies` 和 `节点选择` 的选项列表自动适配。
- **规则使用 GEOSITE/GEOIP 内置**，不需要 `rule-providers` 配置块。
- **输出始终包含**：DNS（fake-ip + ARC）、Hosts（国内/国外 DNS 固定 IP + B 站 PCDN 屏蔽）、Sniffer（TLS/QUIC/HTTP 嗅探）、规则（白名单模式 7 条）。

## 每次修改后

1. 检查 `README.md` 是否需同步更新
2. 更新版本号注释 `// vX.Y`
3. 确认无 `module.exports` 残留