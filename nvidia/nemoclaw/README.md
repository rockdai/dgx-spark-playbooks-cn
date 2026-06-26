# 使用本地 LLM 运行 NemoClaw

> 在 DGX Spark 上使用 NemoClaw 和 vLLM，在安全沙箱中构建你的第一个本地 AI 助手，并可选集成 Telegram。


## 目录

- [概述](#overview)
  - [你将完成什么](#what-youll-accomplish)
  - [通知和免责声明](#notice-and-disclaimers)
  - [隔离层 (OpenShell)](#isolation-layers-openshell)
  - [开始之前需要了解什么](#what-to-know-before-starting)
  - [先决条件](#prerequisites)
  - [开始前做好准备](#have-ready-before-you-begin)
  - [附属文件](#ancillary-files)
  - [时间与风险](#time-and-risk)
- [操作步骤](#instructions)
  - [步骤 1. 安装 NemoClaw](#step-1-install-nemoclaw)
  - [步骤 2. NemoClaw 引导设置](#step-2-nemoclaw-onboarding)
  - [步骤 3. 与 OpenClaw 交互](#step-3-interact-with-openclaw)
  - [步骤 4. 在沙箱中启用 Brave Search](#step-4-enable-brave-search-in-sandbox)
  - [步骤 5. 设置消息渠道（以 Telegram Bot 为例）](#step-5-set-up-messaging-channel-telegram-bot-as-an-example)
  - [步骤 6. 设置 NemoClaw Agents](#step-6-set-up-nemoclaw-agents)
  - [步骤 7. 停止服务](#step-7-stop-services)
  - [步骤 8. 卸载 NemoClaw](#step-8-uninstall-nemoclaw)
- [故障排查](#troubleshooting)

---

## 概述

## 基本思路

**NVIDIA NemoClaw** 是一个开源参考堆栈，可更安全地简化 OpenClaw 始终在线助手的运行。它会安装 **NVIDIA OpenShell** 运行时（一个专为以额外安全性执行 agent 而设计的环境），并将其连接到 DGX Spark 上的 **本地 vLLM** 推理。单个安装程序命令（`nemoclaw.sh`）即可处理 Node.js、OpenShell 和 NemoClaw CLI；随后 **onboard** 向导会创建一个沙箱化 agent、可选的 **Brave Search**、可选的 **消息渠道**（Telegram、Discord 或 Slack），以及带有网络预设的 **策略层**。

在本剧本结束时，你将在 OpenShell 沙箱内拥有一个可工作的 AI agent，可通过 **Web UI** 或 **终端 TUI** 访问，推理路由到 Spark 上的 **本地 vLLM**。你还可以选择性地添加 **Telegram**（借助 **cloudflared** 提供公网 webhook URL）以及可选的 **网络搜索** —— 所有这些都不会将你的主机文件系统或网络暴露到超出你在策略中明确允许的范围。

### 你将完成什么

- 使用单个命令（`nemoclaw.sh`）安装 **NemoClaw**，它会按需拉取 Node.js、OpenShell 和 CLI
- 使用推荐设置完成 `nemoclaw onboard` 向导
- 打开 **Web UI** 与 agent 交互
- 在引导设置后可选启用 **Brave Search** 或 **Telegram**
- 完成后使用文档中记录的 `uninstall.sh` 标志进行 **清理和卸载**

### 通知和免责声明

以下部分描述了运行此演示时的安全性、风险以及你的责任。

#### 快速启动安全检查

**仅使用干净的环境。** 在没有个人数据、机密信息或敏感凭据的全新设备或虚拟机上运行此演示。像沙箱一样将其隔离。

通过安装此演示，你即接受对所有第三方组件的责任，包括审查它们的许可证、条款和安全状况。请在安装或使用之前阅读并接受。

#### 你将获得什么

此体验仅以"按原样"提供，仅用于演示目的 —— 不提供任何保证，也不做任何担保。这是一个演示，而不是生产就绪的解决方案。你需要为你的环境和用例实施适当的安全控制。

#### AI agent 的主要风险

- **数据泄露** —— agent 访问的任何材料都可能被暴露、泄露或窃取。
- **恶意代码执行** —— agent 或其连接的工具可能会使你的系统遭受恶意代码或网络攻击。
- **意外操作** —— agent 可能会在未经明确批准的情况下修改或删除文件、发送消息或访问服务。
- **提示词注入与操纵** —— 外部输入或连接的内容可能以意想不到的方式劫持 agent 的行为。

#### 参与者确认

通过参与此演示，你确认你对你的配置以及你连接的任何数据、账户和工具承担全部责任。在法律允许的最大范围内，对于因你配置或使用 NemoClaw 演示材料（包括 OpenClaw 或任何连接的工具或服务）而导致的任何数据丢失、设备损坏、安全事件或其他损害，NVIDIA 概不负责。

### 隔离层 (OpenShell)

| 层      | 它保护什么                                   | 何时生效             |
|------------|----------------------------------------------------|-----------------------------|
| 文件系统 | 防止在允许的路径之外进行读/写。       | 在沙箱创建时锁定。 |
| 网络    | 阻止未经授权的出站连接。          | 运行时可热重载。  |
| 进程    | 阻止权限升级和危险的系统调用。| 在沙箱创建时锁定。 |
| 推理  | 将模型 API 调用重新路由到受控后端。   | 运行时可热重载。  |

### 开始之前需要了解什么

- Linux 终端和 SSH 的基本使用
- 熟悉 Docker（权限、`docker run`、可选的 `docker` 组成员资格）
- 了解上述安全和风险部分

### 先决条件

**硬件：**

- 配备键盘和显示器或具有 SSH 访问权限的 DGX Spark (GB10)

**软件：**

- 全新安装并更新到最新的 DGX OS

开始之前验证你的系统：

```bash
head -n 2 /etc/os-release
nvidia-smi
docker info --format '{{.ServerVersion}}'
```

预期：Ubuntu 24.04、NVIDIA GB10 GPU、Docker 28.x+。

### 开始前做好准备

| 项目 | 何时需要 |
|------|------------------|
| **Telegram bot token**（可选） | 使用 [@BotFather](https://t.me/BotFather)（`/newbot`）创建。你可以在 **引导设置**（步骤 3）期间粘贴它，**或者** 稍后运行 **`nemoclaw <sandbox> channels add telegram`** 时粘贴。 |
| **Brave Search API key**（可选） | 如果你在引导设置期间或通过 **`nemoclaw onboard --fresh --gpu`** 启用网络搜索，则从 [Brave Search API](https://brave.com/search/api/) 获取（`--fresh` 会重新提示每一个引导设置问题，包括你之前跳过的功能；不带 `--fresh` 时向导会恢复上一次会话且不会重新提示）。 |

### 附属文件

所有必需的资源均由 NemoClaw 安装程序处理。无需手动克隆。

### 时间与风险

- **预计时间：** 首次完整流程大约 30–60 分钟（安装、引导设置、模型下载，具体取决于你的选择和网络）。可选的 Brave、Telegram 和 cloudflared 步骤如果在第二次会话中进行会增加时间。
- **风险级别：** 中 —— 你正在沙箱中运行一个 AI agent；隔离可以降低风险但不能消除风险。请使用干净的环境，不要连接敏感数据或生产账户。
- **最后更新：** 06/12/2026
  - 将本地推理后端切换为 vLLM（已适配 agent 的 Qwen3.6 35B 方案）
  - 将 nemoclaw 安装程序固定到 v0.0.55，即最新稳定版本

## 操作步骤

## 第 1 阶段：安装并运行 NemoClaw

### 步骤 1. 安装 NemoClaw

这个命令可以处理所有事情：安装 Node.js（如果需要）、安装 OpenShell、克隆固定的 NemoClaw **v0.0.55** 版本（通过 `NEMOCLAW_INSTALL_TAG` 设置；v0.0.55 是 NemoClaw 团队当前推荐的最稳定版本）、构建 CLI，并运行 onboard 向导来创建沙箱。

```bash
curl -fsSL https://www.nvidia.com/nemoclaw.sh | NEMOCLAW_INSTALL_TAG=v0.0.55 bash
```

安装向导将引导你完成设置：

1. **接受 NemoClaw 许可证** —— 输入 `yes` 确认
2. **运行快速安装（express install）** —— 输入 `Y` 确认

安装程序需要 **Node.js 22.16+**（如果缺失会自动安装）。它会引导你完成 Node.js、NemoClaw CLI 和引导设置（Onboarding）各阶段。引导设置配置的更多细节请参见下一步。

### 步骤 2. NemoClaw 引导设置

> [!NOTE]
> 如果你在步骤 1 中选择了 **快速安装（express install）**，所有设置都会以推荐默认值自动配置。请跳到步骤 3。

在自定义设置过程中，onboard 向导会引导你完成：

1. **配置推理** —— 选择 **`Local vLLM`**（默认值），在你的 Spark 上设置本地推理。
2. **vLLM 模型** —— 选择想要的推理模型。如果本地没有模型，安装程序会自动下载 **`nvidia/Qwen3.6-35B-A3B-NVFP4`**。
3. **沙箱名称** —— 选择一个名称（例如 my-assistant）。每个沙箱都需要一个唯一的名称。
4. **应用此配置** —— 输入 `Y` 确认设置本地推理。
5. **启用 Brave Web Search** —— 可选。如果启用，请在提示时粘贴 [Brave Search API](https://brave.com/search/api/) key。
6. **消息渠道** —— 可选。如果启用，请选择想要的 bot（`telegram`、`discord` 或 `slack`），并在提示时粘贴你的 bot token。
7. **策略预设** —— 选择想要的策略层（推荐 `Balanced`），并在提示时接受/编辑建议的预设（按 **Enter** 确认）。

完成后你将看到如下输出：

```text
──────────────────────────────────────────────────
Sandbox      my-assistant (Landlock + seccomp + netns)
Model        <your-selected-model> (Local vLLM)
──────────────────────────────────────────────────
Run:         nemoclaw my-assistant connect
Status:      nemoclaw my-assistant status
Logs:        nemoclaw my-assistant logs --follow
──────────────────────────────────────────────────
```

> [!NOTE]
> - 如果安装后找不到 `nemoclaw`，请运行 `source ~/.bashrc` 重新加载你的 shell 路径。
> - 完成 **引导设置（Onboarding）** 所需的时间可能有所不同，具体取决于模型选择和网络速度。

NemoClaw 引导设置可以重复运行，为相互独立的用例创建多个沙箱。使用 `--name <new-name>` 在任何现有沙箱旁边创建一个额外的沙箱：

```bash
nemoclaw onboard --gpu --name <new-name>
```

> [!IMPORTANT]
> 使用 `--name <new-name>` 创建额外的沙箱而不影响现有的沙箱。`--fresh` 标志是一个破坏性选项，专门用于启动一个全新的 onboard 会话 —— 如果同名沙箱已经存在，`--fresh` 会 **销毁并重新创建它**。只有当你打算清除并重新引导时才使用 `--fresh`（参见步骤 4 中需要重新提示的示例）。

### 步骤 3. 与 OpenClaw 交互

有两种方式与你的 OpenClaw 交互：Web UI 或终端 UI。

#### 选项 1. Web UI

获取完整的仪表板 URL（包含自动分配的端口和 token）：

```bash
nemoclaw my-assistant dashboard-url --quiet
```

这会打印一个类似 `http://127.0.0.1:18790/#token=<token>` 的 URL。端口是自动分配的（通常是 18789 或 18790），不同安装之间可能不同。

**如果直接在 Spark 上访问 Web UI**（已连接键盘和显示器），请在浏览器中打开仪表板 URL。

**如果从远程计算机访问 Web UI**，你需要设置一个 SSH 隧道。

首先，记下上面仪表板 URL 中的端口号（例如 `18790`）。

找到你的 Spark 的 IP 地址：

```bash
hostname -I | awk '{print $1}'
```

这会打印主 IP 地址（例如 `192.168.1.42`）。你也可以在 Spark 桌面上的 **Settings > Wi-Fi** 或 **Settings > Network** 中找到它，或者查看路由器的已连接设备列表。

从你的远程计算机，使用上面的端口创建一个 SSH 隧道（替换 `<port>` 和 `<your-spark-ip>`）：

```bash
ssh -L <port>:127.0.0.1:<port> <your-user>@<your-spark-ip>
```

现在在你的远程计算机的浏览器中打开仪表板 URL。

> [!IMPORTANT]
> 使用 `127.0.0.1`，而不是 `localhost` —— 网关来源检查需要完全匹配。

> [!NOTE]
> 如果 Web UI 加载失败且端口转发可能已失效，请通过 `nemoclaw my-assistant dashboard-url --quiet` 获取端口并重置：
> ```bash
> openshell forward stop <port> my-assistant || true
> openshell forward start <port> my-assistant --background
> ```

#### 选项 2. 终端 UI

连接到沙箱：

```bash
nemoclaw my-assistant connect
```

然后在沙箱内启动终端 UI：

```bash
openclaw tui
```

你可以开始与 OpenClaw 聊天。按 **Ctrl+C** 退出终端 UI。

退出沙箱：

```bash
exit
```

---

## 第 2 阶段：修改 NemoClaw 策略

### 步骤 4. 在沙箱中启用 Brave Search

要将 Brave Web Search 添加到现有沙箱，请使用 `--fresh` 重新运行 onboard 向导，以启动一个会重新提示所有选项（包括之前跳过的功能）的新会话：

```bash
nemoclaw onboard --fresh --gpu
```

> [!NOTE]
> 不带 `--fresh` 时，onboard 向导会 **恢复** 上一次会话，并且不会为你已经跳过的功能重新提示。

当你到达 **Enable Brave Web Search** 时，选择 **yes** 并粘贴来自 [Brave Search API](https://brave.com/search/api/) 控制台的 key。在提示时确认相同的沙箱名称和推理选择。向导将 **重建** 沙箱以使 key 生效。

> [!NOTE]
> 或者，在运行安装程序之前在你的环境中设置 `BRAVE_API_KEY`，这样 Brave Search 将在引导设置期间自动启用。

要确认网络搜索已启用，请重新启动你的 OpenClaw WebUI 或终端 UI。向 agent 询问需要 **实时网络搜索** 的内容。如果请求仍然失败，请重新检查 **`policy-list`** 并重新查看 onboard 输出中的 Brave/API 错误。

### 步骤 5. 设置消息渠道（以 Telegram Bot 为例）

这些步骤适用于你的沙箱已存在但 **从未配置过 Telegram**（你在步骤 2 中跳过了 **消息渠道**，或者沙箱策略层从未包含 Telegram 相关的出口）的情况。将 `<sandbox-name>` 替换为你的沙箱（例如 `my-assistant`）。

#### 1. 创建一个 Telegram bot

在 Telegram 中，打开 [@BotFather](https://t.me/BotFather)，发送 `/newbot`，然后完成提示。复制 BotFather 返回的 **bot token**，并为下一步准备好它。

#### 2. 将 Telegram 注册到 NemoClaw 并重建沙箱

```bash
nemoclaw <sandbox-name> channels add telegram
```

在提示时粘贴 token。NemoClaw 会持久化凭据并 **重建** 沙箱，以便 OpenClaw 可以将 Telegram 用作消息渠道。

#### 3.（如有需要）在沙箱策略中允许 Telegram 出口

如果在注册渠道后消息因网络或策略错误而失败，请检查预设，并在你的层级遗漏时添加 Telegram 相关的出口：

```bash
nemoclaw <sandbox-name> policy-list
nemoclaw <sandbox-name> policy-add telegram
```

预设名称遵循你所选的层级；请对照 [Network policies](https://docs.nvidia.com/nemoclaw/latest/reference/network-policies.html) 进行确认。

#### 4. 验证 Telegram

Telegram 使用长轮询（`getUpdates`）—— 沙箱会主动从 Telegram 服务器拉取消息。**Telegram 工作不需要公网 URL 或 cloudflared 隧道。**

打开 Telegram，找到你的 bot，然后发送一条消息。bot 应该会将流量转发到你 NemoClaw 沙箱中的 agent 并回复。

> [!NOTE]
> 首次响应可能需要更长时间，具体取决于模型大小（30B 模型在几秒内响应；更大的模型在首次推理时可能需要更长时间）。

> [!NOTE]
> 如果 bot 没有响应：
> - 运行 `nemoclaw <sandbox-name> status` 确认沙箱正在运行且推理健康。
> - 运行 `nemoclaw <sandbox-name> logs --follow` 并查找 Telegram 相关的错误。
> - 如果缺少 Telegram 出口，运行 `nemoclaw <sandbox-name> policy-add` 并选择 `telegram`。
> - 如果从未注册过该渠道，运行 `nemoclaw <sandbox-name> channels add telegram`。

> [!NOTE]
> `channels add telegram` 向导还会提示输入一个可选的 **Telegram User ID**，用于限制谁可以私信该 bot。在 Telegram 上向 [@userinfobot](https://t.me/userinfobot) 发送 `/start` 以获取你的数字用户 ID。如果你跳过此项，bot 在响应消息之前将要求设备配对（基于终端的验证码确认）。

> [!NOTE]
> 有关限制哪些 Telegram 聊天可以与 agent 交互的详细信息，请参阅 [NemoClaw Telegram bridge 文档](https://docs.nvidia.com/nemoclaw/latest/deployment/set-up-telegram-bridge.html)。

#### 5.（可选）安装 cloudflared 以远程访问 Web UI

cloudflared 隧道为 **Web UI 仪表板提供一个公网 URL** —— 它与 Telegram 消息无关。

安装 cloudflared（DGX Spark 是 arm64）：

```bash
curl -L --output cloudflared.deb \
  https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
sudo dpkg -i cloudflared.deb
```

启动隧道：

```bash
nemoclaw tunnel start
```

验证：

```bash
nemoclaw status
```

你应当看到 `● cloudflared` 以及一个 `trycloudflare.com` 公网 URL。

---

## 第 3 阶段：设置 NemoClaw Agent

### 步骤 6. 设置 NemoClaw Agents

设置 NemoClaw Agents 通常需要三个步骤：配置 NemoClaw 安全策略、运行 Agent 工作流提示词、为你自己的用例个性化该工作流。

可以查看这些 [Example NemoClaw Agents](https://build.nvidia.com/spark/nemoclaw-applications) 作为参考。考虑在 [DGX Spark Developer Forum](https://forums.developer.nvidia.com/c/accelerated-computing/dgx-spark-gb10) 与社区分享你的 NemoClaw agent 设置。

---

## 第 4 阶段：清理和卸载

### 步骤 7. 停止服务

停止 cloudflared 隧道：

```bash
nemoclaw tunnel stop
```

停止端口转发：

```bash
openshell forward list          # find active forwards and their ports
openshell forward stop <port>   # stop the dashboard forward (use the port shown above)
```

### 步骤 8. 卸载 NemoClaw

NemoClaw CLI 包含一个内置的卸载程序。它会删除所有沙箱、OpenShell 网关、Docker 容器/镜像/卷、CLI 和所有状态文件。Docker、Node.js、npm 和 vLLM 容器镜像会被保留。

```bash
nemoclaw uninstall --yes
```

要删除包括已下载模型权重在内的所有内容：

```bash
nemoclaw uninstall --yes --delete-models
```

**卸载程序标志：**

| 标志 | 作用 |
|------|--------|
| `--yes` | 跳过确认提示 |
| `--keep-openshell` | 将 `openshell` 二进制文件保留在原处 |
| `--delete-models` | 同时删除 NemoClaw 拉取的模型权重 |

> [!NOTE]
> 如果 `nemoclaw` CLI 不可用（例如安装中途失败），可以使用远程卸载程序作为备选方案：
> ```bash
> curl -fsSL https://raw.githubusercontent.com/NVIDIA/NemoClaw/refs/heads/main/uninstall.sh | bash -s -- --yes
> ```

卸载程序运行 6 个步骤：
1. 停止 NemoClaw 帮助程序服务和端口转发进程
2. 删除所有 OpenShell 沙箱、NemoClaw 网关和 provider
3. 删除全局 `nemoclaw` npm 包
4. 删除 NemoClaw/OpenShell 的 Docker 容器、镜像和卷
5. 删除已下载的模型权重（仅在使用 `--delete-models` 时）
6. 删除状态目录（`~/.nemoclaw`、`~/.config/openshell`、`~/.config/nemoclaw`）和 OpenShell 二进制文件

> [!NOTE]
> 如果你在 `~/.nemoclaw/source` 有一份想保留的本地克隆，请在运行卸载程序之前将其移动或备份 —— 它会在步骤 6 的状态清理中被删除。

## 有用的命令

| 命令 | 描述 |
|---------|-------------|
| `nemoclaw my-assistant connect` | 进入沙箱的 shell |
| `nemoclaw my-assistant status` | 显示沙箱状态和推理配置 |
| `nemoclaw my-assistant logs --follow` | 实时流式传输沙箱日志 |
| `nemoclaw list` | 列出所有已注册的沙箱 |
| `nemoclaw tunnel start` | 启动 cloudflared 隧道（用于远程访问 Web UI 的公网 URL） |
| `nemoclaw tunnel stop` | 停止 cloudflared 隧道 |
| `nemoclaw my-assistant dashboard-url --quiet` | 打印完整的带 token 的 Web UI URL（包含自动分配的端口） |
| `openshell term` | 打开主机上的监控 TUI |
| `openshell forward list` | 列出活动的端口转发 |
| `nemoclaw uninstall --yes` | 删除 NemoClaw（保留 Docker、Node.js、vLLM 镜像） |
| `nemoclaw uninstall --yes --delete-models` | 删除 NemoClaw 和已下载的模型权重 |

## 故障排查

| 现象 | 原因 | 解决办法 |
|---------|-------|-----|
| 安装后出现 `nemoclaw: command not found` | Shell PATH 未更新 | 运行 `source ~/.bashrc`（zsh 用 `source ~/.zshrc`），或打开一个新的终端窗口。 |
| 安装程序因 Node.js 版本错误而失败 | Node.js 版本低于 22.16 | 安装 Node.js 22.16+：`curl -fsSL https://deb.nodesource.com/setup_22.x \| sudo -E bash - && sudo apt-get install -y nodejs`，然后重新运行安装程序。 |
| npm 安装因 `EACCES` 权限错误而失败 | npm 全局目录不可写 | `mkdir -p ~/.npm-global && npm config set prefix ~/.npm-global && export PATH=~/.npm-global/bin:$PATH`，然后重新运行安装程序。将 `export` 行添加到 `~/.bashrc` 以使其永久生效。 |
| Docker 权限被拒绝 | 用户不在 docker 组中 | `sudo usermod -aG docker $USER`，然后注销并重新登录。 |
| 网关因 cgroup /"Failed to start ContainerManager"错误而失败 | 较旧的 OpenShell 或 Docker 仍然为网关使用 **私有** cgroup 命名空间，导致 kubelet 无法看到 cgroup v2 控制器 | 首先 **升级 OpenShell**（重新运行第 1 阶段的 `nemoclaw.sh` 安装，以获得一个会在网关容器上设置 host cgroupns 的构建版本）。如果仍然失败，请运行下方的 [daemon.json cgroup 修复](#daemonjson-cgroup-fix) 将 Docker 的默认值强制为 host 模式，然后运行 `sudo systemctl restart docker`。 |
| 网关失败并显示 "port 8080 is held by container..." | 另一个 OpenShell 网关或容器正在使用端口 8080 | 停止冲突的容器：`openshell gateway destroy -g <old-gateway-name>` 或 `docker stop <container-name> && docker rm <container-name>`，然后重试 `nemoclaw onboard`。 |
| 沙箱创建失败 | 网关状态过时或 DNS 未传播 | 运行 `openshell gateway destroy && openshell gateway start`，然后重新运行安装程序或 `nemoclaw onboard`。 |
| CoreDNS 崩溃循环 | 某些 DGX Spark 配置上的已知问题 | 重新运行 NemoClaw 安装程序（`curl -fsSL https://www.nvidia.com/nemoclaw.sh \| bash`），它包含 CoreDNS 修复。如果问题仍然存在，请参阅 [NemoClaw troubleshooting](https://docs.nvidia.com/nemoclaw/latest/reference/troubleshooting.html)。 |
| 引导设置期间出现 "No GPU detected" | DGX Spark GB10 以不同方式报告统一内存 | 在 DGX Spark 上属于预期。向导仍然可以工作并使用 vLLM 进行推理。 |
| 推理超时或挂起 | vLLM 未运行或无法访问 | 检查 vLLM 服务器：`curl http://127.0.0.1:8000/v1/models` 应当列出 `nvidia/Qwen3.6-35B-A3B-NVFP4`。如果挂起，模型可能仍在加载 —— 等待 `Application startup complete`。然后检查 `nemoclaw my-assistant status` 中的 Inference 健康行。 |
| agent 没有响应或非常慢 | 首次响应可能很慢，尤其是较大的模型 | 响应时间取决于模型大小（30B：几秒，120B：30–90 秒）。验证推理路由：`nemoclaw my-assistant status`。 |
| 端口 18789 已被占用 | 另一个进程绑定到该端口 | `lsof -i :18789`，然后 `kill <PID>`。如有需要，使用 `kill -9 <PID>` 强制终止。 |
| Web UI 端口转发失效或仪表板无法访问 | 端口转发未激活 | `openshell forward stop 18789 my-assistant`，然后 `openshell forward start 18789 my-assistant --background`。 |
| Web UI 显示 `origin not allowed` | 通过 `localhost` 而不是 `127.0.0.1` 访问 | 在浏览器中使用 `http://127.0.0.1:18789/#token=...`。网关来源检查需要完全匹配 `127.0.0.1`。 |
| Telegram bridge 未启动 | Telegram 渠道未注册到沙箱 | 运行 `nemoclaw <sandbox-name> channels add telegram` 注册 bot token 并重建沙箱。使用 `nemoclaw <sandbox-name> status` 验证。 |
| 沙箱重建后 Telegram 停止响应 | 重建后 Telegram 长轮询会话失效 | 运行 `nemoclaw <sandbox-name> recover` 重启网关。如果仍然无响应，运行 `nemoclaw <sandbox-name> channels add telegram` 重新注册并重建。 |
| Telegram bot 收到消息但不回复 | 未添加 Telegram 网络出口策略 | 运行 `nemoclaw <sandbox-name> policy-add`，选择 `telegram`，然后确认。这是一次热重载 —— 无需重建。 |

#### daemon.json cgroup fix

将此脚本用作上面 cgroup /"Failed to start ContainerManager" 行的备选方案。它会校验任何现有的 `/etc/docker/daemon.json`，写入一个 `.bak` 备份，将 `default-cgroupns-mode` 设置为 `host`，并原子地替换该文件。如果任何环节失败，它会以非零状态退出并在 stderr 上输出错误，同时保持原始 `daemon.json` 不变。

```bash
sudo python3 - <<'PY'
import json, os, shutil, sys, tempfile

path = '/etc/docker/daemon.json'
try:
    if os.path.exists(path):
        with open(path) as f:
            data = json.load(f)
        if not isinstance(data, dict):
            raise ValueError(f'{path} is not a JSON object')
    else:
        data = {}
except (json.JSONDecodeError, ValueError, OSError) as e:
    print(f'error: failed to read {path}: {e}', file=sys.stderr)
    sys.exit(1)

if os.path.exists(path):
    try:
        shutil.copy2(path, path + '.bak')
    except OSError as e:
        print(f'error: failed to back up {path}: {e}', file=sys.stderr)
        sys.exit(1)

data['default-cgroupns-mode'] = 'host'

target_dir = os.path.dirname(path) or '/'
fd, tmp = tempfile.mkstemp(prefix='daemon.json.', dir=target_dir)
try:
    with os.fdopen(fd, 'w') as f:
        json.dump(data, f, indent=2)
        f.write('\n')
    os.chmod(tmp, 0o644)
    os.replace(tmp, path)
except OSError as e:
    if os.path.exists(tmp):
        try:
            os.unlink(tmp)
        except OSError:
            pass
    print(f'error: failed to write {path}: {e}', file=sys.stderr)
    sys.exit(1)
PY
```

> [!NOTE]
> DGX Spark 使用统一内存架构 (UMA)，可在 GPU 和 CPU 之间实现动态内存共享。由于许多应用程序仍在更新以利用 UMA，即使在 DGX Spark 的内存容量范围内，你也可能会遇到内存问题。如果发生这种情况，请使用以下命令手动刷新缓冲区缓存：

```bash
sudo sh -c 'sync; echo 3 > /proc/sys/vm/drop_caches'
```

有关最新的已知问题，请查看 [DGX Spark User Guide](https://docs.nvidia.com/dgx/dgx-spark/known-issues.html)。
