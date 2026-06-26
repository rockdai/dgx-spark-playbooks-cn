# OpenClaw

> 在 DGX Spark 上使用 vLLM 服务的本地模型本地运行 OpenClaw

## 目录

- [概述](#overview)
- [操作步骤](#instructions)
- [故障排查](#troubleshooting)

---

<a id="overview"></a>
## 概述

## 基本思路

OpenClaw（以前称为 Clawdbot 和 Moltbot）是在您的计算机上运行的**本地优先** AI 智能体。它将多种功能组合到一个助手中：它记住对话、适应您的使用情况、连续运行、使用文件和应用程序中的上下文，并且可以通过社区**技能**进行扩展。

**完全在 DGX Spark 上运行 OpenClaw 及其 LLM** 可保持数据的私密性并避免持续的云 API 成本。 DGX Spark 非常适合这一点：它运行 Linux，设计为持久运行，并拥有 **128GB 内存**，因此您可以运行大型本地模型，以获得更高的准确性和更强大的行为。

## 你将完成什么

您将在 DGX Spark 上安装 OpenClaw 并连接到由 **vLLM** 服务的本地 LLM（agent-ready 的 `nvidia/Qwen3.6-35B-A3B-NVFP4` 配方）。您可以使用 OpenClaw Web UI 与您的助手聊天，并可选择连接通信通道和技能。智能体和模型完全在您的 Spark 上运行，除非您添加云或外部集成，否则数据不会离开您的计算机。

## 热门用例

- **私人秘书**：通过访问您的收件箱、日历和文件，OpenClaw 可以帮助您管理日程、起草回复、发送提醒和查找会议空档。
- **主动项目管理**：通过电子邮件或消息检查项目状态、发送状态更新以及跟进或发送提醒。
- **研究智能体**：结合网络搜索和本地文件来生成具有个性化背景的报告。
- **安装助手**：搜索应用程序/库、运行安装以及使用终端访问调试错误（建议使用较大的模型）。

## 开始之前需要了解什么

- Linux 终端和文本编辑器的基本使用
- 可选：如果您计划使用本地模型，则熟悉 Docker 和 vLLM
- 了解以下安全注意事项

## 重要提示：安全和风险

AI 智能体可能会带来真正的风险。阅读 OpenClaw 的指南：[OpenClaw Gateway Security](https://docs.openclaw.ai/gateway/security)。

主要风险：

1. **数据暴露**：个人信息或文件可能被泄露或被盗。
2. **恶意代码**：智能体或连接的工具可能会让您遭受恶意软件或攻击。

您无法消除所有风险；继续操作的风险由您自行承担。 **关键安全措施：**

- **强烈建议：** 在专用或隔离系统（例如，干净的 DGX Spark 或 VM）上运行 OpenClaw，并且仅复制智能体所需的数据。不要在包含敏感数据的主工作站上运行此程序。
- 使用智能体的**专用账户**而不是您的主账户；仅授予其所需的最低访问权限。
- 仅启用**您信任的技能**，最好是经过社区审查的技能。提供终端或文件系统访问的技能会显着增加风险。
- **关键：** 确保 OpenClaw Web UI 和任何消息通道在没有强大身份验证的情况下**不会暴露**到公共互联网。如果远程访问，请使用 SSH 隧道或 VPN。
- 在可能的情况下，使用防火墙规则或网络隔离**限制智能体的互联网访问**。
- **监控活动**：定期查看智能体执行的日志和命令。

## 先决条件

- 运行 Linux 的 DGX Spark，已连接到您的网络
- 终端（SSH 或本地）访问 Spark
- 对于本地LLM：为您选择的模型提供足够的 GPU 内存（有关大小Instruct，请参阅说明；DGX Spark 的 128GB 支持大型模型）

## 时间与风险

- **预计时间**：安装和首次模型设置大约需要 30 分钟；模型下载时间取决于大小和网络（NVFP4 检查点下载一次后会被缓存供后续启动使用）。
- **风险级别**：**中到高** - 智能体可以访问您配置的任何文件、工具和通道。如果您启用终端/命令执行技能或连接外部账户，风险会显着增加。如果没有适当的隔离，此设置可能会暴露敏感数据或允许代码执行。 **始终遵循上述安全措施。**
- **回滚**：您可以通过相同的安装脚本或删除其目录来停止 OpenClaw 网关并卸载；如果需要，请单独停止 vLLM 容器（`docker rm`/`docker rmi`）。
- **最后更新**：2026 年 6 月 12 日
  - 将本地推理后端切换为 vLLM（agent-ready Qwen3.6 35B 配方）
  - 首次出版

<a id="instructions"></a>
## 操作步骤
> [！警告]
> **继续之前，请查看“概述”选项卡中的安全风险。** OpenClaw 是一个 AI 智能体，可以访问您的文件、执行命令以及连接到外部服务。数据泄露和恶意代码执行是真正的风险。 **强烈建议：** 在隔离的系统或虚拟机上运行 OpenClaw，使用专用账户（而不是您的主账户），并且切勿在未经身份验证的情况下将仪表板暴露于公共互联网。

## 步骤 1. 在 DGX Spark 上安装 OpenClaw

在 DGX Spark 上，打开终端并运行官方安装脚本。这将在您的 Linux 系统上安装 OpenClaw 及其依赖项。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

下载依赖项后，OpenClaw 将显示**安全警告**。阅读风险；如果您接受它们，请使用箭头键选择**是**并按 Enter。

## 步骤 2. 完成 OpenClaw 入门

按照以下提示进行操作。

1. **快速入门与手动**：选择**快速入门**。

2. **模型提供者**：要使用**本地模型**（建议用于 DGX Spark），请转到列表底部并选择 **立即跳过** - 您稍后将配置模型。要使用云模型，请选择提供商并按照其说明进行操作。

3. **按提供商过滤模型**：选择**所有提供商**。在默认模型的下一个提示中，选择 **保持当前**。

4. **通信通道**：您可以连接通道（例如消息传递）以在远离计算机时使用机器人，或者选择 **立即跳过** 并稍后进行配置。

5. **技能**：我们建议暂时选择**否**。测试完基础知识后，您可以稍后从 Web UI 或 Clawhub 添加技能。

6. **Homebrew**：如果系统提示您安装 Homebrew，请选择 **否** - Homebrew 仅适用于 macOS，Linux 上不需要。

7. **挂钩**：我们建议选择全部三个以获得更好的体验。请注意，这可能会在本地记录数据；仅当您对此感到满意时才启用。

8. **仪表板 URL**：终端将打印 OpenClaw 仪表板的 URL。 **保存此 URL**（以及显示的任何访问令牌） - 您将需要它来打开 Web UI。

9. **完成**：在最终提示上选择**是**以完成安装。

您现在可以使用安装程序中的 URL 和令牌在浏览器中打开 OpenClaw 仪表板。

## 步骤 3. 在 DGX Spark 上使用 vLLM 服务模型

OpenClaw 将连接到由 **vLLM** 服务的本地 OpenAI 兼容端点。本手册使用 agent-ready 的 `nvidia/Qwen3.6-35B-A3B-NVFP4` 配方——与 vLLM 手册的 [Run Agent Ready Qwen3.6 35B Model with vLLM](https://build.nvidia.com/spark/vllm/agent-ready-qwen35b) 选项卡中记录的相同。NVFP4 量化和推测解码提供了强大的工具调用和推理质量，同时在 DGX Spark 的 128GB 统一内存上留出余量。

在 DGX Spark 上的 **单独的终端** 中，按照 vLLM 手册的 [Run Agent Ready Qwen3.6 35B Model with vLLM](https://build.nvidia.com/spark/vllm/agent-ready-qwen35b) 选项卡启动服务器。在其专用的终端中运行它，以便网关和模型服务器可以并行运行。该选项卡通过 `http://localhost:8000/v1` 上的 OpenAI 兼容 API 服务 `nvidia/Qwen3.6-35B-A3B-NVFP4`。

当服务器报告 `Application startup complete` 后，在继续之前从另一个终端验证它：

```bash
curl http://localhost:8000/v1/models
```

您应该会在返回的列表中看到 `nvidia/Qwen3.6-35B-A3B-NVFP4`。

## 步骤 4. 配置 OpenClaw 以使用 vLLM 服务器

1. 在您喜欢的编辑器（例如 `nano`、`vim` 或图形编辑器）中打开 OpenClaw 配置文件。配置路径为：
   ```bash
   ~/.openclaw/openclaw.json
   ```
   纳米示例：
   ```bash
   nano ~/.openclaw/openclaw.json
   ```

2. 添加或更新 `models` 部分，使其包含指向步骤 3 中端点的 vLLM 提供程序。vLLM 不需要 API 密钥，因此任何非空占位符均可：

```json
"models": {
  "mode": "merge",
  "providers": {
    "vllm": {
      "baseUrl": "http://localhost:8000/v1",
      "apiKey": "vllm",
      "api": "openai-responses",
      "models": [
        {
          "id": "nvidia/Qwen3.6-35B-A3B-NVFP4",
          "name": "nvidia/Qwen3.6-35B-A3B-NVFP4",
          "reasoning": true,
          "input": ["text"],
          "cost": {
            "input": 0,
            "output": 0,
            "cacheRead": 0,
            "cacheWrite": 0
          },
          "contextWindow": 262144,
          "maxTokens": 8192
        }
      ]
    }
  }
}
```

`id` 和 `name` 必须与 vLLM 所服务的模型句柄（`nvidia/Qwen3.6-35B-A3B-NVFP4`）一致。`contextWindow` 与步骤 3 中的 `--max-model-len` 匹配。

> [！笔记]
> 如果 OpenClaw 针对 Responses API 报告不支持端点的错误，请将 `"api": "openai-responses"` 改为适用于您的 OpenClaw 版本的 OpenAI chat-completions 变体——vLLM 始终暴露 `/v1/chat/completions`。

3. 如果 OpenClaw 网关已在运行，请重新启动它，以便它重新加载 `~/.openclaw/openclaw.json` 并采用新的提供程序。

## 步骤 5. 验证设置

1. 在浏览器中，打开 **OpenClaw 仪表板 URL**（并根据需要使用访问令牌）。
2. 开始**新**对话并发送短信。
3. 如果您收到智能体的回复，则说明设置正常。

您还可以询问 OpenClaw 它使用的是哪种模型。在网关聊天 UI 中，您可以通过键入：**`/model MODEL_NAME`**（例如 `/model nvidia/Qwen3.6-35B-A3B-NVFP4`）来切换模型。

## 步骤 6. 可选：添加技能并了解更多信息

- **技能**增加了能力，但也增加了风险；仅启用您信任的技能（例如，经过社区审查的技能）。添加技能：
  - 要求 OpenClaw 配置技能，或者
  - 使用 Web UI 中的侧边栏启用技能，或者
  - 浏览 [Clawhub](https://docs.openclaw.ai/tools/clawhub) 了解社区技能。

- 有关更多使用和配置详细信息，请参阅 [OpenClaw 文档](https://docs.openclaw.ai)。

<a id="troubleshooting"></a>
## 故障排查
| 症状 | 原因 | 使固定 |
|---------|--------|-----|
| OpenClaw 仪表板 URL 未加载 | 网关未运行或主机/端口错误 | **重新启动 OpenClaw 网关**，使其重新加载 `~/.openclaw/openclaw.json`。**验证：** 使用 `pgrep -f openclaw` 或 `ps aux \| grep openclaw` 检查网关进程是否正在运行。**查找 URL/令牌：** 查看原始安装程序输出（向上滚动终端）或网关日志（通常位于 `~/.openclaw/logs/`），获取仪表板 URL 和访问令牌 |
| 模型“连接被拒绝”（例如 localhost:8000） | vLLM 服务器未运行、仍在加载或端口错误 | 确认 vLLM 容器已启动并完成加载（`curl http://localhost:8000/v1/models` 列出该模型），并且 `openclaw.json` 中的 `baseUrl` 为 `http://localhost:8000/v1` |
| OpenClaw 说没有可用的模型 | 提供程序未配置或模型句柄不匹配 | 将 `vllm` 提供程序添加到 `~/.openclaw/openclaw.json`，并确保 `id`/`name` 与所服务的句柄（`nvidia/Qwen3.6-35B-A3B-NVFP4`）完全一致 |
| DGX Spark 内存不足或推理速度非常慢 | 模型对于可用 GPU 内存或其他 GPU 工作负载来说太大 | 启动 vLLM 时降低 `--gpu-memory-utilization` 或 `--max-model-len`，释放 GPU 内存（关闭其他应用程序），或使用 `nvidia-smi` 检查使用情况 |
| 安装脚本失败或缺少依赖项 | Linux 上缺少系统包 | 安装 curl和任何所需的构建工具；有关当前要求，请参阅 [OpenClaw 文档](https://docs.openclaw.ai) |
| 配置更改未应用 | 网关未重新加载 | 重新启动 OpenClaw 网关，使其重新加载 `~/.openclaw/openclaw.json` |
