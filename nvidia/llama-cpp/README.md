# 在 DGX Spark 上使用 llama.cpp 运行模型

> 使用 CUDA 构建 llama.cpp 并通过 OpenAI 兼容的 API 提供模型

## 目录

- [概述](#overview)
- [操作步骤](#instructions)
- [故障排查](#troubleshooting)

---

<a id="overview"></a>
## 概述

## 基本思路

[llama.cpp](https://github.com/ggml-org/llama.cpp) 是用于大型语言模型的轻量级 C/C++ 推理堆栈。您可以使用 CUDA 构建它，以便充分利用 DGX Spark GB10 GPU，然后加载 GGUF 权重并通过 `llama-server` 的 OpenAI 兼容 HTTP API 公开聊天。

本剧本以支持 MTP 的 **Qwen3.6-35B-A3B** 作为实战示例，从头到尾地遍历该堆栈。所有受支持模型的检查点选择和路径都汇总在下面的矩阵中；命令位于操作步骤中。

## 你将完成什么

您将使用 GB10 的 CUDA 构建 llama.cpp，下载 **Qwen3.6-35B-A3B** 检查点，并使用 GPU 卸载运行 **`llama-server`**。你得到：

- 通过 llama.cpp 进行本地推理（无需单独的 Python 推理框架）
- 用于工具和应用程序的 OpenAI 兼容 `/v1/chat/completions` 端点
- **Qwen3.6-35B-A3B** 示例在 DGX Spark 的该堆栈上支持 MTP 运行的具体验证

## 开始之前需要了解什么

- 基本熟悉 Linux 命令行和终端命令
- 了解 git 并使用 CMake 从源代码构建
- 用于测试的 REST API 和 cURL 的基本知识

## 先决条件

**硬件要求**

- 配备 GB10 GPU 的 NVIDIA DGX Spark
- 为模型和所使用的 KV-Cache 提供足够的统一内存（示例中模型约需 30GB 可用内存）
- 至少 **~40GB** 可用磁盘用于示例下载和构建工件（如果保留多个 GGUF 则需要更多）

**软件要求**

- NVIDIA DGX 操作系统
- git：`git --version`
- CMake（3.14+）：`cmake --version`
- CUDA 工具包：`nvcc --version`
- 网络访问 GitHub 和 Hugging Face

## 模型支持矩阵

只要系统有足够的内存来承载和运行检查点，DGX Spark 就能通过 llama.cpp 支持任何 GGUF 格式的模型检查点。

## 时间与风险

* **预计时间：** 大约 30 分钟，加上下载示例 GGUF（默认量化约 ~35GB 量级）
* **风险级别：** 低 — 构建是您的克隆本地的；以下步骤无需进行系统范围内的安装
* **回滚：**删除`llama.cpp`克隆以及`~/.cache/huggingface/hub/`下的模型目录以回收磁盘空间
* **最后更新：** 2026 年 6 月 3 日
  * 演练现以 Qwen3.6-35B-A3B 为示例

<a id="instructions"></a>
## 操作步骤
## 步骤 1. 安装依赖项

安装所需的依赖项：

```shell
sudo apt install -y git clang cmake libcurl4-openssl-dev libssl-dev
```

## 步骤 2. 克隆 llama.cpp 仓库

克隆上游 llama.cpp — 您正在构建的框架：

```shell
git clone https://github.com/ggml-org/llama.cpp
cd llama.cpp
```

## 步骤 3. 使用 CUDA 构建 llama.cpp

使用 CUDA 和 GB10 的 **sm_121** 架构配置 CMake，以便 GGML 的 CUDA 后端与您的 GPU 匹配：

```shell
cmake -B build -DGGML_NATIVE=ON -DGGML_CUDA=ON -DGGML_CURL=ON -DGGML_RPC=ON -DCMAKE_CUDA_ARCHITECTURES=121a-real
cmake --build build --config Release -j
```

构建通常需要 5-10 分钟左右。完成后，`llama-server` 等二进制文件将出现在 `build/bin/` 下。

## 步骤 4. 使用模型启动 llama-server

llama.cpp 以 **GGUF** 格式加载模型。本剧本使用来自 `unsloth/Qwen3.6-35B-A3B-MTP-GGUF` 的 **Q4_K_XL** 检查点，可在 DGX Spark 上很好地平衡质量与速度。

从 `llama.cpp/build` 目录中，启动具有 GPU 卸载功能的 OpenAI 兼容服务器。如果之前未下载过模型或有任何更新，它会先从 HuggingFace 加载模型。

所有模型都保存在默认的 HuggingFace 缓存目录 ~/.cache/huggingface/hub 中。例如，该模型将保存到 ~/.cache/huggingface/hub/models--unsloth--Qwen3.6-35B-A3B-MTP-GGUF。

如果模型支持，它还会自动加载 mmproj 文件以启用视觉能力。默认情况下，llama-server 会尝试容纳完整的模型上下文并支持 4 个并发请求，但它会在需要时自动调整参数。

```shell
./bin/llama-server \
  -hf unsloth/Qwen3.6-35B-A3B-MTP-GGUF:UD-Q4_K_XL \
  --host 0.0.0.0 \
  --port 30000
```

要使用 MTP 推测解码运行，请按下面的示例提供额外的参数。MTP 需要兼容的模型，例如本示例中使用的 `unsloth/Qwen3.6-35B-A3B-MTP-GGUF`。下面的示例还设置了 “preserve_thinking” 标志，它允许 Qwen 模型使用所谓的“交错思考”（interleaved thinking），即在历史记录中保留所有先前的思考块，这对 agentic 工作流很有用。

```shell
./bin/llama-server \
  -hf unsloth/Qwen3.6-35B-A3B-MTP-GGUF:UD-Q4_K_XL \
  --host 0.0.0.0 \
  --port 30000 \
  --chat-template-kwargs '{"preserve_thinking": true}' \
  --spec-type draft-mtp \
  --spec-draft-n-max 3 
```

**参数（简短）：**

- `--host` / `--port`：HTTP API 的绑定地址和端口
- `--chat-template-kwargs`：为 json 模板解析器设置额外参数，必须是有效的 json 对象字符串
- `--spec-type`：要使用的推测解码类型的逗号分隔列表（默认：none，大多数兼容 MTP 的模型使用 “draft-mtp”，但你需要先查看模型卡）
- `--spec-draft-n-max`：推测解码要起草的 token 数量（默认：3）

您应该看到类似于以下内容的日志行：

```
0.14.322.968 I srv    load_model: speculative decoding context initialized
0.14.322.970 I slot   load_model: id  0 | task -1 | new slot, n_ctx = 262144
0.14.322.972 I slot   load_model: id  1 | task -1 | new slot, n_ctx = 262144
0.14.322.972 I slot   load_model: id  2 | task -1 | new slot, n_ctx = 262144
0.14.322.973 I slot   load_model: id  3 | task -1 | new slot, n_ctx = 262144
0.14.323.063 I srv    load_model: prompt cache is enabled, size limit: 8192 MiB

...
0.14.342.935 I srv  llama_server: model loaded
0.14.342.939 I srv  llama_server: server is listening on http://0.0.0.0:30000
0.14.342.944 I srv  update_slots: all slots are idle

```

**测试时保持此终端打开**。大型 GGUF 可能需要一分钟以上才能加载，如果模型尚未下载，初始模型下载可能需要一段时间。下载模型时您会看到进度条。

只有在您看到 `server is listening` 消息后，服务器才准备好在端口 30000 上接受传入连接（如果 `curl` 报告连接被拒绝，请参阅故障排查）。

## 步骤 5. 测试 API

使用运行 `llama-server` 的同一台计算机上的第二个终端（例如 DGX Spark 的另一个 SSH 会话）。如果您在笔记本电脑上运行 `curl`，而服务器仅在 Spark 上运行，请使用 Spark 主机名或 IP，而不是 `localhost`。

```shell
curl -X POST http://127.0.0.1:30000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "unsloth/Qwen3.6-35B-A3B-MTP-GGUF:UD-Q4_K_XL",
    "messages": [{"role": "user", "content": "New York is a great city because..."}],
    "max_tokens": 100
  }'
```

如果您看到 `curl: (7) Failed to connect`，则服务器仍在加载，进程已退出（检查服务器日志中是否有 OOM 或路径错误），或者您没有卷曲运行 `llama-server` 的主机。

响应的示例形状（字段因 llama.cpp 版本而异；`message` 可能包含额外的键）：

```json
{
  "choices": [
    {
      "finish_reason": "length",
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "New York is a great city because it's a living, breathing collage of cultures, ideas, and possibilities—all stacked into one vibrant, never‑sleeping metropolis. Here are just a few reasons that many people ("
      }
    }
  ],
  "created": 1765916539,
  "model": "$MODEL_PATH",
  "object": "chat.completion",
  "usage": {
    "completion_tokens": 100,
    "prompt_tokens": 25,
    "total_tokens": 125
  },
  "id": "chatcmpl-...",
  "timings": {
    ...
  }
}
```

## 步骤 6. 更长的完成时间（使用 Qwen3.6-35B-A3B）

尝试使用稍长的提示来确认 **Qwen3.6-35B-A3B** 的稳定生成：

```shell
curl -X POST http://127.0.0.1:30000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "unsloth/Qwen3.6-35B-A3B-MTP-GGUF:UD-Q4_K_XL",
    "messages": [{"role": "user", "content": "Solve this step by step: If a train travels 120 miles in 2 hours, what is its average speed?"}],
    "max_tokens": 500
  }'
```

## 步骤 7. 清理

在运行服务器的终端中使用 `Ctrl+C` 停止服务器。

要删除本教程的工件：

```shell
rm -rf ~/llama.cpp
rm -rf ~/.cache/huggingface/hub/models--unsloth--Qwen3.6-35B-A3B-MTP-GGUF
```

## 步骤 8. 后续步骤

1. **上下文长度：** 默认情况下，llama.cpp 会尽可能为模型分配其支持的最大上下文大小，但你也可以使用 `--ctx-size`（或 `-c`）手动设置以适应你的需求。对于 agentic 或编程需求，你至少需要 32768 个 token，最好是 100000 或更多。
2. **其他模型：** 你可以使用 `--model` 加载任何本地下载的兼容 GGUF；llama.cpp 服务器 API 保持不变。使用 `-hf` 让 llama.cpp 自动管理下载/更新。请注意，如果你将 `--model` 与多模态模型一起使用，需要使用 `--mmproj` 参数提供 .mmproj 文件的路径。如果你使用 `-hf`，它会自动加载 mmproj 文件。
3. **集成：** 使用 OpenAI 客户端模式在 `http://<spark-host>:30000/v1` 点 Open WebUI、Continue.dev 或自定义客户端。

服务器实现了 llama.cpp 构建启用的常见 OpenAI 风格聊天功能（包括支持的流和工具相关流程）。

<a id="troubleshooting"></a>
## 故障排查
| 症状 | 原因 | 使固定 |
|---------|-------|-----|
| `cmake` 失败并显示“未找到 CUDA” | CUDA 工具包不在 PATH 中 | 运行 `export PATH=/usr/local/cuda/bin:$PATH` 并从干净的构建目录重新运行 CMake |
| 构建错误提到错误的 GPU 架构 | CMake `CMAKE_CUDA_ARCHITECTURES` 与 GB10 不匹配 | 按照说明对 DGX Spark GB10 使用 `-DCMAKE_CUDA_ARCHITECTURES="121"` |
| GGUF 下载失败或停止 | 网络或Hugging Face可用性 | 重新运行`hf download`；它恢复部分文件 |
| 启动 `llama-server` 时出现“CUDA 内存不足” | 模型对于当前上下文或 VRAM 来说太大 | 降低 `--ctx-size` （例如 4096）或使用同一仓库中较小的量化 |
| 服务器运行但延迟很高 | 不在 GPU 上的层 | 确认 `--n-gpu-layers` 对于您的模型来说足够高；在请求期间检查 `nvidia-smi` |
| 端口 30000 上的 `curl: (7) Failed to connect` | 还没有侦听器、主机错误或崩溃 | 等待`server is listening`；在与 `llama-server`（或 Spark 的 IP）相同的主机上运行 `curl`；运行 `ss -tln` 并确认 `:30000`；读取服务器 stderr 是否存在 OOM 或错误的 `--model` 路径 |
| 聊天 API 错误或空回复 | `--model` 路径错误或 GGUF 不兼容 | 验证 `.gguf` 文件的路径；如果 GGUF 需要更新的格式，请更新 llama.cpp |

> [！笔记]
> DGX Spark 使用统一内存架构（UMA），允许 GPU 和 CPU 内存之间灵活共享。一些软件仍在追赶 UMA 行为。如果意外遇到内存压力，可以尝试刷新页面缓存（在共享系统上请小心使用）：
```bash
sudo sh -c 'sync; echo 3 > /proc/sys/vm/drop_caches'
```

有关最新的平台问题，请参阅 [DGX Spark known issues](https://docs.nvidia.com/dgx/dgx-spark/known-issues.html) 文档。
