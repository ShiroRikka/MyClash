# AGENTS.md - Clash.Meta 脚本

## 快速开始

```bash
npm install
```

脚本是**函数模块**，非独立可执行文件。调用方式：`main(config)` 传入 Clash YAML 配置对象，返回增强后的配置对象。

## 本地测试

测试文件命名 `Proxies.yaml`，包含 `proxies` 数组：

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

- **地区检测**：扫描所有代理名中的国旗 emoji，采用**排除法**——主要地区（🇭🇰中国-香港、🇹🇼中国-台湾、🇯🇵日本、🇺🇸美国、🇸🇬新加坡）独立分组，其余所有地区（无论多少个国家）自动合并为「其他地区」。不再使用固定国家白名单，确保任何国家节点都不会被遗漏
- **倍率分组**：按【Nx】标签扫描所有实际倍率值（步进 0.1），每个值独立创建 fallback 分组（如 `0.1x`、`1x`、`2x`、`10x`）
- **质量分组**：按 A/B/C 前缀分组，各自独立 fallback（A级节点、B级节点、C级节点）
- **带宽分级**：`(\d+(?:\.\d+)?)\s*MB/s` 正则提取，按数值降序分组（1-5MB/s 各一组，>=6MB/s 为 6+MB/s 组）
- **规则集**：从 Loyalsoldier/clash-rules 加载，默认结转 `MATCH,漏网之鱼`
- **代理组**：节点选择 → 质量/倍率 → 地区/其他地区 → 解锁 → 带宽 → 全局策略组 → 广告/应用/全球组

## 注意

1. 每次更改都需要版本更新：根据本次修改的大小，修改顶部 `// vX.Y` 注释
2. 中文代理组名和注释不翻译保留
3. 主要地区固定独立分组（HK/TW/JP/US/SG），其余地区自动合并为「其他地区」（排除法：扫描所有出现的国旗，减去主要地区即为其他地区，不设固定国家白名单）
4. 地区代理组基于 `proxy.name` 中的 emoji 动态生成，不存在时不会创建
5. **禁止添加 module.exports** - 某些客户端不支持，会报错
6. 每次修改后，检查 `README.md` 是否需要同步更新
