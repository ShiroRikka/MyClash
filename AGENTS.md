# AGENTS.md - Clash.Meta 脚本

## 快速开始

```bash
npm install
```

脚本是**函数模块**，非独立可执行文件。调用方式：`main(config)` 传入 Clash YAML 配置对象，返回增强后的配置对象。

## 本地测试

测试文件命名 `Proxies.yaml`，包含 `proxies` 数组：

```bash
# 创建测试脚本 test-run.js
const yaml = require('js-yaml')
const fs = require('fs')
const { main } = require('./url-test.js')  // 或 load-balance.js

const config = yaml.load(fs.readFileSync('Proxies.yaml', 'utf8'))
const result = main(config)
console.log(yaml.dump(result))
```

```bash
node test-run.js > processed_config.yaml
```

## 两个版本

- `url-test.js` - 自动测速，选择延迟最低节点
- `load-balance.js` - 负载均衡（轮询/哈希/粘滞）

## 代码风格

- 注释使用中文
- 2 空格缩进，无分号
- 模板字符串(反引号)，对象键无引号
- CDN 常量使用大写

## 核心实现

- **地区检测**：通过国旗 emoji (flagMap 常用国家) 匹配代理名，自动生成代理组
- **带宽分级**：`(\d+)\s*MB/s` 正则提取，每间隔1MB/s分组一次
- **规则**：从 Loyalsoldier/clash-rules 加载，默认结转 `MATCH,节点选择`

## 注意

1. 不翻译：保留中文注释和代理组名
2. 版本更新：修改顶部版本号注释 (如 `// v3.1.0`)
3. 地区代理组基于配置文件中的代理动态生成