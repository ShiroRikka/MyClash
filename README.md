# Clash.Meta 代理组生成脚本

自动识别代理节点地区，生成智能代理组配置。

## 快速开始

### 在 Clash Verge 中使用

1. 打开 Clash Verge → 设置 → 拓展脚本
2. 添加新脚本，粘贴 `main.js` 的代码
3. 重启 Clash

### 在其他客户端中使用

将脚本 URL 添加到配置文件：

[脚本地址](https://raw.githubusercontent.com/ShiroRikka/Clash.Meta-Script/main.js)

## 功能特性

- 🌍 **自动地区分组** - 识别代理名中的国旗 emoji，按地区生成代理组
- 📊 **带宽分级** - 1-5MB/s 各一组，>=6MB/s 为 6+MB/s 组
- 🚀 **负载均衡** - 每个地区组内轮询负载均衡
- 🛡️ **规则集** - 内置 Loyalsoldier 规则，广告拦截、应用净化

## 支持的地区

香港、台湾、新加坡、日本、美国、韩国等。

## 本地测试

```bash
npm install
```

测试文件命名 `Proxies.yaml`，包含 `proxies` 数组，脚本运行后会输出到 `processed_config.yaml`。

## 代理组说明

**地区组**（按国家/地区划分，每个组内负载均衡）

**带宽组**

- 6+MB/s (>=6MB/s)
- 5MB/s
- 4MB/s
- 3MB/s
- 2MB/s
- 1MB/s

**全局策略**

- 节点选择 - 手动选择
- 自动选择 - 延迟最低
- 自动回退 - 故障转移
- 负载均衡 - 轮询
- 手动切换

**功能组**

- 广告拦截
- 应用净化
- 全球直连

## 项目结构

```
Clash.Meta-Script/
├── main.js           # 主脚本
├── Proxies.yaml      # 测试用代理配置
├── package.json
└── README.md
```

## 依赖

- js-yaml

## License

GPL-3.0