# DGX Spark 中文手册网站说明

这个目录包含基于 **Docusaurus** 搭建的文档网站骨架，用于在线展示 `dgx-spark-playbooks-cn` 中文手册。

## 目录说明

- `website/`：Docusaurus 站点工程
- `website/docs/`：导入后的文档内容
- `website/build/`：构建后的静态站点输出目录

## 本地开发

在 `website/` 目录下运行：

```bash
npm install
npm start
```

默认会启动本地开发服务器，方便预览和调试。

## 生产构建

```bash
npm install
npm run build
```

构建完成后，静态文件会输出到：

```bash
website/build
```

## GitHub Pages 自动部署

仓库中已经提供了 GitHub Actions 工作流：

- `.github/workflows/deploy-pages.yml`

默认行为：
- 当 `main` 分支中的 `website/**` 发生变更时自动触发
- 在 GitHub Actions 中执行 `npm install` 和 `npm run build`
- 将构建产物 `website/build` 发布到 GitHub Pages

如果你要启用它，需要在 GitHub 仓库设置中开启：

- **Settings → Pages → Source = GitHub Actions**

## 阿里云 ESA Pages 部署建议

从当前项目结构来看，这个站点适合以 **静态站点** 的方式部署到阿里云 **边缘安全加速 ESA Pages**。

### 推荐参数

如果 ESA Pages 支持指定子目录项目，建议使用：

- **Root Directory**: `website`
- **Install Command**: `npm install`
- **Build Command**: `npm run build`
- **Output Directory**: `build`

如果 ESA Pages 支持从 GitHub 仓库拉取并自动构建，这套参数应该可以直接套用。

## Docusaurus 配置建议

当前 `docusaurus.config.ts` 已调整为适合当前独立域名部署的形式：

```ts
url: 'https://dgx-spark.ai',
baseUrl: '/',
```

部署时请按实际访问域名修改：

### 当前推荐, 绑定独立域名并部署在根路径

```ts
url: 'https://dgx-spark.ai',
baseUrl: '/',
```

### 如果以后部署在某个子路径下

例如：

```ts
url: 'https://example.com',
baseUrl: '/dgx-spark-playbooks-cn/',
```

## 当前已知问题

当前站点已经可以成功构建，但仍有一些待优化项：

- 部分 Markdown 链接仍沿用原始 README 结构，可能产生 broken links
- 一些目录锚点仍然指向英文标题 slug，需要进一步修正
- 少量文档中仍存在可继续清理的 HTML/Markdown 历史遗留写法

这些问题不会阻止站点构建，但会影响部分页面间跳转体验。

## ESA 配置文件

仓库根目录已添加建议版 `esa.jsonc`，用于表达当前项目的 ESA Pages 部署意图：

- 根目录项目子路径：`website`
- 构建命令：`npm run build`
- 静态输出目录：`build`
- 目标域名：`dgx-spark.ai`

如果 ESA 控制台字段和 `esa.jsonc` schema 完全一致，可以直接使用；如果命名略有差异，请以控制台实际字段为准。

## 项目说明

本网站基于官方 DGX Spark Playbooks 的中文翻译内容构建，属于社区驱动项目，与 NVIDIA 公司无隶属、无背书、无官方维护关系。
