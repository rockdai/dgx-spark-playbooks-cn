# 用本地模型运行 Hermes Agent

> 在 DGX Spark 上安装并运行可自我改进的 Hermes AI agent。

## 目录

- [概述](#overview)
- [操作步骤](#instructions)
  - [验证到 Telegram 的出站 HTTPS（网关前提）](#verify-outbound-https-to-telegram-gateway-requirement)
- [故障排查](#troubleshooting)

---

## 概述

## 基本思路

[Hermes Agent](https://github.com/NousResearch/hermes-agent) 是由 [Nous Research](https://nousresearch.com) 打造的一个**可自我改进**的 AI agent。它在你的机器上以终端 TUI 的形式运行，并通过内置网关，还可以从 Telegram、Discord、Slack 等消息平台访问。它能从经验中创建技能、在使用过程中不断改进这些技能、跨会话持久化记忆，并通过内置的 cron 运行定时任务。

将 Hermes 及其 LLM **完全运行在你的 DGX Spark 上**，可以让你的对话和数据保持私密，并避免持续的云端 API 费用。DGX Spark 非常适合这一用途：它运行 Linux，专为长时间常开而设计，并配备 **128GB 内存**，因此你可以部署大型本地模型以获得更好的推理质量，同时在繁重计算于本地运行的同时，通过 Telegram 从手机连接到这个 agent。

## 你将完成什么

你将在 DGX Spark 上安装 Hermes，并将其连接到由 **vLLM** 部署的本地 LLM（即面向 agent 优化的 `nvidia/Qwen3.6-35B-A3B-NVFP4` 方案）。你可以从 DGX Spark 终端，以及从手机或笔记本上的 Telegram 与该 agent 对话。网关作为系统服务运行，因此即使重启后，无需任何人登录，该 agent 也始终保持可访问。

- 使用 vLLM 部署本地模型
- 安装 Hermes 并将其配置为对接本地 vLLM 端点
- 设置一个 Telegram 机器人，以便你能从任意 Telegram 客户端给 Hermes 发消息
- 使用 `hermes` CLI 恢复历史会话、切换模型、更新和卸载

## 常见用例

- **从手机使用的私人助手**：在模型运行于 Spark 的同时，通过 Telegram 与 Hermes 对话 —— 随时随地起草邮件、总结文档或回答问题。
- **多步骤任务自动化**：让 agent 引导你完成各种配置（例如设置邮件）；对于不那么简单的任务，Hermes 可以自主持久化一个可复用的技能，供下次使用。
- **定时检查**：使用内置 cron 来监控网上某件商品的价格或执行每日检查，并把结果发送到你的 Telegram home channel。
- **可见推理过程的问题求解**：在 TUI 中使用 `/reasoning show`，跟踪 agent 在复杂问题上的中间推理过程。

## 开始之前需要了解什么

- Linux 终端和文本编辑器的基本使用
- 熟悉 Docker 和 vLLM，或者愿意先按照 [vLLM 推理 playbook](https://build.nvidia.com/spark/vllm) 操作
- 如果你想使用消息网关，需要一个 Telegram 账号
- 了解下文的安全注意事项

## 重要：安全与风险

能够执行命令并访问外部服务的 AI agent 会带来实际的风险。请阅读上游指南，尤其是专门的安全主题：[Hermes Agent — Security](https://hermes-agent.nousresearch.com/docs/user-guide/security)。

主要风险：

1. **数据泄露**：你 DGX Spark 上的个人信息或文件可能通过 agent 的操作或消息渠道泄露。
2. **未授权访问**：如果 Telegram 机器人对任何发现它的人开放，就可能被滥用；暴露到 `localhost` 之外的模型端点也可能被滥用。

你无法消除所有风险；请自行承担风险后继续。**推荐的安全措施：**

- **限制 Telegram 机器人**：在安装过程中的 *"Allowed user IDs"* 提示处，输入一个或多个数字形式的 Telegram 用户 ID。留空将允许任何发现该机器人的人使用它。
- 让 vLLM 端点保持仅绑定到 Spark；在没有强身份验证的情况下，不要将 `http://<spark-ip>:8000` 转发到你的局域网或公网。
- 在可能的情况下，把 Hermes 运行在一台专用于此用途的 Spark 上，并且只在其中放置允许该 agent 访问的文件。
- **监控活动**：定期查看网关服务日志（`sudo journalctl -u <hermes-gateway-unit> -e`）以及 Hermes 的会话历史。

## 先决条件

- 运行 Linux 并已接入你的网络的 DGX Spark
- 对 Spark 的终端（SSH 或本地）访问权限
- 已安装 `curl` 和 `git`（在操作步骤的步骤 1 中验证）
- 用于安装向导以及任何 `sudo` 密码提示的交互式终端访问。通过操作步骤标签页中的 config 命令回退方案，也支持非交互式 SSH。
- 安装了 NVIDIA Container Toolkit 的 Docker，以及用于下载模型的 HuggingFace token（本 playbook 使用 vLLM 部署 `nvidia/Qwen3.6-35B-A3B-NVFP4`）
- 如果你打算使用消息网关，需要一个 Telegram 账号以及通过 [@BotFather](https://t.me/BotFather) 创建机器人的能力

## 时间与风险

- **耗时**：安装和首次设置约 30 分钟；模型下载时间取决于模型大小和网络速度。
- **风险等级**：**中** —— 该 agent 可以执行命令、持久化技能，并且可从 Telegram 访问。如果你跳过 allowed-user-IDs 限制，或将本地模型端点暴露到 `localhost` 之外，风险会增加。请始终遵循上文的安全措施。
- **回滚方式**：运行 `hermes uninstall`（如果你将网关安装为系统服务，则加上 `sudo`）即可移除 Hermes、网关服务以及 shell 配置文件中的条目。之后数据目录 `~/.hermes` 可能仍然存在；如果你想完全重置，请手动删除它（参见 Cleanup 和 Troubleshooting 标签页）。如有需要，请单独停止 vLLM 容器（`docker rm`/`docker rmi`）。
- **最近更新**：2026-06-12
  - 将本地推理后端切换为 vLLM（面向 agent 优化的 Qwen3.6 35B 方案）
  - 首次发布

## 操作步骤

## 步骤 1. 确认你的环境

在安装 Hermes 之前，请确认你的 DGX Spark 正在运行 DGX OS、具备网络访问能力，并提供安装期间会用到的基本命令行工具。

```bash
uname -a
curl --version
git --version
```

**需要关注什么：** DGX Spark 出厂搭载 **DGX OS**，这是一套基于 Ubuntu 的专用 Linux 镜像。`uname -a` 这一行并不总是包含字面字符串 “DGX OS”。一台正常的 Spark 通常会在该输出中显示 **Linux**、**Ubuntu** 和 **nvidia**（内核或平台标识符）。请确认 `curl --version` 和 `git --version` 都能正常打印版本信息且没有报错。

### 验证到 Telegram 的出站 HTTPS（网关前提）

Hermes 的 **Telegram 网关**通过 **HTTPS** 与 Telegram 的云端 API 通信。在某些企业或实验室网络中，**到 `api.telegram.org` 的出站 HTTPS 被屏蔽**，这会导致本地安装看似正常，但**机器人始终没有任何响应**。在你投入时间设置网关之前，请在准备用于 Spark 的同一网络上运行以下快速检查：

```bash
curl -sS --connect-timeout 10 -o /dev/null -w "HTTP %{http_code}\n" https://api.telegram.org/
```

你应该会看到一行 **HTTP 状态行**，例如 **`HTTP 404`**、**`HTTP 200`** 或 **`HTTP 302`**（Telegram 的边缘节点通常会用一小段 JSON 或重定向来应答裸 `GET` 请求）。重点在于请求**通过 TLS 顺利完成**而不会卡住。如果出现**超时**、**“Could not resolve host”** 或**连接被拒绝**，则意味着网关无法从这个网络访问 Telegram —— 请改用允许此类流量的链路（例如个人热点），或请你的网络管理员放行**到 `api.telegram.org` 的 HTTPS**。

## 步骤 2. 使用 vLLM 启动模型服务

Hermes 将被配置为对接一个本地的、OpenAI 兼容的端点，因此在你启动 Hermes 安装程序之前，必须先运行一个模型服务。本 playbook 使用 **vLLM** 搭配面向 agent 优化的 `nvidia/Qwen3.6-35B-A3B-NVFP4` 方案 —— 与 vLLM playbook 的 [Run Agent Ready Qwen3.6 35B Model with vLLM](https://build.nvidia.com/spark/vllm/agent-ready-qwen35b) 标签页中所记录的方案相同。

请按照该标签页的说明，在 Spark 上的**另一个终端**中启动服务，使其能够与 Hermes 并行运行。它会在 `http://localhost:8000/v1` 上以 OpenAI 兼容的 API 提供 `nvidia/Qwen3.6-35B-A3B-NVFP4`。

当服务报告 `Application startup complete` 后，在另一个终端中验证 **8000** 端口上的 API。一个正常的服务会返回 **JSON**，其中顶层包含一个列出所服务模型的 **`"data"`** 数组：

```bash
curl -sS http://localhost:8000/v1/models
```

你应该会在返回的列表中看到 `nvidia/Qwen3.6-35B-A3B-NVFP4`。

> [!NOTE]
> 让 vLLM 端点保持仅绑定到 Spark。容器会发布 `8000` 端口；在没有强身份验证的情况下，不要将 `http://<spark-ip>:8000` 转发到你的局域网或公网。

## 步骤 3. 安装 Hermes

请从 Spark 上的**交互式终端**运行安装程序。如果你通过 SSH 连接，请使用一个能够回答提示并在需要时输入 `sudo` 密码的普通 SSH 会话。如果你从非交互式的自动化 shell 运行安装程序，Hermes 可以安装，但设置向导和可选的系统软件包提示可能会被跳过；这种情况下请使用下文的**非交互式 SSH 回退方案**。

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

安装程序会引导你完成一次交互式设置。请按提示出现的顺序逐一回答：

> [!IMPORTANT]
> **同一台机器上的 OpenClaw（不在本 playbook 范围内）：** 如果此前安装过 **OpenClaw** 之类的其他工具，Hermes 安装程序可能会询问你是否想从它那里**导入**或**迁移**。对于*本* playbook 的步骤，请回答 **`n`**（否），这样 Hermes 就不会引入 OpenClaw 的配置。混合迁移可能会让 Telegram 或网关的状态不一致；如果你已经误操作迁移了，建议在继续之前进行一次干净的重装（参见 Troubleshooting 标签页中的 **Start over from scratch**）。

1. **"Install ripgrep for faster file search ffmpeg for TTS voice messages? [Y/n]"** —— 按 **Enter** 接受默认值，同时安装这两个辅助工具。如果 `sudo` 要求输入密码，请输入你的 Linux 用户密码。如果你跳过这一步，或在没有终端的环境下运行，Hermes 仍可工作，但文件搜索会回退到较慢的工具，且 TTS 语音消息支持会受限。你可以稍后用 `sudo apt install -y ripgrep ffmpeg` 安装这些辅助工具。

2. **"How would you like to set up Hermes?"** —— 选择 **Quick setup**，以推荐的默认设置继续。

3. **"Select Provider"** —— 选择 **Custom endpoint (enter URL manually)**，这样就能把 Hermes 指向运行在你 DGX Spark 上的模型端点。

4. **"API base URL [e.g. https://api.example.com/v1]:"** —— *如果出现此提示*，请输入你本地模型服务的 URL。对于步骤 2 中的本地 vLLM 端点，使用 `http://localhost:8000/v1`。（取决于安装程序版本或先前的配置，当端点已被推断出来时，这个问题有时会被跳过 —— 请继续回答你实际看到的提示。）

5. **"API key [optional]"** —— 留空并按 **Enter**；本地模型的 vLLM 不需要密钥。

6. **模型选择** —— 安装程序会列出你本地端点所服务的模型（vLLM 通过 `/v1/models` 报告这些模型）。选择 `nvidia/Qwen3.6-35B-A3B-NVFP4`。

7. **"Context length in tokens [leave blank for auto-detect]:"** —— 按 **Enter**，让 Hermes 从所服务的模型自动检测上下文长度（该方案以 `--max-model-len 262144` 提供服务）。

8. **"Display name [Local (localhost:8000)]"** —— 按 **Enter** 接受建议的标签，或输入一个自定义名称，用于在 Hermes UI 中标识这个端点。

9. **"Connect a messaging platform? (Telegram, Discord, etc.)"** —— 选择 **Set up messaging now (recommended)**，在安装过程中配置网关。

10. **"Select platforms to configure:"** —— 选择 **Telegram**。本 playbook 余下的步骤以 Telegram 为例；相同的流程同样适用于其他受支持的网关。

    > [!TIP]
    > **如果 Telegram 相关问题被跳过：** 有些用户在选择 Telegram 后会立即看到 **“Setup complete”** 或 **“Messaging Platforms (Gateway) configuration complete!”**，而没有出现 token 或用户 ID 的提示。这通常意味着安装程序认为 Telegram 已经配置好了，或者存在先前的部分残留状态。请退出所有 TUI，重新加载你的 shell（`source ~/.bashrc`），然后运行 **`hermes gateway setup`** 并在其中选择 Telegram，以提供机器人 token 和允许的用户 ID。（如果 CLI 建议使用 `hermes setup gateway`，但该流程仍然跳过提示，请改用 **`hermes gateway setup`** —— 这是大多数用户反映能够完成完整 Telegram 重新配置的命令。）按照打印出的 **`sudo`** 命令行来注册网关服务（参见下文的 **Sudo 与 `hermes` 的 PATH**）。

11. **"Telegram bot token:"** —— 打开 Telegram，与 [@BotFather](https://t.me/BotFather) 开始对话，按照它的引导流程创建一个新机器人，然后把 BotFather 返回的 token 粘贴到此提示处。**提示：** 在与你 SSH 会话相同的机器上安装 [Telegram Desktop](https://desktop.telegram.org/)，可以让你**从 Telegram 复制 token 并粘贴到终端**，而不必从手机上重新输入。粘贴 token 时，终端不会回显任何字符 —— 这是正常的。按 **Enter** 提交；安装程序应当回应 `Telegram token saved`。

12. **"Allowed user IDs (comma-separated, leave empty for open access):"** —— 若要将机器人限制为特定的 Telegram 账号，请按屏幕上的说明查到你数字形式的 Telegram 用户 ID，然后输入一个或多个以逗号分隔的 ID。将此字段留空会允许任何能够访问到该机器人的人使用它，通常不建议这样做。

13. **"Use your user ID (\<your-id\>) as the home channel? [Y/n]:"** —— 按 **Enter** 接受。这会将你自己的 Telegram 账号指定为 Hermes 进行主动消息推送和定时投递时使用的默认频道。

14. **"Install the gateway as a systemd service? (runs in background, starts on boot) [Y/n]:"** —— 按 **Enter** 接受。网关将作为后台服务运行。

15. **"Choose how the gateway should run in the background:"** —— 如果你希望 Hermes 在开机时启动而无需交互式登录，请选择 **System service**。该服务仍会在你的用户账号下运行，以便读取你的 Hermes 配置；只有安装过程需要 `sudo`。如果你不是通过向导、而是在设置完成后再安装网关，请使用下文 **Sudo 与 `hermes` 的 PATH** 中所示的系统服务形式。

16. **"Launch hermes chat now? [Y/n]:"** —— 按 **Enter** 立即启动 Hermes TUI，端到端地验证安装。TUI 打开后，输入 `hello` 并按 **Enter**；agent 应当作出回应，确认模型端点与 Hermes 已正确连通。完成后，输入 `/exit` 离开聊天并返回你的 shell。退出时，Hermes 会打印出之后恢复这次对话所需的确切命令 —— `hermes --resume <sessionId>`。如果你想从中断处继续，请把它保存下来。

17. **"Would you like to install the gateway as a background service? [Y/n]:"** —— 按 **Enter** 接受。这会将网关最终确定为后台服务，使其在交互式 Hermes 会话之外仍然可用于处理消息平台的流量。

18. **重新加载你的 shell**，使 `hermes` 命令可用，然后验证该命令能够解析：

    ```bash
    source ~/.bashrc
    export PATH="$HOME/.local/bin:$PATH"
    which hermes
    ```

#### 非交互式 SSH 回退方案

如果安装程序打印出 **"Setup wizard skipped (no terminal available)"**，或者你正在通过非交互式 SSH 验证本 playbook，请用 Hermes 的 config 命令来配置本地 vLLM 端点：

```bash
export PATH="$HOME/.local/bin:$PATH"
hermes config set model.provider custom
hermes config set model.base_url http://localhost:8000/v1
hermes config set model.default nvidia/Qwen3.6-35B-A3B-NVFP4
hermes -z "Reply exactly HERMES_OK"
```

最后一条命令应当返回 `HERMES_OK`，确认 Hermes 无需打开 TUI 就能调用本地 vLLM 模型。

#### Sudo 与 `hermes` 的 PATH

`sudo` 以最小化环境运行，且通常**不会继承你的用户 `PATH`**，因此即使 `hermes` 在不加 `sudo` 时能正常工作，`sudo hermes …` 也可能因 **`hermes: command not found`** 而失败。请使用真实的二进制路径，例如：

```bash
export PATH="$HOME/.local/bin:$PATH"
HERMES_BIN="$(command -v hermes || printf '%s\n' "$HOME/.local/bin/hermes")"
sudo "$HERMES_BIN" uninstall
```

或者在安装程序打印的任何 `sudo` 命令中，把 `hermes` 替换为 `which hermes` 打印出的绝对路径。对于开机自启的 Linux 系统服务，当前的 Hermes CLI 支持：

```bash
sudo "$HERMES_BIN" gateway install --system --run-as-user "$USER"
```

#### 验证 Telegram 网关（步骤 3 之后）

配置完成后，确认网关单元处于活动状态且最近的日志看起来正常（将 `<hermes-gateway-unit>` 替换为安装程序打印出的**确切** `*.service` 名称 —— 通常会包含 `hermes` 和 `gateway`）：

```bash
systemctl list-units --type=service --all | grep -i hermes
systemctl --user list-units --type=service --all | grep -i hermes
sudo systemctl status <hermes-gateway-unit>
sudo journalctl -u <hermes-gateway-unit> -e --no-pager -n 50
```

如果 `systemctl status` 或 `systemctl --user status` 显示 **active (running)** 且日志中没有反复出现连接 Telegram 的错误，则说明服务端状态良好。如果日志显示连接 Telegram 主机出现 TLS 超时或 “connection refused”，请重新运行本页顶部的**出站 HTTPS** 检查。

## 步骤 4. 切换到其他模型（可选）

你在安装 Hermes 时已经配置了一个初始模型。若要在之后切换到另一个模型，请重启 vLLM 以服务新的模型句柄，然后将 Hermes 重新指向同一个本地端点。

1. 停止当前的 vLLM 容器（在其终端中按 Ctrl+C），并用新的模型句柄替换 `nvidia/Qwen3.6-35B-A3B-NVFP4` 后重新启动它。沿用 vLLM playbook 的 [Run Agent Ready Qwen3.6 35B Model with vLLM](https://build.nvidia.com/spark/vllm/agent-ready-qwen35b) 标签页中的同一条 `docker run` 调用，替换模型句柄（以及任何适用于新模型的标志）。

2. 启动 Hermes 的模型选择器：

    ```bash
    hermes model
    ```

3. 在 **"Select Provider"** 提示处，选择 **Custom endpoint (enter URL manually)**。

4. **如果你看到 “API base URL” 提示**，请输入与之前相同的本地 vLLM 端点：

    ```
    http://localhost:8000/v1
    ```

5. 当 Hermes 列出该端点所服务的模型时，选择你刚刚启动服务的那个模型。Hermes 会在后续会话中使用它。

如果你处于非交互式 SSH 会话中，请改用 config 命令切换模型：

```bash
hermes config set model.provider custom
hermes config set model.base_url http://localhost:8000/v1
hermes config set model.default <new-model-handle>
hermes -z "Reply exactly MODEL_OK"
```

## 步骤 5. 恢复之前的 Hermes 会话

若要接续之前的对话，请用 `--resume` 标志以及退出那次聊天时打印出的会话 ID 启动 Hermes：

```bash
hermes --resume <sessionId>
```

TUI 会重新打开并恢复之前的对话历史，可以继续进行后续提问。

## 步骤 6. 通过 Telegram 与 Hermes 对话

你在安装期间配置的 Telegram 网关已经作为后台服务运行，因此你无需终端会话即可从任意 Telegram 客户端访问 Hermes。

1. 打开 Telegram（手机或桌面端），按你通过 @BotFather 指定的用户名搜索你的机器人。

2. 打开与该机器人的聊天，并在首次接触时点击 **Start**（或发送 `/start`）。

3. 发送消息 **`hello`**。Hermes 会通过机器人回复，确认网关已与你的 DGX Spark 及底层模型连通。

    > [!NOTE]
    > 在 **`/start`** 之后，Telegram 可能会显示机器人发来的一条通用的 **“Unknown command”** 风格消息。对于只实现自由聊天的机器人来说，这可能是正常的。**请忽略该消息，照常发送 `hello`** —— 一旦网关和模型都正常，Hermes 就应当对普通文本作出回应。

从这里开始，你可以发送任何你通常会在 TUI 中输入的提示词 —— Hermes 会在你的 DGX Spark 上运行，并将响应流式传回 Telegram。

## 步骤 7. 更新 Hermes

若要将现有的 Hermes 安装升级到最新版本，请运行：

```bash
hermes update
```

该命令会拉取最新的 Hermes 版本、应用任何必需的依赖变更，并重启网关服务以使新版本生效。

## 步骤 8. 清理

> [!WARNING]
> 这会移除 Hermes 安装和网关服务。默认情况下，`~/.hermes/`（配置、对话历史和技能）会被保留，除非你在屏幕提示处选择执行完全卸载。

请从**交互式终端**运行清理。卸载程序可能会拒绝非交互式子进程，并且仍会要求你选择是保留数据还是执行完全卸载。若要彻底清除，请选择 **Full uninstall** 并在确认提示处输入 **`yes`**。

由于网关在步骤 15 中是作为 **System service** 安装的，请用 `sudo` 运行卸载，使其有权限移除系统级的 systemd 单元。如果 `sudo hermes uninstall` 因 **command not found** 失败，请使用与上文 **Sudo 与 `hermes` 的 PATH** 相同的**全路径**写法：

```bash
export PATH="$HOME/.local/bin:$PATH"
HERMES_BIN="$(command -v hermes || printf '%s\n' "$HOME/.local/bin/hermes")"
sudo "$HERMES_BIN" uninstall
```

按屏幕提示确认移除。卸载程序通常会：

- 停止并移除 systemd 网关服务。
- 移除 `hermes` 包装脚本，以及添加到你 shell 配置文件中的 PATH 条目。
- 删除 Hermes 应用目录。

**数据目录：** 取决于你在提示处选择的选项，**`~/.hermes`** 目录（配置、会话、技能）**并不总是会被** `uninstall` 移除。卸载后，请检查它是否仍然存在：

```bash
ls -la ~/.hermes
```

如果你打算**完全**移除，请手动删除它（此操作不可逆）：

```bash
rm -rf ~/.hermes
```

## 步骤 9. 后续步骤

1. **查看 agent 的推理过程。** 在 TUI 内运行 `/reasoning show`，让模型的中间推理与其响应一同显示出来。这对于跟踪 agent 在多步骤或复杂问题上的进展、以及调试意外的回答尤其有用。
2. **尝试一个多步骤任务以触发技能创建。** 例如，问问 agent 如何设置邮件 —— Hermes 会带着你完成配置，并且在完成像这样不那么简单的任务后，可能会自主持久化一个可复用的技能，让下次与邮件相关的请求更快完成。
3. **通过内置 cron 配置定时自动化任务。** 例如，让 Hermes 每天上网查一次某件商品的价格，并在价格跌破某个阈值时通过 Telegram 通知你。Hermes 会用其内置 cron 调度该任务，并通过你设置的消息网关投递每一次结果。

## 故障排查

| 现象 | 原因 | 解决办法 |
|---------|-------|-----|
| 安装后出现 `hermes: command not found` | 当前会话中未重新加载 shell 配置文件 | 运行 `source ~/.bashrc`（或 `source ~/.zshrc`）后重试。如果问题仍然存在，请打开一个新终端。 |
| `source ~/.bashrc` 在交互式终端中有效，但脚本化的 SSH 命令中仍然找不到 `hermes` | 许多 Ubuntu 的 `.bashrc` 文件会在安装程序添加的 PATH 行运行之前，就为非交互式 shell 提前返回 | 在自动化中，请在调用 `hermes` 之前运行 `export PATH="$HOME/.local/bin:$PATH"`，或直接调用 `~/.local/bin/hermes`。 |
| 在网关安装、卸载或打印出的 `sudo hermes …` 步骤中出现 `sudo: hermes: command not found` | `sudo` 会重置 `PATH`，看不到用户级的 `hermes` 垫片脚本 | 以你的普通用户身份运行 `which hermes`，然后用 sudo 调用该路径，例如 `sudo "$(which hermes)" uninstall` 或 `sudo /full/path/from/which/hermes gateway …`。 |
| 安装程序打印出 **"Setup wizard skipped (no terminal available)"** | 安装程序是从非交互式 shell、CI 任务或没有可用 TTY 的 SSH 命令启动的 | 要么在交互式终端中重新运行 `hermes setup`，要么直接配置端点：`hermes config set model.provider custom`、`hermes config set model.base_url http://localhost:8000/v1` 和 `hermes config set model.default nvidia/Qwen3.6-35B-A3B-NVFP4`。 |
| 安装程序无法安装 `ripgrep` / `ffmpeg`，或打印出 `Non-interactive mode and no terminal available` | 可选辅助工具的安装需要 `sudo`，但当前 shell 无法提示输入密码 | 在交互式终端中用 `sudo apt install -y ripgrep ffmpeg` 手动安装。没有它们 Hermes 仍可运行，但文件搜索会较慢，且 TTS 语音消息支持受限。 |
| 浏览器工具显示 `system dependency not met`，或 Playwright Chromium 安装失败 | Playwright 需要通过 `sudo` 安装 Linux 共享库，而安装程序无法获得 sudo 权限 | 核心聊天和 Telegram 仍可工作。若要启用浏览器工具，请在交互式终端中运行 `cd ~/.hermes/hermes-agent && npx playwright install --with-deps chromium` 并输入你的 sudo 密码。 |
| 你希望网关在开机时启动，但 `hermes gateway install` 创建的是用户服务 | 除非提供 `--system`，否则当前的 Hermes 默认安装用户服务 | 使用 `sudo "$(which hermes)" gateway install --system --run-as-user "$USER"`（如有需要，可将 `$(which hermes)` 替换为 `~/.local/bin/hermes`）。 |
| `hermes uninstall --yes` 提示需要交互式终端，或仍然提示选择卸载选项 | 卸载程序对数据删除做了保护，需要真实的 TTY 进行确认 | 直接在你的终端中运行它，或通过 SSH 分配一个 TTY（`ssh -t <spark> 'hermes uninstall'`）。若要彻底清除，请选择 **Full uninstall** 并在提示时输入 `yes`。 |
| Telegram 机器人始终没有回应；网关日志显示连接 `api.telegram.org` 超时或 TLS 错误 | 当前网络上**到 Telegram 的出站 HTTPS 被屏蔽**（在受限的企业局域网中很常见） | 在 Spark 上运行 `curl -sS --connect-timeout 10 -o /dev/null -w "HTTP %{http_code}\n" https://api.telegram.org/`（参见操作步骤）。如果它卡住或失败，请将 Spark 接入一个允许 Telegram 的网络，**或者**请 IT 放行到 **`api.telegram.org`** 的 HTTPS。在机器人保持沉默的同时，本 playbook 的其余部分仍可在本地成功完成。 |
| 安装程序询问是否进行 **OpenClaw 导入 / 迁移** | 之前安装过另一个 agent 框架 | 对于本 playbook，请回答 **`n`**。OpenClaw 迁移在这里**不在范围内**，可能会让网关或 Telegram 状态变得混乱。如果你已经误操作迁移了，请使用下文的 **Start over from scratch**。 |
| 安装期间选择 **Telegram** 后立即显示 “setup complete”，而没有 token / 用户 ID 提示 | 残留或不完整的 Hermes 网关配置；安装程序短路 | 在 `source ~/.bashrc` 之后，运行 **`hermes gateway setup`**，选择 Telegram，并完成 token 和允许用户的步骤。使用打印出的命令安装或重启 systemd 服务（如有需要，加上 `sudo "$(which hermes)"`）。 |
| 在 Telegram 中 `/start` 显示 “Unknown command”（或类似消息） | 机器人没有定义自定义的 `/start` 处理器 | 在 `/start` 之后发送一条普通文本消息，例如 **`hello`**。Hermes 会对会话式文本作出回应，不一定响应斜杠命令。 |
| `uninstall` 之后 `~/.hermes` 仍然存在 | 除非你明确移除，否则卸载程序会保留数据 | 在某些流程中这是预期的。仅当你想彻底清除时才手动移除：`rm -rf ~/.hermes`（参见 **Start over from scratch**）。 |
| Hermes 安装程序在模型选择提示处无法列出任何模型 | vLLM 尚未运行，或仍在加载检查点 | 在另一个终端中对端点做一次完整性检查：`curl http://localhost:8000/v1/models` 应当返回一个包含 `nvidia/Qwen3.6-35B-A3B-NVFP4` 的 `"data"` 数组。如果它为空或无法访问，请确认 vLLM 容器已启动并完成加载（在其终端中观察是否出现 `Application startup complete`），然后重新运行 Hermes 安装程序。 |
| Hermes 连接 `http://localhost:8000/v1` 时出现 `Connection refused` | vLLM 服务未运行、仍在加载，或端口错误 | 确认 vLLM 容器已启动并监听 `8000`（先 `docker ps`，再 `curl http://localhost:8000/v1/models`）。如果它已退出，请重新启动（参见操作步骤 —— 步骤 2）。 |
| 粘贴 Telegram 机器人 token 时屏幕上什么都不显示 | 预期行为 —— 安装程序出于安全考虑隐藏了 token 字符 | 粘贴 token，然后按 **Enter**。安装程序应当回应 `Telegram token saved`。 |
| 当你发送 `hello` 时 Telegram 机器人没有回复 | 网关服务未运行、你的账号不在允许的用户 ID 列表中，**或到 Telegram 的出站 HTTPS 被屏蔽** | (1) 从 Spark 确认到 Telegram 的 HTTPS（操作步骤 —— 网络检查）。(2) 用 `systemctl list-units --type=service --all` 列出 Hermes 单元，按名称定位网关单元，然后执行 `sudo systemctl status <hermes-gateway-unit>` 和 `sudo journalctl -u <hermes-gateway-unit> -e --no-pager -n 80`。(3) 如果日志显示可以访问 Telegram 但消息被忽略，请通过 `hermes gateway setup` 或 [Hermes 消息网关文档](https://hermes-agent.nousresearch.com/docs/user-guide/messaging) 确认你的数字用户 ID 在允许列表中。 |
| 内存不足（OOM）或推理非常缓慢 | 所服务的模型对于可用 GPU 显存来说太大，或有其他 GPU 工作负载在竞争资源 | 用 `nvidia-smi` 检查使用情况，通过关闭其他工作负载释放 GPU 显存，或用更低的 `--gpu-memory-utilization` / `--max-model-len`（或更小的模型句柄）重新启动 vLLM，并通过 `hermes model` 把 Hermes 重新指向它。 |
| `hermes update` 失败，或网关没有重启 | 网关服务仍然绑定到旧版本，或系统服务安装时权限不足 | 如果网关是作为 **System service** 安装的，而普通的 `hermes update` 无法重启它，请重新运行 `sudo "$(which hermes)" update`。如果服务卡住，请手动重启它：`sudo systemctl restart <hermes-gateway-unit>`。 |
| 无法恢复之前的会话 | `<sessionId>` 值缺失或错误 | 使用 `hermes --resume <sessionId>`，并填入你 `/exit` 那次聊天时 Hermes 打印出的确切 ID。如果 ID 丢失了，请用 `hermes`（省略 `--resume`）开始一个新会话。 |

> [!NOTE]
> DGX Spark 采用统一内存架构（UMA），可以让 GPU 与 CPU 之间动态共享内存。
> 由于许多应用仍在更新以充分利用 UMA，即使在 DGX Spark 的内存容量之内，你也可能遇到内存问题。如果发生这种情况，请使用以下命令手动清空缓冲区缓存：
```bash
sudo sh -c 'sync; echo 3 > /proc/sys/vm/drop_caches'
```

如需了解最新的已知问题，请查阅 [DGX Spark 用户指南](https://docs.nvidia.com/dgx/dgx-spark/known-issues.html)。
