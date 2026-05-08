# Clash.Meta 代理组生成脚本

自动识别代理节点地区，生成智能代理组配置。

## 快速开始

### 在 Clash Verge 中使用

1. 打开 Clash Verge → 设置 → 拓展脚本
2. 添加新脚本，粘贴 `clash-meta-script-自动测速.js` 或 `clash-meta-script-负载均衡.js` 的代码
3. 重启 Clash

### 在其他客户端中使用

将脚本 URL 添加到配置文件：

[国家组自动测速版](https://raw.githubusercontent.com/ShiroRikka/Clash.Meta-Script/main/url-test.js)  
[国家组负载均衡版](https://raw.githubusercontent.com/ShiroRikka/Clash.Meta-Script/main/load-balance.js)

## 两个版本区别

| 版本                            | 行为                                     |
| ------------------------------- | ---------------------------------------- |
| `clash-meta-script-自动测速.js` | 每个地区组内自动测速，选择延迟最低的节点 |
| `clash-meta-script-负载均衡.js` | 每个地区组内使用轮询负载均衡，分散流量   |

## 功能特性

- 🌍 **自动地区分组** - 识别代理名中的国旗 emoji，按地区生成代理组
- 📊 **带宽分级** - 从代理名提取带宽信息，分组显示
- 🚀 **多种策略** - 自动选择、自动回退、负载均衡（轮询/哈希/粘滞）
- 🛡️ **规则集** - 内置 Loyalsoldier 规则，广告拦截、应用净化

## 支持的地区

美国、日本、韩国、香港、台湾、新加坡、英国、德国、荷兰、法国、澳大利亚、加拿大、印度、俄罗斯、芬兰、波兰、越南、泰国、巴西等 170+ 国家和地区。

## 本地测试

```bash
# 安装依赖
npm install

# 准备测试配置文件 Proxies.yaml，然后运行
node dev/run.js
```

处理后的配置会输出到 `processed_config.yaml`。

## 代理组说明

**地区组**（按国家/地区划分，每个组内会测速或负载均衡）

**带宽组**（100MB+、50-100MB、20-50MB、10-20MB、0-10MB）

**全局策略**

- 节点选择 - 手动选择
- 自动选择 - 延迟最低
- 自动回退 - 故障转移
- 负载均衡-轮询
- 负载均衡-哈希
- 负载均衡-粘滞

**功能组**

- 广告拦截
- 应用净化
- GLOBAL - 出口选择

## 项目结构

```
Clash.Meta-Script/
├── clash-meta-script-自动测速.js   # 测速版
├── clash-meta-script-负载均衡.js   # 负载均衡版
├── package.json
├── dev/
│   └── run.js
└── README.md
```

## 依赖

- js-yaml

## License

GPL-3.0
