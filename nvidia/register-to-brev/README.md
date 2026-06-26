# 将 DGX Spark 注册到 Brev

> 将你的 DGX Spark 连接到 Brev，实现远程访问与共享环境

## 目录

- [概述](#overview)
- [操作步骤](#instructions)
- [故障排查](#troubleshooting)

---

## 概述

## 基本思路

NVIDIA Brev 是一个 AI 开发平台，它通过名为 Launchable 的预配置方案，让 GPU 环境可以被远程访问、共享，并易于标准化。

本教程将帮助你把 NVIDIA DGX Spark 连接到 Brev，使其在 Brev 中显示为一个受管理的 GPU 环境。完成一次性注册后，你的 Spark 即可被远程访问和共享。

## 你将完成什么

你将把 DGX Spark 注册到 Brev，使其在 Brev 网页 UI 和 CLI 中显示为一个健康的节点，随时可以共享访问权限并接受工作负载。

## 开始之前需要了解什么

虽然 Brev 会自动完成复杂的配置，但在建立初次连接时，了解几个关键概念会很有帮助：

* **终端基础**：
  * 熟悉命令行，以便运行几条简单的安装命令

## 先决条件

你的 DGX Spark [设备已完成设置](https://docs.nvidia.com/dgx/dgx-spark/first-boot.html)。此外你还需要：

* **Brev 账户**：
  * 拥有一个 NVIDIA Brev 账户。如果还没有，请在[此处](https://login.brev.nvidia.com/signin)创建。

* **权限**：
  * 你在 DGX Spark 设备上拥有管理员（root 或 sudo）权限，以便运行注册命令。

## 时间与风险

* **预计耗时**：5-10 分钟
* **风险等级**：低 —— 注册过程会为 Spark 配置安全的远程访问，而不会改动你现有的工作负载
* **回滚方式**：可以通过 UI 或 CLI 移除 Brev 配置

## 操作步骤

## 步骤 1. 登录 Brev

打开 [Brev UI](https://brev.nvidia.com)，登录后确认你处于正确的组织中（点击页面右上角的组织按钮）。登录后，进入主导航 “GPU” 标签页下的 [Registered Compute](https://brev.nvidia.com/org/environments?tab=registered-compute)（已注册算力）部分。

点击 “Register Compute”（注册算力）按钮，并按照弹出窗口中的说明操作。

## 步骤 2. 完成弹窗中的说明

* 安装 Brev CLI
* 配置你的算力
    * 为算力添加一个名称
    * 若要配置 ssh，请确保 “Enable SSH access”（启用 SSH 访问）开关处于打开状态
* 运行注册命令

## 步骤 3. 跟随注册流程

在 CLI 中，系统会引导你完成注册。按照流程操作，直到注册完成。

## 步骤 4. 在 Brev UI 中确认 Spark

* 打开 [Brev UI](https://brev.nvidia.com)
* 进入 [Registered Compute](https://brev.nvidia.com/org/environments?tab=registered-compute)（已注册算力）
* 确认 DGX Spark 以 **Connected**（已连接）状态显示为一个已注册节点

## 步骤 5. 后续步骤

现在你的 Spark 已作为一个安全、可远程访问的 GPU 环境集成到了 Brev 中。

硬件连接完成后，你可以：

* **随处共享访问**：你可以从任何地方访问你的机器，并通过 Brev UI 与他人共享访问权限，方法是：
    * 将该用户添加到你的[团队](https://brev.nvidia.com/org/team)
    * 在 [Registered Compute](https://brev.nvidia.com/org/environments?tab=registered-compute)（已注册算力）部分进入你的实例
    * 在该实例的 **SSH Access**（SSH 访问）部分中，搜索你想要添加的用户，点击 **Modify Access**（修改访问权限）以启用其访问

## 步骤 6. 清理

如果你日后决定将 Spark 从 Brev 取消注册，可以通过 Brev UI 或 Brev CLI 来完成。

使用 CLI 时，只需运行：

```bash
brev deregister
```

在 UI 中：
* 打开 [Brev UI](https://brev.nvidia.com)
* 进入列出 “GPU Environments”（GPU 环境）的部分，并查看 “Registered Compute”（已注册算力）
* 在你想从 Brev 删除的 Spark 上，点击 “Remove”（移除）菜单项
* 确认你的选择

## 故障排查

| 现象 | 原因 | 解决办法 |
|---------|-------|-----|
| 你的 DGX Spark 显示在错误的组织中 | 你把 DGX Spark 注册到了错误的组织 | 运行 `brev set <my-org>`，然后重新进行注册 |
| 无法执行 `brev shell <name>` | 需要刷新 | `brev refresh` |

如需了解最新的已知问题，请查阅 [DGX Spark 用户指南](https://docs.nvidia.com/dgx/dgx-spark/known-issues.html)。
