# Clash.Meta 代理组生成脚本

自动识别代理节点特征，生成智能代理组配置。

**当前版本：v4.10**

## 快速开始

### 在 Clash Verge 中使用

1. 打开 Clash Verge → 设置 → 拓展脚本
2. 添加新脚本，粘贴 `main.js` 的代码
3. 重启 Clash

### 在其他客户端中使用

将脚本 URL 添加到配置文件：

[脚本地址](https://raw.githubusercontent.com/ShiroRikka/Clash.Meta-Script/main/main.js)

## 功能特性

- 🌍 **自动地区分组** - 识别代理名中的国旗 emoji，主要地区独立分组，其余合并为「其他地区」
- 🔓 **平台解锁分组** - 自动识别 GPT、Netflix、Gemini、Disney+、YouTube、Claude、Spotify 等解锁标记，生成对应分组
- 📊 **带宽分级** - 1-5MB/s 各一组，>=6MB/s 为 6+MB/s 组
- 📈 **倍率分组** - 按【Nx】标签扫描所有实际倍率值，每个值独立分组
- 🏆 **质量分级** - 按 A/B/C 前缀分组，各自独立 fallback
- 🔄 **智能回退** - 地区组和解锁组均使用 fallback 模式，自动跳过不可用节点
- 🕸️ **漏网之鱼** - 未匹配规则流量可独立选择走代理或直连
- 🛡️ **规则集** - 内置 Loyalsoldier 规则，广告拦截、应用净化

## 支持的地区

主要地区（独立分组）：🇭🇰 香港、🇹🇼 台湾、🇯🇵 日本、🇺🇸 美国、🇸🇬 新加坡

其他合并为「其他地区」：🇨🇳 中国、🇬🇧 英国、🇩🇪 德国、🇫🇷 法国、🇦🇺 澳大利亚、🇨🇦 加拿大

> 基于 proxy.name 中的 emoji 动态生成，不存在时不会创建。

## 代理组说明

### 策略选择

- **节点选择** - 顶层策略选择器，包含所有子分组
- **自动回退** - 包含全部节点，故障自动切换（排除国内节点）
- **漏网之鱼** - 未匹配规则流量，默认走节点选择，可切换直连

### 质量分组（fallback）

按节点名前缀 `A-` / `B-` / `C-` 分类，各自独立分组：

| 分组 | 匹配前缀 |
|---|---|
| A级节点 | `A-` |
| B级节点 | `B-` |
| C级节点 | `C-` |

> 仅当节点列表中存在对应前缀时才会创建。

### 倍率分组（fallback）

按【Nx】标签扫描所有实际倍率值，每个值独立分组：

| 分组 | 匹配标记 |
|---|---|
| 0.5x | `【0.5x】` |
| 1x | `【1x】` |
| 2x | `【2x】` |
| ... | ... |
| 10x | `【10x】` |

> 倍率值按降序排列，仅当存在对应标记时才会创建。

### 地区组（fallback）

| 分组 | emoji | 匹配 |
|---|---|---|
| 🇭🇰 中国-香港 | `🇭🇰` | HK |
| 🇹🇼 中国-台湾 | `🇹🇼` | TW |
| 🇯🇵 日本 | `🇯🇵` | JP |
| 🇺🇸 美国 | `🇺🇸` | US |
| 🇸🇬 新加坡 | `🇸🇬` | SG |
| 其他地区 | 🌐 | CN / GB / DE / FR / AU / CA |

> 基于 proxy.name 中的 emoji 动态生成，不存在时不会创建。

### 解锁组（fallback）

根据代理节点名称中的标记自动识别并生成：

| 分组 | 匹配标记 | 图标来源 |
|---|---|---|
| GPT解锁 | `GPT` | Qure (ChatGPT.png) |
| Netflix解锁 | `NF` | Qure (Netflix.png) |
| Gemini解锁 | `GM` | LobeHub (gemini.svg) |
| Disney+解锁 | `D+` | Qure (StreamingCN.png) |
| YouTube解锁 | `YT-` | Qure (YouTube.png) |
| Claude解锁 | `CL-` | Qure (AI.png) |
| Spotify解锁 | `SP-` | Qure (Spotify.png) |

> 仅当节点列表中存在匹配标记时，对应分组才会生成。

### 带宽组（load-balance）

- 6+MB/s (>=6MB/s)
- 5MB/s
- 4MB/s
- 3MB/s
- 2MB/s
- 1MB/s
- <1MB/s

### 功能组

- **广告拦截** - select (REJECT / DIRECT)
- **应用净化** - select (REJECT / DIRECT)
- **GLOBAL** - 主控选择器

## 规则说明

脚本自动生成 Loyalsoldier 规则集订阅，并应用以下路由规则：

```
applications → DIRECT
clash.razord.top → DIRECT
yacd.haishan.me → DIRECT
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

## 节点命名规范

为获得最佳分组效果，建议代理节点按以下格式命名：

```
{国旗}{地区}_{序号}|{速度}|{倍率}|{质量前缀}|{解锁标记1}|{解锁标记2}|...
```

**示例：**

```yaml
proxies:
  - name: "🇭🇰HK_1|5.2MB/s|【2x】|A-|YT-HK|NF|SP-HK"
  - name: "🇸🇬SG_1|5.5MB/s|【10x】|B-|YT-SG|NF-SG|D+|GPT|GM-SG|CL-SG"
  - name: "🇯🇵JP_1|6.9MB/s|【1x】|C-|YT-JP|NF|GM-JP|SP-JP"
  - name: "🇺🇸US_1|4.5MB/s|【0.5x】|YT-CN|NF|D+|GPT|GPT⁺-US"
  - name: "🇬🇧GB_1|3.1MB/s|【5x】|A-|YT-GB|NF|GM-GB"
```

**标记说明：**

- `A-` / `B-` / `C-` - 质量分级前缀（A级最优，C级最差）
- `【Nx】` - 倍率标签，如 `【0.5x】`、`【1x】`、`【2x】`、`【10x】`
- `GPT` / `GPT⁺` - 解锁 OpenAI/ChatGPT
- `NF` / `NF-{地区}` - 解锁 Netflix
- `GM` / `GM-{地区}` - 解锁 Google Gemini
- `D+` - 解锁 Disney+
- `YT-{地区}` - 解锁 YouTube Premium
- `CL-` - 解锁 Claude
- `SP-{地区}` - 解锁 Spotify

## 本地测试

```bash
npm install
```

测试文件命名 `Proxies.yaml`，包含 `proxies` 数组：

```yaml
proxies:
  - name: "🇭🇰HK_1|5.2MB/s|【2x】|A-|YT-HK|NF|SP-HK"
    # ...其他配置
  - name: "🇸🇬SG_1|5.5MB/s|【10x】|B-|YT-SG|NF-SG|D+|GPT|GM-SG|CL-SG"
    # ...其他配置
```

脚本运行后会输出到 `processed_config.yaml`：

```bash
node -e "const yaml=require('js-yaml'),fs=require('fs'); const c=yaml.load(fs.readFileSync('Proxies.yaml','utf8')); console.log(yaml.dump(require('./main.js').main(c)))" > processed_config.yaml
```

## 项目结构

```
Clash.Meta-Script/
├── main.js       # 主脚本 (v4.10)
├── AGENTS.md     # 开发规范与注意事项
├── Proxies.yaml  # 测试用代理配置
├── package.json  # 项目依赖
└── README.md     # 本文档
```

## 依赖

- js-yaml (开发/测试用)

## License

GPL-3.0