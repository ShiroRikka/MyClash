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
测试前需临时添加 `module.exports = { main }`，测试后删除。添加新协议图标时同步放入 `icons/` 目录。`npm test` 运行 `test/main.test.js`（内存加载 + 回归用例，不写源文件）。

## 代码风格

- 注释使用中文；2 空格缩进；无分号
- 模板字符串（反引号），对象键无引号
- CDN 常量使用大写（`CDN`, `CDN_FLAGS` 等）
- 顶部 `// vX.Y` 版本号随修改大小递增，每次必改

## 架构要点（代码中不易直接看出）

- **VLESS 归类**：按 `type === "vless"` 直接归类，不再筛选 `reality-opts` 等字段。
- **未匹配节点丢弃**：switch/case 不匹配的协议类型（easytier / tailscale / openvpn / sudoku / trusttunnel / zerotier / direct / dns 等）从 `config.proxies` 彻底删除。文档收录但脚本未归类的类型属"有意丢弃"，不算 bug。
- **空分组跳过**：某协议无节点时，该协议组及其 fallback 子组均不创建。`负载均衡` 的 `proxies` 和 `节点选择` 的选项列表自动适配。
- **规则使用 GEOSITE/GEOIP 内置**，不需要 `rule-providers` 配置块。
- **输出始终包含**：DNS（fake-ip + ARC）、Hosts（国内/国外 DNS 固定 IP + B 站 PCDN 屏蔽）、Sniffer（TLS/QUIC/HTTP 嗅探）、规则（白名单模式 8 条）。

## ⚠️ 内核兼容性（Mihomo Meta v1.19.32 实测）

脚本的 `switch` 分支必须只保留**内核实际识别**的 `type`。保留内核不识别的别名，会让整个 YAML 配置被拒绝（`mihomo -t` 报 `unsupport proxy type`）。

- **不支持的协议整类**：`naiveproxy`（含 `naive` / `naïveproxy` 别名）。文档也未收录，脚本已在 v4.40 移除分组。
- **不支持的别名**：`hy2`（内核只认 `hysteria2`）、`shadowsocks`（内核只认 `ss`）、`sockss`（内核只认 `socks` / `socks5`）。已在 v4.41 移除。
- **非规范但接受的别名**：`socks5` 内核接受（虽然规范名是 `socks`）。
- **新增别名前必须先验证**：用 `mihomo -t` 单独测试该 `type` 是否被接受，不要把文档没写的别名都塞进 switch。

## 内核验证方法

```bash
# 路径：Clash Verge Rev 自带的内核（无需下载）
"C:\Program Files\Clash Verge\verge-mihomo.exe" -v     # 确认版本
"C:\Program Files\Clash Verge\verge-mihomo.exe" -t -d <dir> -f <file>
```

- ⚠️ **`-t` 的 exit code 不可信**：失败也返回 0，必须 grep stdout 里的 `test failed` / `unsupport proxy type` / `unset fields`。
- ⚠️ **单测 fixture 必须字段齐全**：缺字段会让 `-t` 报 `unset fields: X` 掩盖真正问题。各类型的必填字段见技能 `mihomo-config-audit` 的 `references/proxy-types.md`。
- **WireGuard / Masque 需要真实 PKCS#8 x25519 密钥**：Node.js `crypto.generateKeyPairSync("x25519")` 生成的密钥内核不认（格式不匹配），单测里跳过这两类即可，归类逻辑用内存断言覆盖。
- **完整配置必备四段**：`port` / `socks-port` / `proxies` / `rules: ["MATCH,DIRECT"]`，缺任何一段会让 `-t` 报出误导性错误（例如把不支持的 type 误判为"配置结构不完整"）。

## 新增协议类型时的改动清单

添加新协议必须**同步改 5 处**，缺一会导致分组创建但空列表、或节点被静默丢弃：

1. `ShiroRikka.js` 的 `protocolBins` 字典加一个 key（如 `hysteria: []`）
2. `ShiroRikka.js` 的 `switch` 加对应 `case` 分支（把 name push 进 bin + `matchedProxies`）
3. `ShiroRikka.js` 的 `PROTOCOLS` 数组加 `[binKey, 显示名, 图标 URL]`
4. `README.md` 的分类规则表加一行（分组说明表 / 架构树也需检查）
5. `test/main.test.js` 的 `keepNodes` 加一个测试节点 + `expectedMainGroups` 加显示名

新协议优先用仓库 `icons/` 下的 svg，无对应图标时回退到 `${CDN_QURE}Proxy.png`。新协议图标文件放入 `icons/` 目录。

## 每次修改后

1. 检查 `README.md` 是否需同步更新
2. 更新版本号注释 `// vX.Y`
3. 确认无 `module.exports` 残留