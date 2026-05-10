# AGENTS.md - Clash.Meta 脚本

## 快速开始

```bash
npm install
```

脚本是**函数模块**，非独立可执行文件。调用方式：`main(config)` 传入 Clash YAML 配置对象，返回增强后的配置对象。

## 本地测试

测试文件命名 `Proxies.yaml`，包含 `proxies` 数组：

```bash
node -e "const yaml=require('js-yaml'),fs=require('fs'); const c=yaml.load(fs.readFileSync('Proxies.yaml','utf8')); console.log(yaml.dump(require('./main.js').main(c)))" > processed_config.yaml
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

- **地区检测**：通过国旗 emoji (flagMap) 匹配代理名，动态生成代理组
- **带宽分级**：`(\d+(?:\.\d+)?)\s*MB/s` 正则提取，按数值降序分组 (1-5MB/s各一组，>=6MB/s为6+MB/s组)
- **规则集**：从 Loyalsoldier/clash-rules 加载，默认结转 `MATCH,节点选择`
- **代理组**：节点选择 → 各地区组 → 带宽组 → 全局策略组 → 广告/应用/全球组

## 注意

1. 每次更改都需要版本更新：根据本次修改的大小，修改顶部 `// vX.Y` 注释
2. 中文代理组名和注释不翻译保留
3. flagMap 只包含 7 个地区 (CN/HK/TW/SG/JP/US/KR)，扩展需同步添加
4. 地区代理组基于 `proxy.name` 中的 emoji 动态生成，不存在时不会创建
5. **禁止添加 module.exports** - 某些客户端不支持，会报错
6. 每次提交前，需检查 `README.md` 是否随本次更改需要同步更新