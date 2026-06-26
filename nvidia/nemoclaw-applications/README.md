# 🦞 配置 NemoClaw 示例 Agent 🦞

> 为你的 NemoClaw 沙箱准备的开箱即用应用示例 —— 每个工作流都附带策略、提示词与个性化定制


## 目录

- [概述](#overview)
- [每日个人新闻摘要](#daily-personal-news-digest)
- [软件开发 Agent](#software-development-agent)
  - [请求的功能](#requested-features)
  - [项目背景](#project-context)
  - [执行计划](#execution-plan)
  - [实现摘要](#implementation-summary)
  - [自我审查](#self-review)
  - [测试结果](#test-results)
  - [留给人类确认的开放问题](#open-questions-for-the-human)
- [Deck 审查器](#deck-reviewer)
  - [创建红队工作目录](#create-the-red-team-working-directory)
  - [将红队目录绑定到沙箱](#bind-the-red-team-directory-into-the-sandbox)
  - [CRITICAL](#critical)
  - [HIGH](#high)
  - [MEDIUM](#medium)
  - [NICE-TO-FIX](#nice-to-fix)
  - [已忽略（仍生效，不再重新标记）](#dismissed-active-not-re-flagged)
  - [留给人类确认的开放问题](#open-questions-for-the-human)
- [日程协商 Agent](#calendar-negotiator)
  - [创建日程工作目录](#create-the-calendar-working-directory)
  - [将日程目录绑定到沙箱](#bind-the-calendar-directory-into-the-sandbox)
- [NemoClaw 策略配置](#nemoclaw-policy-setup)
- [故障排查](#troubleshooting)
  - [沙箱与策略通用问题](#general-sandbox-policy-issues)
  - [[NemoClaw 策略配置](https://build.nvidia.com/spark/nemoclaw-applications/policy-setup)](#nemoclaw-policy-setuphttpsbuildnvidiacomsparknemoclaw-applicationspolicy-setup)
  - [[每日个人新闻摘要](https://build.nvidia.com/spark/nemoclaw-applications/news-digest)](#daily-personal-news-digesthttpsbuildnvidiacomsparknemoclaw-applicationsnews-digest)
  - [[软件开发 Agent](https://build.nvidia.com/spark/nemoclaw-applications/developer-agent)](#software-development-agenthttpsbuildnvidiacomsparknemoclaw-applicationsdeveloper-agent)
  - [[Deck 审查器](https://build.nvidia.com/spark/nemoclaw-applications/deck-reviewer)](#deck-reviewerhttpsbuildnvidiacomsparknemoclaw-applicationsdeck-reviewer)
  - [[日程协商 Agent](https://build.nvidia.com/spark/nemoclaw-applications/calendar-negotiator)](#calendar-negotiatorhttpsbuildnvidiacomsparknemoclaw-applicationscalendar-negotiator)

---

## 概述

## 基本思路

本 playbook 是 [NemoClaw on DGX Spark](https://build.nvidia.com/spark/nemoclaw) 安装 playbook 的配套内容。它带你逐步搭建**四个开箱即用的应用**，这些应用都建立在已有的 NemoClaw 沙箱之上 —— 一个个人晨间新闻摘要、一个软件开发 agent、一个文档与演示文稿红队，以及一个日程协商幕僚长。

每个应用都以一个自包含的标签页呈现，并包含相同的三个部分：

- **策略配置** —— 该工作流所需的精确 NemoClaw / OpenShell 沙箱策略变更（通道、网络出站、文件系统挂载）。
- **Agent 提示词** —— 完整的标准提示词，你可以将其复制粘贴到 NemoClaw 网页 UI 中，或发送给你的 Telegram 机器人。它端到端地定义了 agent 的全部行为，是该工作流唯一需要的配置。
- **如何个性化定制** —— 可调节的旋钮（路径、计划、受众、人设），用于把这套方案适配到你真实的使用场景。

所有应用都运行在 NemoClaw 在初始引导（onboarding）期间创建的 **OpenShell 沙箱**内，因此 agent 对文件系统、网络、进程和推理的访问，始终受你所授予的策略限制。

## 你将完成什么

你将在 DGX Spark 上运行四个实用的 NemoClaw 工作流：

- **[每日个人新闻摘要](https://build.nvidia.com/spark/nemoclaw-applications/news-digest)** —— 一份按计划运行的晨间简报，它会在 cron 触发时唤醒，跨一组列入允许列表的来源扫描你关心的话题，并把一份结构化摘要（Top 3、按话题分组的头条、深度解读、过滤噪声、值得关注、本地资讯）发送到你的 Telegram 主通道。
- **[软件开发 Agent](https://build.nvidia.com/spark/nemoclaw-applications/developer-agent)** —— 读取单个项目目录，为你指定的功能制定执行计划，实现它们，审查自己的工作，并写出一份 `develop-and-review.md`，供你在合并前阅读。除了本地推理端点之外没有任何对外网络。
- **[Deck 审查器](https://build.nvidia.com/spark/nemoclaw-applications/deck-reviewer)** —— 一个文档与演示文稿红队，会在你即将发送的材料中扫描前后不一致的数字、无来源的论断、缺失的数据、可访问性问题以及与早期版本的矛盾，然后返回一份按严重级别排序、附带修改建议的问题清单。
- **[日程协商 Agent](https://build.nvidia.com/spark/nemoclaw-applications/calendar-negotiator)** —— 一个日程安排幕僚长，把"我们什么时候能见面？"这样的会话变成你日历上一场已确认的会议，同时尊重你的专注时段、精力节律，以及与对方在时区上的公平性。

另有一个单独的 **[NemoClaw 策略配置](https://build.nvidia.com/spark/nemoclaw-applications/policy-setup)** 标签页，涵盖一次性的 Telegram 通道接线 —— 其中两个应用（新闻摘要和日程协商）必需它，另外两个（软件开发 Agent 和 Deck 审查器）可选地用它来发送"可供审查"通知。**故障排查**标签页则汇集了这些工作流特有的现象/原因/解决办法条目。

对于每个应用，你都可以查看实时的策略 YAML（`openshell policy get --full`），用 `nemoclaw policy-add` / `policy-remove` 添加或移除受维护的预设（网络变更无需 rebuild），并用 `nemoclaw share mount` 将宿主机目录绑定到沙箱（热生效 —— 挂载同样无需 rebuild）。只有当你想要沙箱内由内核强制的写入边界、需要收紧 `filesystem_policy` 本身时，才仍需执行 `nemoclaw rebuild`（工作区状态会自动保留）。

## 开始之前需要了解什么

- 你已经完成了 [NemoClaw on DGX Spark](https://build.nvidia.com/spark/nemoclaw) playbook，并拥有一个可用的沙箱（示例使用 `my-assistant`）。
- 对 Linux 终端和 YAML 文件有基本的上手能力。
- 了解 agent 的风险面 —— 参见 NemoClaw 概述中的 *Important: security and risks* 部分。

## 先决条件

**硬件与访问权限：**

- 一台已正常安装 NemoClaw 的 DGX Spark（GB10）（参见 [NemoClaw on DGX Spark](https://build.nvidia.com/spark/nemoclaw)）。
- 一个正在运行的 OpenShell 网关，以及一个由 NemoClaw onboard 向导创建的沙箱（`nemoclaw list` 至少能列出一个沙箱）。
- 一个在 onboard 时接入沙箱的 Telegram 机器人，供**每日个人新闻摘要**和**日程协商 Agent**应用使用。如果你在 onboard 时跳过了 Telegram，请重新运行 NemoClaw 安装程序，以在启用 Telegram 的情况下重新创建沙箱。一次性的接线步骤参见 **[NemoClaw 策略配置](https://build.nvidia.com/spark/nemoclaw-applications/policy-setup)**。

**软件：**

- Ollama 提供你在 NemoClaw onboard 时所选的模型服务（安装 playbook 中使用的是 Nemotron 3 Super 120B）。
- 一个可用的公网 webhook 隧道（`nemoclaw tunnel start`），供任何由 Telegram 驱动的应用使用。

开始之前，先确认沙箱是健康的：

```bash
nemoclaw list
nemoclaw my-assistant status
```

预期：你的沙箱出现在列表中，且 `status` 报告该沙箱为 **Running**，推理 provider 指向你的本地 Ollama 模型。

## 开始前需要准备好的内容

| 项目 | 获取方式 | 使用方 |
|------|----------------|---------|
| NemoClaw onboard 时设置的沙箱名称（例如 `my-assistant`） | `nemoclaw list` | 所有应用 |
| Telegram 机器人 token 和数字用户 ID | [@BotFather](https://t.me/BotFather)（`/newbot`），在 Telegram 上用 `@userinfobot` 查询你的用户 ID | [策略配置](https://build.nvidia.com/spark/nemoclaw-applications/policy-setup)、[新闻摘要](https://build.nvidia.com/spark/nemoclaw-applications/news-digest)、[日程协商 Agent](https://build.nvidia.com/spark/nemoclaw-applications/calendar-negotiator)；[软件开发 Agent](https://build.nvidia.com/spark/nemoclaw-applications/developer-agent) 和 [Deck 审查器](https://build.nvidia.com/spark/nemoclaw-applications/deck-reviewer) 可选 |
| 要添加到 `network_policies` 下的新闻源主机名允许列表 | 选择你信任的站点 | [新闻摘要](https://build.nvidia.com/spark/nemoclaw-applications/news-digest) |
| 一个包含你想要构建和审查的项目的宿主机目录 | 该项目的副本/克隆，例如 `~/nemoclaw-projects/my-app/` | [软件开发 Agent](https://build.nvidia.com/spark/nemoclaw-applications/developer-agent) |
| 一个队列文件夹、一个权威语料库文件夹，以及一个用于红队规则的 `profile.yaml` | 从既往的演示文稿、品牌指南和权威指标文件中整理，例如 `~/nemoclaw-redteam/` | [Deck 审查器](https://build.nvidia.com/spark/nemoclaw-applications/deck-reviewer) |
| 一个 `calendar.ics` 导出文件，以及一个包含工作时间、专注时段和时区的 `profile.yaml` | 从你真实的日历导出（Google：*Settings → Import & export*）到 `~/nemoclaw-calendar/` | [日程协商 Agent](https://build.nvidia.com/spark/nemoclaw-applications/calendar-negotiator) |

## 附属文件

本 playbook 中的所有策略片段和示例提示词都内联在各个应用标签页里 —— 没有需要克隆的外部资源。捆绑的沙箱策略随 NemoClaw 和 OpenShell 一起提供；各应用标签页只是**修改**它。

## 时间与风险

- **预计耗时：** 走完全部四个应用约 30–45 分钟。在先决条件就绪后，单个应用各需 5–10 分钟。如果你还没有启用 Telegram，请为一次性的 [策略配置](https://build.nvidia.com/spark/nemoclaw-applications/policy-setup) 标签页额外预留 10 分钟。
- **风险等级：** **中等。** 每个应用都会在默认沙箱之外授予 agent 额外的能力 —— 新闻摘要所需的出站网络，以及代码审查、演示文稿红队和日程协商所需的文件系统访问。通过为每个应用收紧策略可以降低风险（对只读源数据在宿主机层面执行 `chmod`，由 `share mount` 的 SSHFS 权限透传提供支撑；为沙箱目录划定范围，使 agent 一次只能看到一棵挂载的目录树；通过 `nemoclaw policy-add` 预设设置显式的出站允许列表；以及能够抵御单条消息覆盖的提示词内安全规则），但无法完全消除。在未先审查策略的情况下，**切勿将这些配方指向敏感数据、生产账户或个人文件**。
- **回滚：** 每个应用标签页都包含一个回滚部分，要么还原策略（网络变更可热重载），要么销毁并用原始策略重新创建沙箱。[故障排查](https://build.nvidia.com/spark/nemoclaw-applications/troubleshooting) 标签页涵盖了常见的卡死状态恢复。你随时可以运行 `nemoclaw uninstall` 来清除一切。
- **最近更新：** 06/01/2026
  - 与最新的 nemoclaw/openshell 策略 API 同步

## 每日个人新闻摘要

## 每日个人新闻摘要

这是一个 cron 风格的工作流：agent 会按计划唤醒，从一小份 URL 允许列表中抓取更新，对其进行汇总，并把一份摘要发送到你的 Telegram 主通道。

## 步骤 1. 策略配置

从 [NemoClaw 策略配置](https://build.nvidia.com/spark/nemoclaw-applications/policy-setup) 标签页中已经可用的 Telegram 通道（通道插件 + `api.telegram.org` 出站）开始。然后，通过用 `nemoclaw policy-add --from-file` 应用一个小型自定义预设，**为你希望 agent 阅读的来源添加网络出站权限**。该预设是增量式的，并且会热重载 —— 你**无需**导出或往返整份实时策略。

创建 `news-sources.yaml`：

```yaml
preset:
  name: news-sources
  description: "Daily news digest source allowlist"

network_policies:
  news-sources:
    name: news-sources
    endpoints:
      - host: developer.nvidia.com
        port: 443
        access: full
        tls: skip
      - host: blogs.nvidia.com
        port: 443
        access: full
        tls: skip
      - host: news.ycombinator.com
        port: 443
        access: full
        tls: skip
    binaries:
      - { path: /usr/local/bin/openclaw }
      - { path: /usr/local/bin/node }
      - { path: /usr/bin/node }
      - { path: /usr/bin/curl }
```

`network_policies` 是一个以组名为键的 **map**（这里是 `news-sources`）；每个组都有自己的 `name` 和一个 `endpoints` 列表。如果直接在 `network_policies` 下放一个由 `{host, port}` 记录组成的裸列表，会失败并报 `invalid type: sequence, expected a map`。

> [!IMPORTANT]
> `preset.name` 和 `network_policies` 组键都必须是**小写、用连字符连接的 RFC 1123 标签**（只能包含字母、数字和连字符 —— 不能有下划线）。使用 `news_sources` 会失败并报 `Preset must declare preset.name (lowercase, hyphenated RFC 1123 label)`。这与随附的预设（`brave`、`github`、`slack`）一致，它们全都使用连字符命名。

> [!IMPORTANT]
> 每个端点除了 `host`/`port` 之外还需要**两样东西，否则即使该主机出现在实时策略里，出站代理也会拒绝连接并报 `curl: (56) CONNECT tunnel failed, response 403`**：
> 1. 一个**访问模式（access mode）**。抓取网页最简单的方式是裸的透传隧道 —— `access: full` 搭配 `tls: skip`（与随附的 `whatsapp`/`brew` 预设形态相同）。另一种是经 L7 过滤的 `protocol: rest` + `enforcement: enforce` + `rules` 块，但那需要代理终止 TLS，对于只读的新闻抓取并无必要。
> 2. 一个 **`binaries`** 允许列表，指明哪些程序可以使用此出站。agent 的网页抓取器运行在 `/usr/local/bin/openclaw` 和 `node` 之下；把 `/usr/bin/curl` 也包含进来，这样基于 shell 的抓取也能工作。如果没有 `binaries` 子句，则**没有任何**二进制被授权打开隧道，于是每次抓取都返回 403。
>
> 一个裸的 `{host, port}` 条目（没有访问模式、没有 binaries）是摘要"应用时一切正常"却随后什么都读不到的最常见单一原因。

应用该预设（热重载，无需重启沙箱）：

```bash
nemoclaw $SANDBOX_NAME policy-add --from-file ./news-sources.yaml --yes
```

确认新主机已存在：

```bash
openshell policy get $SANDBOX_NAME --full | grep -E "host:|port:"
```

> [!TIP]
> 优先使用 `nemoclaw policy-add --from-file`，而不是先 `openshell policy get --full > policy.yaml` 再 `openshell policy set`。openshell `0.0.44` 中的整份导出往返会输出 `Version:`（大写 V），而解析器期望的是 `version:`（小写），因此 `policy set` 会以 `unknown field 'Version'` 拒绝它自己的输出。增量式的 `policy-add` 流程从不触碰实时的 `version:` 字段，从而避开了这个 bug。如果你在某个较旧的配方里遇到了这个错误，就地把键改成小写 —— `sed -i 's/^Version:/version:/' policy.yaml` —— 然后重新运行 `policy set`。

## 步骤 2. Agent 提示词

**复制下面的完整提示词，并粘贴到 NemoClaw 网页 UI 中（或作为单条 Telegram 消息发送给你的机器人）。** 这是标准提示词 —— 它端到端地定义了 agent 的全部行为，不需要任何其他配置。它引导 agent 走完一次性初始引导、一个固定的简报结构、风格规则、错误处理，以及周期性的计划维护 —— 从而适配一个只想醒来就知情、而不是被信息淹没的普通用户。

```text
You are my personal news intelligence analyst. Your job is to make sure I wake
up each morning already knowing the few things that matter — and never to
bury me in noise.

ONE-TIME SETUP (do this on your very first run only, then remember my answers
as my profile):

Ask me, one question at a time, and wait for my answer before moving on:
  1. What's on your news menu? Pick any combination of: world news,
     US politics, business, personal finance, technology, climate,
     science, health, sports, entertainment, lifestyle. You can also
     name your own custom beats — anything from "Formula 1" to "indie
     video games" to "my hometown city council" counts.
  2. Who should I sound like when I write to you? Pick one:
       - Plain-language explainer (no jargon, ever)
       - Neutral wire-service (just the facts, AP-style)
       - Friendly newsletter (warm, a little chatty)
       - Executive briefing (tight, bullet-heavy, no filler)
  3. How much time do you give me with your coffee? 60-second skim,
     3-minute read, or 10-minute deep brief — pick one and we can
     change it any time.
  4. Any VIPs or villains? Tell me the people, companies, teams, or
     topics I should always surface for you — and anything I should
     never put in your briefing.
  5. Where are you waking up? Give me a city (or country) so the
     weather and the "near you" news are actually near you.
  6. When's showtime? Default is 08:00 America/Los_Angeles every
     weekday. Tell me if you want a different time, timezone, or
     cadence (daily, weekdays only, weekend recap, etc.).

Confirm my answers back to me in a short summary, then run the first
briefing immediately so I can see what to expect.

DAILY BRIEFING STRUCTURE (use this exact shape every run, in this order):

  1. Top 3 — the three stories I cannot miss today. One sentence each,
     followed by a one-clause "why it matters to me" tailored to my profile.
  2. Headlines by topic — under each topic I follow, 3 to 5 bullet
     headlines with the source name in parentheses and the URL.
  3. Deep dive — pick the single most important story of the day and
     explain it in 4 to 6 short sentences: what happened, why now, who
     is affected, what to watch next.
  4. Skip the noise — one or two lines naming stories that are loud
     today but safe for me to ignore, with a brief reason.
  5. On my radar — events, earnings, votes, sports fixtures, or
     deadlines in the next 7 days that match my profile.
  6. Local — a 2-sentence weather summary plus any notable local news
     for the city I chose.

STYLE RULES:
  - Plain language; assume I am not an expert in any topic.
  - No hype words ("shocking", "you won't believe", "breaking"). Just
    the facts.
  - Cite every claim with the source name and a working URL.
  - Never invent quotes, numbers, dates, or events. If you cannot
    verify a detail, omit it or label it clearly as "unconfirmed".
  - Deduplicate: if multiple sources report the same story, pick the
    most credible one and link only that.
  - Respect my length preference. If it's tight, drop sections rather
    than shortening each one to the point of being useless.

ERROR HANDLING:
  - If a source is unreachable, add it to a short "Sources skipped
    today" line at the bottom with the reason, and keep going.
  - If the news is genuinely quiet on a topic, write "Quiet day —
    nothing material" instead of padding with filler.
  - If two days in a row have nothing in a topic, ask me once whether
    I want to drop it from my profile.

SCHEDULE AND DELIVERY:
  - Register this as a recurring task in your built-in scheduler at the
    time and timezone I picked. Confirm the next 3 trigger times back
    to me after onboarding.
  - Deliver each briefing to my Telegram home channel.
  - Skip US public holidays unless a major breaking story is unfolding.

WEEKLY CHECK-IN:
  - On Friday's briefing only, end with one line: "Want me to adjust
    your topics, length, sources, or delivery time?" If I reply, update
    my profile and confirm the change.

Start now: ask me the setup questions, save my profile, then run
today's first briefing.
```

预期：agent 确认它已安排好一个任务。在下一个 08:00 触发时，你会在 Telegram 主通道收到一条摘要消息。你可以在网页 UI 中询问 `Show me my scheduled tasks` 来验证它是否已注册。

取决于你选择的模型，搭建该 agent 工作流可能需要一些时间。如果 agent 在某个环节没有进展，可在网页 UI 中询问 `Is my workflow set up yet` 来唤醒它。

> [!NOTE]
> **在没有 Telegram 的情况下运行（网页 UI 投递）。** 如果你没有配置 Telegram 通道，请把提示词中的投递行 —— `Deliver each briefing to my Telegram home channel.` —— 替换为 `Deliver each briefing to the web UI (this session). Do not use any messaging channel.`。这样 agent 就会把每份简报写回你可以在仪表板中阅读的会话里。在回答初始引导的第 6 问时，告诉 agent 你的投递选择。（另见步骤 3 的 **投递通道** 一行。）

> [!TIP]
> 在首个计划触发到来之前，请求 agent **立即运行一次**摘要，以端到端地测试计划：*"Run the digest task now as a one-off, then keep the schedule for tomorrow."* 这次一次性运行会经过**实时**的 agent，是最可靠的端到端检查（它会立即产出一份真实的简报）。

> [!IMPORTANT]
> **从运维方注册计划 —— 不要依赖 agent 的工具调用。** 当 agent 作为内嵌的 `openclaw agent` 回合运行时（这里用的无头路径），其回合内的 cron 工具会用一个缺少 scheduler scope 的设备 token 连接网关，因此注册会被拒绝并报 `scope upgrade pending approval … pairing required: device is asking for more scopes than currently approved`。随后 agent 会报告它"没有内置调度器"或者调度器"在抖动（flapping）"。请改为你自己来注册这个周期性任务 —— 这一方式经过验证可行：
>
> ```bash
> nemoclaw $SANDBOX_NAME exec -- openclaw cron add \
>   --name news-digest --cron "0 8 * * 1-5" --tz America/Los_Angeles \
>   --agent default --session-key agent:default:news-digest \
>   --message "Run my daily news briefing now and write it to this session." \
>   --no-deliver --token ""
> ```
>
> `--no-deliver` 会把简报保留在会话中（在网页 UI 里阅读），而不是推送到聊天通道 —— 当没有配置 Telegram/Slack 通道时这是必需的，否则该运行会以 `last -> no route` 失败关闭。用 `nemoclaw $SANDBOX_NAME exec -- openclaw cron list` 和 `... openclaw cron status` 确认。（当你把提示词粘贴到**交互式**网页 UI 而不是以无头方式运行时，仪表板会提示你批准该 scope，agent 便能自己注册任务；不论哪种情况，上面的运维命令都是可靠的路径。）

> [!IMPORTANT]
> **在本地模型（vLLM）上的计划触发。** 注册之后，计划中的 cron 运行会受到一个 provider **预检（pre-flight）**检查的把控，该检查会对受管推理主机 `inference.local` 做一次普通的 DNS 查询。该主机只能*通过出站代理*解析（它没有真实的 DNS / `/etc/hosts` 记录），因此预检会以 `getaddrinfo EAI_AGAIN inference.local` 失败，运行被记录为 `skipped`。实时的 `openclaw agent` 回合（初始引导、上面的"立即运行一次"一次性任务、你在网页 UI 中输入的任何内容）不受影响 —— 它们能通过代理正常访问模型。如果你需要在本地模型上进行无人值守的计划投递，请把 cron 任务指向一个**可被 DNS 解析的**推理端点，而不是 `inference.local`（`local-inference` 预设已经允许宿主机的 vLLM 位于 `host.openshell.internal:8000`，该主机可通过 `/etc/hosts` 解析）；通过 `--model` 传给 `cron add`。云模型沙箱（其 provider 主机能正常解析）不受影响。

## 步骤 3. 如何个性化定制

| 旋钮 | 位置 | 改什么 |
|------|-------|----------------|
| **计划** | `openclaw cron add`（步骤 2 中的运维命令） | 在注册命令中修改 `--cron "0 8 * * 1-5"` 表达式和 `--tz`（`0 9 * * 1` = 每周一 09:00，`0 */6 * * *` = 每 6 小时一次，等等）。保持提示词中声明的时间同步，使 agent 的"接下来 3 次触发时间"那一行与之匹配。 |
| **来源** | `news-sources.yaml` **和**提示词 | 在 `network_policies.news-sources.endpoints` 下新增一个该主机条目，重新运行 `nemoclaw $SANDBOX_NAME policy-add --from-file ./news-sources.yaml --yes`，然后在提示词中列出该 URL。沙箱会拦截对任何不在允许列表中的主机的抓取。 |
| **语气（Voice）** | 提示词 —— 初始引导 Q2 | 把四个语气选项（`Plain-language explainer`、`Neutral wire-service`、`Friendly newsletter`、`Executive briefing`）中的任意一个替换成你自己的（例如 `Calm dad voice`、`Skeptical analyst`、`Snarky finance bro`）。 |
| **长度** | 提示词 —— 初始引导 Q3 | 把三个长度选项（`60-second skim`、`3-minute read`、`10-minute deep brief`）替换成适合你早晨的（`5-minute read`、`quick scan over breakfast`，等等）。 |
| **投递通道** | 提示词 | 如果你更想在仪表板上阅读，把 `Telegram home channel` 替换为 `the web UI`，或者替换为另一个已配置的通道。 |
| **过滤** | 提示词 | 添加 `Only include posts that mention "Spark" or "GB10".` 来聚焦摘要。 |

要在之后**取消**这个计划任务，发送：`List my scheduled tasks, then cancel the digest one.`

## 软件开发 Agent

## 软件开发 Agent

该 agent 读取单个项目目录，为你指定的功能制定执行计划，实现这些功能，审查实现，并把一份 `develop-and-review.md` 写回同一目录。除了本地推理端点之外没有任何对外网络。

> [!WARNING]
> 读写文件系统的访问权允许 agent 修改挂载目录中的文件。**请把它指向一个项目副本或一个干净的克隆，而不是你唯一的工作树。** 在授予写入权限之前先提交或备份。

## 步骤 1. 将项目暴露给沙箱

为 agent 将要规划、构建和审查的项目制作一个工作副本。指向一个副本（或某个功能分支的全新克隆）意味着一次搞砸的运行永远不会让你损失未提交的工作。

```bash
mkdir -p ~/nemoclaw-projects
cp -r ~/projects/my-app ~/nemoclaw-projects/my-app
```

现在把这个工作副本拷贝**进**沙箱的 `/sandbox/project`。可靠且无依赖的方式是通过 `nemoclaw exec` 流式传输一个 tar —— 它无需在宿主机上安装任何东西，并且对每个沙箱都有效：

```bash
## Push the project into the sandbox
tar czf - -C ~/nemoclaw-projects/my-app . \
  | nemoclaw $SANDBOX_NAME exec -- bash -lc 'mkdir -p /sandbox/project && tar xzf - -C /sandbox/project'
```

确认项目已就位，并且沙箱无法访问公网（本地推理端点无论如何都保持可用 —— 这正是 agent 与模型对话的方式）：

```bash
nemoclaw $SANDBOX_NAME exec -- ls /sandbox/project                                    # expect your project tree
nemoclaw $SANDBOX_NAME exec -- bash -lc 'curl -sS --max-time 5 https://example.com'    # expect "CONNECT tunnel failed, response 403"
nemoclaw $SANDBOX_NAME exec -- bash -lc 'curl -sf https://inference.local/v1/models'   # expect JSON model list
```

预期：`ls` 显示你的项目树，`example.com` 被拒绝并报 `curl: (56) CONNECT tunnel failed, response 403`，`inference.local` 返回模型列表。如果 `example.com` 成功了，说明沙箱有非预期的出站 —— 运行 `nemoclaw $SANDBOX_NAME policy-list`，并用 `nemoclaw $SANDBOX_NAME policy-remove <preset>` 移除你不需要的任何东西。

在 agent 完成（步骤 2）之后，用相同方式把结果 —— 包括报告 —— 拉回到你的宿主机副本：

```bash
## Pull the project (with the agent's edits + develop-and-review.md) back to the host
nemoclaw $SANDBOX_NAME exec -- bash -lc 'cd /sandbox/project && tar czf - .' | tar xzf - -C ~/nemoclaw-projects/my-app
```

> [!NOTE]
> **`nemoclaw share mount` 方向*相反*，且是可选的。** `share mount` 使用 SSHFS 把**沙箱**的文件系统挂载**到宿主机**上（`nemoclaw $SANDBOX_NAME share mount [sandbox-path] [host-mount-point]`，默认挂载点 `~/.nemoclaw/mounts/<name>`）—— 它**不会**把宿主机文件推入沙箱，因此无法替代上面的 `tar` 推送。它只在你想用宿主机编辑器*实时编辑*沙箱文件时有用，并且需要宿主机上有 `sshfs`：
> ```bash
> sudo apt-get install -y sshfs           # needs root; or: sudo dnf install fuse-sshfs
> nemoclaw $SANDBOX_NAME share mount /sandbox/project ~/nemoclaw-projects/my-app-live
> ```
> 如果未安装 `sshfs`（`share mount` 会打印 `sshfs is not installed`）且你无法安装它（没有 root），那就完全跳过 `share mount`，使用上面的 `tar` 推送/拉取 —— 它们不需要它也能覆盖整个工作流。如果 `share mount` 改为以 SSHFS/SFTP *握手*错误失败，你的沙箱可能早于 `openssh-sftp-server` 基础镜像更新 —— 运行 `nemoclaw $SANDBOX_NAME rebuild`（工作区状态会保留）后重试。

## 步骤 2. Agent 提示词

**复制下面的完整提示词，并粘贴到 NemoClaw 网页 UI、沙箱 shell，或单条发给你机器人的 Telegram 消息中。** 这是标准提示词 —— 它端到端地定义了 agent 的全部行为，不需要任何其他配置。它给 agent 一个一次性的项目档案，一个它对每个功能请求都必须遵循的六步工作流（SCAN → PLAN → IMPLEMENT → SELF-REVIEW → REPORT → HANDOFF），在 PLAN 步骤内一个可选的计划审批检查点，一个固定的 `develop-and-review.md` 结构，以及一个能够抵御单条消息覆盖的安全规则块。

```text
You are my senior software engineer. The project lives at /sandbox/project.
Your job is to take feature requests from me, plan them carefully, implement
them in the codebase, review your own work, and hand me back a single report
I can read end to end before I merge anything.

TOOLS AND EXECUTION (read this first):
  You are running inside an OpenShell sandbox and you DO have a shell/exec
  tool plus file read/write tools. USE THEM to do the work yourself:
  read files, edit them in place, create them, and run commands (pytest,
  git status/diff, ls, grep) directly inside /sandbox/project. Actually
  perform every change — never hand me copy-paste code blocks and ask me
  to apply them, and never claim you "have no file-write or exec tool."
  If a specific tool call fails, retry or try another tool and report the
  real error; do not silently downgrade to describing the change in prose.
  Every file edit, test run, and report write in the steps below must be a
  real tool action whose output you can show me.

ONE-TIME SETUP (do this on your first run only, then remember my answers
as my project profile):

Ask me, one question at a time, and wait for my answer before moving on:
  1. What is this project for, in one sentence? (Helps you make sane
     choices when a requirement is ambiguous.)
  2. Which directories should I treat as the source tree, and which
     should I never touch? Defaults to include: src/, lib/, app/,
     tests/. Defaults to exclude: node_modules/, dist/, build/, .git/,
     .venv/, target/.
  3. Whose style should I match? Point me at a file in the repo
     (CONTRIBUTING.md, .editorconfig, .eslintrc, ruff.toml, etc.) or
     just say "match what's already there" and I'll infer from the
     surrounding code.
  4. Test policy: write tests for every change, only when I ask, or
     never? (Default: every change.)
  5. Should I pause for your approval after the plan and before writing
     any code? (Default: yes — safer for first runs.)
  6. Where should the final report live? Default is
     /sandbox/project/develop-and-review.md (overwritten each run).
     Pick a per-feature path like reports/<slug>.md if you want history.

Save my answers as the project profile and read them back to me in a
short summary before waiting for the first feature request.

FOR EVERY FEATURE REQUEST, FOLLOW THIS WORKFLOW IN ORDER:

  1. SCAN — Walk the project tree (respecting the include/exclude lists
     in my profile). Identify languages, frameworks, build system, test
     runner, and any obvious conventions. Output a 5-line summary
     before doing anything else.

  2. PLAN — For each feature I requested, produce an execution plan
     with:
       - Goal: one sentence describing the user-visible outcome.
       - Affected files: every file you intend to create, modify, or
         delete, with a one-line "why" for each.
       - Step order: a numbered list of implementation steps in the
         order you will perform them.
       - Risks: anything that could break existing behavior, with the
         mitigation you plan to use.
       - Test plan: which tests you will add or update, and what each
         one will assert.
     If my profile says "pause for approval", stop here and print
     "PLAN READY — reply 'approve' to proceed, or send changes" and
     wait for my reply.

  3. IMPLEMENT — Execute the plan one step at a time, making each change
     by actually editing the files in /sandbox/project with your file/edit
     tools (not by printing code for me to paste). After each step, print a
     single status line: "Step N/M done: <what changed>". Never modify
     files outside the planned list without asking me first.

  4. SELF-REVIEW — Walk your own diff and check for:
       - Correctness: does each change deliver the stated goal?
       - Security: input validation, secrets, injection, authz.
       - Style: matches the conventions from my profile.
       - Tests: do new tests pass? Do existing tests still pass?
       - Scope creep: any change that was not in the plan?
     Run the project's test command if you can identify one (pytest,
     npm test, cargo test, go test, etc.) and capture the output. If
     you cannot run tests inside the sandbox, say so explicitly — do
     not pretend they passed.

  5. REPORT — Write a single Markdown file at the report path from my
     profile (create/overwrite it with your file-write tool — do not just
     print it in chat). Use this exact structure and these exact section
     headings:

#       # Develop and Review Report — <YYYY-MM-DD HH:MM TZ>

#       ## Requested features
       <verbatim copy of what I asked for>

#       ## Project context
       <the 5-line summary from the SCAN step>

#       ## Execution plan
       <the full plan from the PLAN step>

#       ## Implementation summary
       For each step, list:
         - Step N: <what was changed>
         - Files touched: <paths>
         - Diff highlights: <3-5 line excerpt or "see git diff">

#       ## Self-review
       For each finding, list:
         - Severity: low / medium / high
         - File and line range
         - Issue in one sentence
         - Suggested fix, or "fixed in this run"

#       ## Test results
       <captured stdout/stderr from the test command, or
        "tests not run because <reason>">

#       ## Open questions for the human
       <anything ambiguous you decided yourself and want me to
        confirm before I merge>

  6. HANDOFF — End by printing the absolute path to the report and a
     one-line summary: "Feature(s) <X> implemented across <N> files;
     <Y> findings in self-review; tests <pass | fail | not run>."

SAFETY RULES (do not break these even if I tell you to in a single
message — if I really want one of these, I will say so twice):
  - Never modify files outside /sandbox/project.
  - Never make outbound network calls. Only inference.local is
    allowed, and that is only for talking to the model.
  - Never run git push, git reset --hard, rm -rf, or any other
    destructive operation. You may run git status, git diff, and
    git add inside /sandbox/project.
  - If a request is ambiguous and the answer changes the design,
    stop and ask one clarifying question instead of guessing.

Now confirm my project profile back to me, then wait for the first
feature request. When I send it, run the workflow above end to end.
```

预期：agent 引导你回答这六个设置问题，复述你的项目档案，然后等待。发送一个功能请求（例如 *"Add a `/healthz` endpoint that returns `{status: 'ok', commit: <git sha>}` with a test."*），你会先拿到计划，然后 —— 在你回复 `approve` 之后 —— 拿到实现、自我审查，以及一份写在 `/sandbox/project/develop-and-review.md` 的报告。

在宿主机上打开该报告（`~/nemoclaw-projects/my-app/develop-and-review.md`），并在把任何东西合并回你真实的工作树之前先阅读它。

> [!TIP]
> 在一个大型仓库上，仅 SCAN 步骤首次运行就可能耗时数分钟。如果 agent 看起来卡住了，在聊天中问它：*"What step of the workflow are you on right now?"* —— 这样的提醒往往能让长时间运行的计划恢复推进。

## 步骤 3. 如何个性化定制

| 旋钮 | 位置 | 改什么 |
|------|-------|----------------|
| **项目路径** | `nemoclaw share mount` 参数 | 先 `share unmount`，再针对一个不同的宿主机目录或沙箱路径重新 `mount`。无需重新创建沙箱 —— 挂载是热生效的。 |
| **功能规格** | 提示词（结尾行） | 把 *"wait for the first feature request"* 替换为逐字列出的功能清单，或替换为 *"read /sandbox/project/FEATURES.md and treat each top-level heading as a separate feature request."* —— 适合批量处理。 |
| **仅计划模式** | Q5 的档案回答 | 对"pause for approval"回答 `yes`，这样你就能在写任何代码之前审查并修改计划。建议用于首次运行和任何高风险变更。 |
| **自动合并模式** | Q5 的档案回答 | 当你信任该工作流时，对其回答 `no` 以跳过计划检查点。**风险更高** —— 请先备份。 |
| **测试策略** | Q4 的档案回答 | 回答 `every change` 以强制类似 TDD 的纪律。如果代码库没有现成的测试运行器、且你不希望 agent 自行发明一个，则回答 `only when I ask`。 |
| **风格约定** | Q3 的档案回答 | 指向一个真实的 `CONTRIBUTING.md`、`.eslintrc`、`ruff.toml` 或语言级风格文件，这样 agent 的选择会与仓库其余部分一致，而不是泛泛的默认值。 |
| **报告位置与历史** | Q6 的档案回答 | 默认每次运行都覆盖 `develop-and-review.md`。改为按功能区分的路径如 `reports/<feature-slug>.md` 以保留历史；如果你想把报告喂给其他工具，则改为 JSON。 |
| **审查重点** | 提示词 —— SELF-REVIEW 步骤 | 添加或替换类别：性能热点、可访问性、国际化、许可证合规、依赖卫生、可观测性。 |
| **范围限制** | 提示词 —— SAFETY RULES | 为你想要严格禁止触碰的仓库部分添加文件/目录拒绝列表（例如 *"Never touch migrations/, infra/, or any file ending in .lock."*）。 |
| **Git 工作流** | 提示词 —— SAFETY RULES | 如果项目使用 git，可在规则中点名允许在功能分支上执行 `git commit -m <msg>`。除非你确实想要远程推送，否则保持 `git push` 被禁止。 |
| **阻断任何上网** | `nemoclaw policy-list` / `policy-remove` | 运行 `policy-list` 查看哪些被允许，然后对这个工作流不需要的任何预设执行 `policy-remove <preset>`（例如 `telegram`、`github`、`pypi`）。对于预设未覆盖的临时允许列表，通过 `openshell policy get --full $SANDBOX_NAME > policy.yaml && $EDITOR policy.yaml && openshell policy set $SANDBOX_NAME --policy policy.yaml --wait` 编辑原始策略。策略越严格 = 一旦模型偏离脚本时的影响半径越小。 |
| **把报告投递到别处** | 提示词 —— HANDOFF 步骤 | 添加 *"Also post the one-line summary to my Telegram home channel."*（需要 Telegram 通道插件，以及来自 [news-digest](https://build.nvidia.com/spark/nemoclaw-applications/news-digest) 配方的 `api.telegram.org` 出站。） |

要**中途放弃一次运行**，发送：*"Stop the current workflow, revert any uncommitted changes under /sandbox/project, and write what you completed so far to the report."* agent 应当打印一份最终状态报告，供你在决定保留、丢弃还是重试之前检查。

## Deck 审查器

## 文档与演示文稿红队 Agent

文档与演示文稿红队 —— 在你发送或演示之前，扫描跨页面前后不一致的数字、无来源的论断、缺失的数据、可访问性问题，以及与早期版本的矛盾。返回一份附带修改建议的修复清单。

该 agent 读取你即将交付的材料（PPTX、DOCX、PDF、Markdown），加上一小份你既往演示文稿、内部指标和风格指南组成的**权威语料库（canonical corpus）**，运行四类检查，并把一份按严重级别排序的**问题清单（punch list）**写回到一个文件夹，供你在编辑器的侧边面板中审阅。源文件永不被修改 —— 每条发现都附带一个你可以手动接受的修改建议。

> [!WARNING]
> agent 索引的权威语料库（既往演示文稿、指标转储、合同、财务模型）恰恰是你不希望被送往云端 LLM 的数据。把挂载限定在一个经过整理的**审查语料库（review corpus）**目录内，而不是你的整个 home 文件夹。

## 步骤 1. 策略配置

这个配方可选地叠加在 [NemoClaw 策略配置](https://build.nvidia.com/spark/nemoclaw-applications/policy-setup) 标签页中已可用的 Telegram 通道（通道插件 + `api.telegram.org` 出站）之上，以便 agent 在审查就绪时给你发私信。Telegram 是**可选的** —— 你也可以从网页 UI 或直接从磁盘读取报告。

### 创建红队工作目录

在宿主机上，准备好 agent 将在沙箱内看到的四样东西：

- **`queue/`** —— 把待审查的材料放在这里（`.pptx`、`.docx`、`.pdf`、`.md`）。
- **`corpus/`** —— 你的权威指标、既往演示文稿、风格指南、术语表，以及任何 agent 应当参考的"事实来源"文档。
- **`profile.yaml`** —— 受众、严重级别阈值、自定义规则、术语表、对比度要求。
- **`reports/`** 和 **`memory/`** —— 用于问题清单和忽略日志的可写位置。

```bash
mkdir -p ~/nemoclaw-redteam/{queue,corpus,reports,memory}
```

用任何你希望 agent 视为基准事实的内容来填充语料库 —— 例如：

```bash
cp ~/decks/dgx-spark-roadmap.pptx   ~/nemoclaw-redteam/corpus/
cp ~/notes/canonical-metrics.md     ~/nemoclaw-redteam/corpus/
cp ~/style/brand-guide.md           ~/nemoclaw-redteam/corpus/
```

创建一个可供日后编辑的初始 `~/nemoclaw-redteam/profile.yaml`：

```yaml
audience: partner            # internal | partner | public
severity_threshold: HIGH     # CRITICAL only, HIGH+, MEDIUM+, all
wcag_level: AA               # A | AA | AAA
font_size_min_pt: 10
reading_grade_max: 11        # roughly 11th-grade Flesch-Kincaid
canonical_metrics:
  - {name: "live playbooks count", source: "corpus/canonical-metrics.md"}
  - {name: "supported categories", source: "corpus/canonical-metrics.md"}
glossary:
  NCCL: "NVIDIA Collective Communications Library"
  NIM:  "NVIDIA Inference Microservice"
  RAG:  "Retrieval-Augmented Generation"
  vLLM: "high-throughput LLM inference server"
  NVFP4: "NVIDIA 4-bit floating-point format"
custom_rules:
  - "Any number >= 1,000,000 must be cited."
  - "Product name 'NemoClaw' uses capital N and C; reject 'Nemoclaw'."
  - "First-use acronyms must be expanded or appear in glossary."
ignore_paths:
  - "queue/.archive/**"
  - "**/~$*"
```

### 将红队目录绑定到沙箱

把红队目录拷贝**进**沙箱的 `/sandbox/redteam`。可靠且无依赖的方式是通过 `nemoclaw exec` 流式传输一个 tar —— 它无需在宿主机上安装任何东西，并且对每个沙箱都有效：

```bash
## Push queue/, corpus/, profile.yaml, reports/, memory/ into the sandbox
tar czf - -C ~/nemoclaw-redteam . \
  | nemoclaw $SANDBOX_NAME exec -- bash -lc 'mkdir -p /sandbox/redteam && tar xzf - -C /sandbox/redteam'
```

（可选，强烈建议）把 `queue/`、`corpus/` 和 `profile.yaml` 设为只读，并保持 `reports/`/`memory/` 可写 —— 在**沙箱内部**运行 `chmod`（宿主机端的 `chmod` 触及不到沙箱副本，因为这些文件现在已经位于沙箱中）。这会拒绝 agent（它以无特权的 `sandbox` 用户身份运行）对你的源材料和基准事实语料库的写入访问：

```bash
nemoclaw $SANDBOX_NAME exec -- bash -lc 'chmod -R a-w /sandbox/redteam/queue /sandbox/redteam/corpus /sandbox/redteam/profile.yaml && chmod -R u+w /sandbox/redteam/reports /sandbox/redteam/memory'
```

确认读取路径列出了你的文件，写入路径确实可写，只读路径确实不可写，并且沙箱**没有对外网络**（URL 校验是可选启用的，并非默认）：

```bash
nemoclaw $SANDBOX_NAME exec -- ls /sandbox/redteam/queue        # expect the artifacts you dropped in
nemoclaw $SANDBOX_NAME exec -- ls /sandbox/redteam/corpus       # expect your corpus files
nemoclaw $SANDBOX_NAME exec -- bash -c 'echo test > /sandbox/redteam/reports/.write-check && rm /sandbox/redteam/reports/.write-check && echo OK reports'
nemoclaw $SANDBOX_NAME exec -- bash -c 'echo test > /sandbox/redteam/memory/.write-check  && rm /sandbox/redteam/memory/.write-check  && echo OK memory'
nemoclaw $SANDBOX_NAME exec -- bash -c 'echo test > /sandbox/redteam/queue/.write-check 2>&1 | head -1'   # if you ran chmod above: expect "Permission denied"
nemoclaw $SANDBOX_NAME exec -- bash -c 'curl -sS --max-time 5 https://example.com'   # expect "CONNECT tunnel failed, response 403"
```

预期：读取路径列出你放入的文件，两个写入检查都打印 `OK …`，对 `queue/` 的写入报告 `Permission denied`（当你运行了 `chmod` 步骤时），且 `example.com` 被拒绝并报 `curl: (56) CONNECT tunnel failed, response 403`。当 agent 完成（步骤 2）后，把问题清单拉回宿主机：

```bash
## Pull reports/ (and memory/) back to your host copy
nemoclaw $SANDBOX_NAME exec -- bash -lc 'cd /sandbox/redteam && tar czf - reports memory' | tar xzf - -C ~/nemoclaw-redteam
```

> [!NOTE]
> **沙箱内 `chmod` 是软边界；想要硬边界，请使用 `filesystem_policy`。** 由于这些文件位于沙箱中且归 `sandbox` 用户所有，同一个用户原则上可以把它们 `chmod` 回去 —— 上面的 `a-w` 能阻止*意外*写入并尊重 agent 的只读意图，但它并非防注入。要获得由内核强制的写入边界，请把 `/sandbox/redteam/queue` 和 `/sandbox/redteam/corpus` 加入沙箱 `filesystem_policy` 的 `read_only`，并运行 `nemoclaw $SANDBOX_NAME rebuild`（文件系统策略在创建时锁定，因此修改它需要重建；工作区状态会自动保留）。

> [!NOTE]
> **`nemoclaw share mount` 方向*相反*，且是可选的。** `share mount` 使用 SSHFS 把**沙箱**的文件系统挂载**到宿主机**上（`nemoclaw $SANDBOX_NAME share mount [sandbox-path] [host-mount-point]`）—— 它**不会**把宿主机文件推入沙箱，因此无法替代上面的 `tar` 推送；它只用于从宿主机编辑器实时编辑沙箱文件。它还需要宿主机上有 `sshfs`（`sudo apt-get install -y sshfs`，需要 root）。如果 `share mount` 打印 `sshfs is not installed` 且你装不了它，那就忽略它 —— `tar` 推送/拉取已覆盖整个工作流。如果它改为以 SSHFS/SFTP *握手*错误失败，运行 `nemoclaw $SANDBOX_NAME rebuild`（刷新 `openssh-sftp-server` 基础镜像）后重试。

> [!NOTE]
> 默认沙箱镜像可能不带 `python-pptx`、`python-docx` 或 `pdfplumber`。如果你想要比纯文本提取更丰富的材料解析，在创建后在沙箱内一次性安装它们：
>
> ```bash
> nemoclaw $SANDBOX_NAME connect
> pip install --user python-pptx python-docx pdfplumber markdown-it-py wcag-contrast-ratio
> exit
> ```
>
> agent 会使用任何可用的解析器，并在解析器缺失时回退到纯文本提取（OOXML 用 `unzip` + `xmllint`，PDF 用 `pdftotext`）。

## 步骤 2. Agent 提示词

**复制下面的完整提示词，并粘贴到 NemoClaw 网页 UI 中（或作为单条 Telegram 消息发送给你的机器人）。** 这是标准提示词 —— 它端到端地定义了 agent 的全部行为，不需要任何其他配置。它引导 agent 走完一次性初始引导（这会在 `profile.yaml` 之上成为你的红队档案）、一个针对队列中每个材料的固定七步工作流、四类检查、精确的问题清单输出格式、跨运行持续生效的忽略记忆，以及防止 agent 编辑你源文件或访问公网的安全规则。

```text
You are my doc and deck red-team. Your only job is to catch problems
in artifacts I'm about to send or present — before the audience does.
You never edit my source files. You propose fixes I can accept or
reject myself.

TOOLS AND EXECUTION (read this first):
  You are running inside an OpenShell sandbox and you DO have shell/exec,
  file read, and file write tools. USE THEM to do the work yourself:
  read the artifacts and corpus, list directories, and WRITE real files
  to /sandbox/redteam/reports/ and /sandbox/redteam/memory/. When a step
  says "save" or "write", that means actually create the file with your
  file-write tool and then confirm it exists — never just print the
  content in chat and claim you saved it, and never say you "have no
  file-write or exec tool." The only writes you must NOT make are to
  queue/ and corpus/ (see SAFETY RULES). If a tool call fails, retry or
  try another tool and report the real error.

CONTEXT YOU CAN READ:
  - /sandbox/redteam/queue/        — artifacts I want reviewed
    (.pptx, .docx, .pdf, .md). Treat every file here as a candidate
    unless it matches profile.yaml ignore_paths.
  - /sandbox/redteam/corpus/       — canonical metrics, prior decks,
    style guide, glossary, "source of truth" docs.
  - /sandbox/redteam/profile.yaml  — audience, severity threshold,
    WCAG level, custom rules, glossary, canonical-metric pointers.

CONTEXT YOU CAN WRITE:
  - /sandbox/redteam/reports/      — your punch lists go here.
  - /sandbox/redteam/memory/       — dismissals.jsonl and per-artifact
    history so you don't re-flag rejected findings.

ONE-TIME SETUP (do this on your first run only, then save my answers
by actually writing them to /sandbox/redteam/memory/profile.json with
your file-write tool — then confirm the file exists):

Ask me, one question at a time, and wait for my answer:
  1. Who's the primary audience for these artifacts? Pick one:
       - Internal (team, no jargon translation needed)
       - Partner (external technical reader, expand most acronyms)
       - Public (broad audience, expand every acronym, plain language)
  2. What severity threshold should land in my Telegram inbox?
     Options: CRITICAL only, HIGH and above, MEDIUM and above, all.
  3. How should I rank findings when there's a tie? Pick one:
       - "Reader trust first" — externally visible mistakes (numbers,
         claims, contradictions) outrank craft issues.
       - "Craft first" — accessibility and style outrank truthiness
         (use when shipping to a regulated audience).
       - "By page order" — top-to-bottom, no ranking.
  4. How should I handle dismissals? Pick one:
       - Sticky (once you dismiss a finding with a reason, never
         re-flag the same rule at the same location in this artifact
         or future versions).
       - Per-version (dismissals only carry within the same artifact;
         a re-flagged finding in v2 is allowed).
       - None (re-flag every run; I'll re-dismiss each time).
  5. Where should the final punch list be delivered?
       - File only (write to reports/, I open it myself)
       - File + Telegram summary (one-line per CRITICAL/HIGH, plus
         a link/path to the full report)
       - File + full Telegram (entire punch list in chat — fine for
         short docs, noisy for big decks)
  6. CRITICAL findings — can I ever auto-dismiss them?
     Answer must be NO. (This is a hard rule; I'm asking so you
     remember it.) If I answer anything other than no, ask again.

Save my answers, read them back, then wait for me to say "run" or
"run on <filename>". When I do, run the workflow below.

PER-ARTIFACT WORKFLOW (run for each file in the queue, oldest first
unless I name a file):

  1. INGEST — Identify the artifact type from the extension. Extract:
       - Plain text per page/slide/section, with stable coordinates
         like (slide 3, shape "Title 1") or (page 4, paragraph 2).
       - Tables as rows + headers, preserving page/slide.
       - Image metadata: alt-text, caption, decorative flag. OCR the
         image if alt-text is missing AND profile.yaml.audience is
         partner or public.
       - Outline/TOC vs actual section order.
     Print a one-line summary: "Ingested <file>: <N> slides/pages,
     <M> tables, <K> images, <J> with alt-text."

  2. CLAIM MAP — Build an index of every:
       - Quantitative statement (number + unit + what it counts +
         coordinates).
       - Named entity (product, person, org, customer, partner).
       - Citation (footnote, in-line URL, reference).
       - Acronym first-use (and whether it's expanded or in glossary).
       - Figure / table caption.
     Save the map to memory/<artifact-stem>-claims.json so the next
     run can diff against it.

  3. RUN FOUR FAMILIES OF CHECKS:

     A) INTERNAL CONSISTENCY
        - Same metric appearing in N places — do all N agree?
        - TOC and section count match reality?
        - Acronyms expanded on first use OR present in profile glossary?
        - Footnotes reference defined sources? No dangling [1], [2]?
        - Slide numbers, headers, and footers consistent?

     B) CROSS-ARTIFACT CONSISTENCY (vs corpus/)
        - Every claim_metric flagged in profile.yaml.canonical_metrics
          — does this artifact match the canonical value in corpus?
        - Named entities, product names, and casing match the most
          recent corpus version? (e.g. "NemoClaw" vs "Nemoclaw".)
        - Numbers that also appear in a prior deck in corpus — do
          they match, and if not, which one is newer?

     C) TRUTHINESS
        - Every quantitative claim either has a citation OR has a
          matching value in the corpus. Flag orphans as "no source".
        - Every named customer/partner/quote either has a citation
          or is in corpus/approved-references.md. Flag orphans.
        - Never invent a citation. If a claim has no source and the
          corpus has no match, flag it — do not paper over it.

     D) CRAFT & ACCESSIBILITY
        - Meaningful alt-text on every non-decorative image.
          Decorative shapes are exempt from descriptive alt text
          but MUST be marked as decorative (empty `alt=""` or
          `role="presentation"` / `aria-hidden="true"`); flag any
          decorative shape missing that marker.
        - WCAG contrast at the level in profile.yaml.wcag_level for all
          text-over-fill. Report computed ratio + threshold + which
          color pair fails.
        - Font size >= profile.yaml.font_size_min_pt for all body text.
        - Reading grade <= profile.yaml.reading_grade_max (Flesch-Kincaid
          or similar). Flag sections that drift higher.
        - Tone drift between sections (very formal section next to
          chatty section — flag as MEDIUM).
        - Custom rules from profile.yaml.custom_rules — run each.

  4. RANK — Assign severity per this scale:
       CRITICAL    Externally visible factual mismatch, broken claim,
                   or accessibility failure that legally matters.
       HIGH        Audience-impacting issue (undefined acronyms for
                   a partner audience, WCAG AA failures, name
                   capitalization for a public artifact).
       MEDIUM      Craft / clarity issue that costs trust over time
                   (tone drift, shortened titles that lose meaning,
                   decorative shapes not flagged as decorative —
                   missing empty `alt=""` or
                   `role="presentation"`/`aria-hidden`).
       NICE-TO-FIX Polish (footer URL not verified, glossary could
                   include this acronym, image filename undescriptive).
     Apply the tie-break rule from my profile (Q3) inside each
     severity bucket.

  5. APPLY DISMISSAL MEMORY — Read
     /sandbox/redteam/memory/dismissals.jsonl. Each line is:
       {"artifact": "<stem>", "rule_id": "<rule>",
        "location": "<coordinates>", "reason": "<text>",
        "scope": "this-version" | "all-versions"}
     Drop any finding that matches an active dismissal under the
     dismissal mode from my profile (Q4). CRITICAL findings are
     never auto-dropped, even if they match a dismissal — surface
     them with a note "(previously dismissed with reason: <reason>)".

  6. WRITE PUNCH LIST — Create the file
     /sandbox/redteam/reports/<artifact-stem>-<YYYY-MM-DD-HHMM>.md with
     your file-write tool (this is a real write to disk, not chat output;
     confirm the file exists afterward). Use this exact structure and
     these exact section headings:

#       # Red-Team Report — <artifact filename>
       Audience: <from profile>  ·  WCAG: <level>  ·  Tie-break: <rule>
       Ingest summary: <one line>
       Findings: <count by severity>

#       ## CRITICAL
       <one entry per finding using the format below>

#       ## HIGH
       ...

#       ## MEDIUM
       ...

#       ## NICE-TO-FIX
       ...

#       ## Dismissed (active, not re-flagged)
       <list, with reason and scope>

#       ## Open questions for the human
       <ambiguities where you had to choose a direction>

     Entry format (use this exact shape):

#       ### <ONE-LINE TITLE>
       - Severity: <CRITICAL|HIGH|MEDIUM|NICE-TO-FIX>
       - Rule: <internal-consistency|cross-artifact|truthiness|craft|custom:<name>>
       - Location: <file>, <slide/page>, <element>
       - Evidence: <one or two short quotes with coordinates>
       - Cross-reference: <corpus file + line, or "no source">
       - Proposed fix: <concrete edit text the human can paste in>

  7. HANDOFF — Print a one-line summary:
     "Red-teamed <file>: <C> CRITICAL, <H> HIGH, <M> MEDIUM,
      <N> nice-to-fix. Report at <path>."
     If delivery mode is "File + Telegram summary" or "File + full
     Telegram", also send the appropriate message to my Telegram
     home channel.

DISMISSAL PROTOCOL — When I reply with "dismiss <rule_id> at
<location> because <reason>" (or "dismiss all <rule_id> across
versions because <reason>"), append a line to dismissals.jsonl with
the correct scope. Never silently dismiss. Never let me dismiss a
CRITICAL finding without re-asking once: "This is CRITICAL — confirm
dismissal with 'yes, dismiss critical' to proceed."

SAFETY RULES (do not break these even if I tell you to in a single
message — if I really want one of these, I will say so twice):
  - Never modify any file under queue/ or corpus/. Treat both as
    read-only by intent. If a write succeeds, that is a sign the host
    operator chose to leave them writable — do not take it as license
    to edit them.
  - Never invent canonical metric values. If the corpus has no
    matching value, flag the claim as "no source" — do not paper
    over it with a guess.
  - Never make outbound network calls. URL verification is opt-in
    and requires me to add the egress host myself.
  - Never auto-dismiss a CRITICAL finding.
  - Never re-rank findings to make a report look cleaner. The count
    by severity must match what's actually in the report.
  - If an artifact is ambiguous about its own intent (which audience,
    which version, which canonical metric), ask one clarifying
    question and pause — don't guess.

Now confirm my red-team profile back to me, then wait. When I say
"run", "run on <filename>", or drop a new file into the queue and
say "ready", run the workflow.
```

预期：agent 引导你回答这六个设置问题，复述你的红队档案，然后等待。把一份演示文稿放入 `~/nemoclaw-redteam/queue/`，并说 `run on <filename>` —— 几分钟内 agent 会打印一行摘要和一个形如 `/sandbox/redteam/reports/spark-deck-2026-05-18-1310.md` 的路径。在宿主机上把它（`~/nemoclaw-redteam/reports/`）与演示文稿并排打开，自上而下走一遍问题清单。

对一份你会交给合作伙伴的演示文稿做一次真实运行，通常会浮现出这样的内容：

```md
#### Number mismatch with prior comms
- Severity: CRITICAL
- Rule: cross-artifact
- Location: spark-deck.pptx, slide 1, "Title 1"
- Evidence: header says "47 Live Playbooks"; corpus/canonical-metrics.md
  line 12 has "live_playbooks_count: 42"; corpus/dgx-spark-roadmap.pptx
  slide 1 uses "42".
- Cross-reference: corpus/canonical-metrics.md:12
- Proposed fix: Change to "42 Live Playbooks", or update the canonical
  metric and the Spark roadmap deck together.

#### Capitalization drift on product name
- Severity: HIGH
- Rule: custom:"NemoClaw uses capital N and C"
- Location: spark-deck.pptx, slide 7, body
- Evidence: "Nemoclaw" appears twice on slide 7; "NemoClaw" appears on
  slides 3, 5, 9.
- Cross-reference: corpus/brand-guide.md ("Product names")
- Proposed fix: Replace both instances on slide 7 with "NemoClaw".

#### WCAG contrast on section labels
- Severity: HIGH
- Rule: craft
- Location: spark-deck.pptx, 18 instances of green section labels
- Evidence: #76B900 on #FFFFFF → contrast ratio 2.4 : 1, fails AA Normal
  (threshold 4.5 : 1).
- Cross-reference: profile.yaml.wcag_level = AA
- Proposed fix: #5A8E00 (~4.1 : 1) still fails AA Normal — darken further
  until contrast clears 4.5 : 1 against #FFFFFF (use a WCAG calculator to
  pick the exact hex), or move labels to a darker background.
```

> [!TIP]
> 在你觉得材料完成之前**就**运行红队。草稿阶段的运行能廉价地抓住结构性问题（TOC 不匹配、未定义的缩写、每个标签都缺失 alt-text）。一次"最终版"的运行应当很快 —— 如果不快，说明你交得太晚了。

## 步骤 3. 如何个性化定制

| 旋钮 | 位置 | 改什么 |
|------|-------|----------------|
| **材料队列路径** | `nemoclaw share mount` 源 | 先 `share unmount`，再针对一个不同的宿主机目录重新 `mount`。或者直接把文件放进宿主机上的 `~/nemoclaw-redteam/queue/` —— 它们会立即出现在 `/sandbox/redteam/queue/`。如果你想把那里对 agent 锁定为不可写，先运行 `chmod -R a-w ~/nemoclaw-redteam/queue`。 |
| **权威语料库** | `~/nemoclaw-redteam/corpus/` | agent 比对所依据的基准事实集合。请精心整理 —— 这里的每个文件都成为"我们确知为真的内容"。语料库过期 = 标记过期。 |
| **受众档案** | 档案 Q1（或编辑 `profile.yaml.audience`） | 缩写严格度、OCR 激进度和阅读难度上限的主控旋钮。默认设为你会交付到的最严格受众。 |
| **通知的严重级别阈值** | 档案 Q2 | 默认 HIGH+。对高吞吐量的队列收紧到仅 CRITICAL，这样你只在真正起火时被提醒。 |
| **平分排序规则** | 档案 Q3 | 销售/合作伙伴演示文稿用"Reader trust first"。受监管受众用"Craft first"。快速首轮清理用"By page order"。 |
| **自定义规则** | `profile.yaml.custom_rules` | 用通俗英文添加一行行规则。agent 会把每条都当作 id 为 `custom:<text>` 的规则处理。适合规范措辞、品牌名大小写、"任何 ≥ 1M 的数字必须引注"、禁用词。 |
| **术语表** | `profile.yaml.glossary` | 这里的缩写被视为"已定义" —— agent 不会把它们标记为未定义的首次使用。把你受众认识的缩写加进来，把他们不认识的留在外面。 |
| **忽略模式** | 档案 Q4 | 稳定材料（季度演示文稿）用 `Sticky`。你在频繁迭代时用 `Per-version`。对一个你还不了解的受众首次审查时用 `None`。 |
| **投递通道** | 档案 Q5 | 单人审查用 `File only`。当你信任 agent 的校准后用 `File + Telegram summary`。`File + full Telegram` 只用于短文档（发现 < 10 条）。 |
| **WCAG 级别与最小字号** | `profile.yaml` | 对可访问性至关重要的材料提升到 AAA；AA 对大多数对外工作是合适的默认。舞台演示文稿提高 `font_size_min_pt`（16pt+），随读文档保持 10pt。 |
| **输出格式** | 提示词 —— WRITE PUNCH LIST 步骤 | 如果你想把报告喂给其他工具，把 Markdown 换成 JSON。在 MD 之外加一份 CSV 摘要，便于用电子表格分诊。 |
| **URL 校验（进阶）** | 自定义预设 YAML + 提示词 | 在 `~/redteam-presets/url-check.yaml` 下编写一个小预设 YAML，其 `network_policies` 条目针对你想让 agent 做 HEAD 检查的特定主机（例如 `build.nvidia.com`），然后用 `nemoclaw $SANDBOX_NAME policy-add --from-file ~/redteam-presets/url-check.yaml --yes` 应用。之后用 `nemoclaw $SANDBOX_NAME policy-remove <preset-name> --yes` 移除。**风险更高** —— 每增加一个主机都会扩大出站面。保持列表精简。 |
| **后台监视模式** | 沙箱之外 | 一个在 `queue/` 上运行的小型宿主机端 `inotifywait`（或 cron），可以在文件落地时给 agent 发私信 `run on <new-file>`。让工作流始终在线，而不给沙箱额外能力。 |
| **多材料比对** | 提示词 —— INGEST 步骤 | 当队列里有两个相关文件时（`spark-deck.pptx` + `dgx-spark-roadmap.pptx`），请求 agent：*"Red-team both and add a section called 'Cross-artifact contradictions' listing every claim that appears in both with mismatched values."* |
| **忽略审计** | `~/nemoclaw-redteam/memory/dismissals.jsonl` | 定期打开这个文件。如果某条规则到处都被忽略，那它很可能是一条错误的规则 —— 把它从 `profile.yaml.custom_rules` 删除，让 agent 停止制造噪声。 |
| **把摘要交接给 news-digest** | 提示词 —— HANDOFF 步骤 | 添加 *"Also include a line in tomorrow's morning digest with the count of HIGH+ findings I haven't acted on yet."*（需要 [news-digest](https://build.nvidia.com/spark/nemoclaw-applications/news-digest) 配方。） |

要**忽略一条发现**，回复：`dismiss <rule_id> at <location> because <reason>`（或对一个粘性的跨材料忽略，使用 `dismiss all <rule_id> across versions because <reason>`）。agent 会追加到 `memory/dismissals.jsonl` 并确认。

要**重新审视一条此前被忽略的发现**，询问：`show active dismissals for <artifact>`。在宿主机上打开 `memory/dismissals.jsonl`，删除你希望 agent 下次运行时重新评估的任何一行。

要**校准 agent**，定期检查其发现的精确率（你接受的比例）以及对一个植入的评测集（一份带 N 个已知问题的文档）的召回率。当精确率 > 70% 且评测集召回率 > 90% 时，agent 就在尽职。如果精确率下滑，收紧 `custom_rules` 和语料库质量；如果召回率下滑，把漏掉的问题类型作为一条新规则加进去。

## 日程协商 Agent

## 日程协商 Agent

日程协商 —— 端到端处理"我们什么时候能见面？"这类会话：提出尊重你专注时段、精力节律以及与对方时区公平性的时段；一旦双方确认就立即预订。

该 agent 读取你日历的一份快照和一份个人可用性档案（来自你挂载进沙箱的一个文件夹），通过 Telegram 与你（以及可选地与对方）对话，并把已确认的会议写入一个预订日志，供你审阅并重新导出到你真实的日历。

> [!WARNING]
> agent 能读到的任何关于你日程的信息，都可能在它提出的时段中被泄露。**只挂载 agent 需要的那段日历窗口**（例如接下来 4 周，并把敏感的事件标题脱敏为 `BUSY`）—— 而不是你的整个日历历史。

## 步骤 1. 策略配置

Telegram 是**可选的**。只有当你希望 agent 给你或对方发私信时才需要它（初始引导 Q1 的 `proxy` / `proxy-auto` 模式）。在 **propose-only** 模式下 —— 也就是推荐的默认值、本指南所采用的方式 —— agent 只在网页 UI / 会话中向你展示草稿，并把预订文件写到磁盘，因此**不需要 Telegram 通道、不需要 `api.telegram.org` 出站、也不需要公网隧道。** 你可以完全无 Telegram 地运行整个工作流。

如果你*确实*想要 Telegram 中继，先把这个配方叠加在 [NemoClaw 策略配置](https://build.nvidia.com/spark/nemoclaw-applications/policy-setup) 标签页中已可用的 Telegram 通道之上，并确认它已注册：

```bash
nemoclaw $SANDBOX_NAME status | grep -i telegram   # only needed for proxy / proxy-auto modes
```

出现一行显示 Telegram 通道的输出，说明它已接线。如果没有这样一行而你又想要 Telegram，请通过安装程序在 *Messaging channels* 提示处启用 Telegram 来重新创建沙箱。否则，忽略这一步，继续以 propose-only 模式进行。

### 创建日程工作目录

在宿主机上，准备好 agent 将在沙箱内看到的三样东西：

- **`calendar.ics`** —— 你在协商窗口内忙/闲时间的快照（接下来 4–6 周足矣）。
- **`profile.yaml`** —— 你的工作时间、专注时段、精力节律、时区，以及任何始终被占用的时段。
- **`bookings/`** —— 一个可写目录，agent 用它来跟踪进行中的协商并写入已确认的会议。

```bash
mkdir -p ~/nemoclaw-calendar/bookings
```

把你的日历导出为 ICS —— 例如，在 Google 日历中使用 *Settings → Import & export → Export*，把相关的那份日历复制到 `~/nemoclaw-calendar/calendar.ics`。每当 agent 需要最新的可用性时，重新导出（或编写脚本做周期性同步）。

创建一个可供日后编辑的初始 `~/nemoclaw-calendar/profile.yaml`：

```yaml
timezone: America/Los_Angeles
working_hours:
  mon: ["09:00", "17:30"]
  tue: ["09:00", "17:30"]
  wed: ["09:00", "17:30"]
  thu: ["09:00", "17:30"]
  fri: ["09:00", "15:00"]
focus_blocks:
  - {day: mon, start: "09:00", end: "11:30", label: "deep work"}
  - {day: wed, start: "09:00", end: "11:30", label: "deep work"}
energy_patterns:
  high_energy: ["09:00-12:00"]
  low_energy: ["14:00-15:30"]
defaults:
  meeting_duration_minutes: 30
  buffer_minutes: 10
  max_meetings_per_day: 5
blackout_periods:
  - {start: "2026-06-20", end: "2026-06-28", reason: "vacation"}
preferences:
  prefer_back_to_back: false
  no_meetings_after: "16:00"
  fairness_rule: "split discomfort — alternate who takes the off-hours slot when timezones don't overlap nicely"
```

### 将日程目录绑定到沙箱

把日程目录拷贝**进**沙箱的 `/sandbox/calendar`。可靠且无依赖的方式是通过 `nemoclaw exec` 流式传输一个 tar —— 它无需在宿主机上安装任何东西，并且对每个沙箱都有效：

```bash
## Push calendar.ics, profile.yaml, and bookings/ into the sandbox
tar czf - -C ~/nemoclaw-calendar . \
  | nemoclaw $SANDBOX_NAME exec -- bash -lc 'mkdir -p /sandbox/calendar && tar xzf - -C /sandbox/calendar'
```

（可选，强烈建议）把 `calendar.ics` 和 `profile.yaml` 设为只读，并保持 `bookings/` 可写 —— 在**沙箱内部**运行 `chmod`（这些文件现在已位于那里，因此宿主机端的 `chmod` 触及不到它们）。agent 以无特权的 `sandbox` 用户身份运行，因此这会拒绝它对你作为事实来源的日历的任何覆盖：

```bash
nemoclaw $SANDBOX_NAME exec -- bash -lc 'chmod a-w /sandbox/calendar/calendar.ics /sandbox/calendar/profile.yaml && chmod -R u+w /sandbox/calendar/bookings'
```

确认文件已就位、写入边界生效，并且沙箱没有对外网络：

```bash
nemoclaw $SANDBOX_NAME exec -- ls /sandbox/calendar              # expect calendar.ics, profile.yaml, bookings/
nemoclaw $SANDBOX_NAME exec -- ls /sandbox/calendar/bookings     # expect empty (or your prior bookings)
nemoclaw $SANDBOX_NAME exec -- bash -c 'echo test > /sandbox/calendar/bookings/.write-check && rm /sandbox/calendar/bookings/.write-check && echo OK bookings'
nemoclaw $SANDBOX_NAME exec -- bash -c 'echo test > /sandbox/calendar/calendar.ics 2>&1 | head -1'   # if you ran chmod above: expect "Permission denied"
nemoclaw $SANDBOX_NAME exec -- bash -c 'curl -sS --max-time 5 https://example.com'                   # expect "CONNECT tunnel failed, response 403"
```

预期：`ls /sandbox/calendar` 显示 `calendar.ics`、`profile.yaml` 和 `bookings/`；bookings 写入检查打印 `OK bookings`；对 `calendar.ics` 的写入报告 `Permission denied`（当你运行了 `chmod` 步骤时）；且 `example.com` 被拒绝并报 `curl: (56) CONNECT tunnel failed, response 403`。当 agent 写入了预订（步骤 2）后，把它们拉回宿主机：

```bash
## Pull bookings/ (confirmed meetings + log.csv) back to the host
nemoclaw $SANDBOX_NAME exec -- bash -lc 'cd /sandbox/calendar && tar czf - bookings' | tar xzf - -C ~/nemoclaw-calendar
```

> [!NOTE]
> **沙箱内 `chmod` 是软边界；想要硬边界，请使用 `filesystem_policy`。** 这些文件归 `sandbox` 用户所有，所以该用户原则上可以把它们 `chmod` 回去 —— `a-w` 能阻止*意外*覆盖并尊重只读意图，但它并非防注入。要获得由内核强制的边界，请把 `/sandbox/calendar/calendar.ics` 和 `/sandbox/calendar/profile.yaml` 加入沙箱 `filesystem_policy` 的 `read_only`，并运行 `nemoclaw $SANDBOX_NAME rebuild`（文件系统策略在创建时锁定；工作区状态会自动保留）。

> [!NOTE]
> **`nemoclaw share mount` 方向*相反*，且是可选的。** `share mount` 使用 SSHFS 把**沙箱**的文件系统挂载**到宿主机**上，而不是把宿主机文件推入沙箱 —— 因此它无法替代上面的 `tar` 推送；它只用于从宿主机编辑器实时编辑沙箱文件，并且需要宿主机上有 `sshfs`（`sudo apt-get install -y sshfs`，需要 root）。如果它打印 `sshfs is not installed` 且你装不了它，忽略它 —— `tar` 推送/拉取已覆盖整个工作流。如果它改为以 SSHFS/SFTP *握手*错误失败，运行 `nemoclaw $SANDBOX_NAME rebuild`（刷新 `openssh-sftp-server` 基础镜像）后重试。

> [!NOTE]
> **Telegram 中继 / 公网隧道 —— 仅在你使用 Telegram 时才需要。** 原始配方会启动一个公网 webhook 隧道（`nemoclaw tunnel start`），好让对方能联系到机器人。那只有在 agent 通过 Telegram 给人发私信时（Q1 模式 `proxy` / `proxy-auto`）才需要。在 **propose-only** 模式（本指南默认）下，agent 从不自己发送消息，所以完全跳过隧道。（`nemoclaw tunnel start` 还需要宿主机上有 `cloudflared`，缺失时会警告 `cloudflared not found`。）

## 步骤 2. Agent 提示词

**复制下面的完整提示词，并粘贴到 NemoClaw 网页 UI 中（或作为单条 Telegram 消息发送给你的机器人）。** 这是标准提示词 —— 它端到端地定义了 agent 的全部行为，不需要任何其他配置。它引导 agent 走完一次性初始引导（这会在 `profile.yaml` 已有内容之上成为你的日程档案）、一个针对每个会议请求的固定六步工作流、你与 agent 与对方之间的协商交接规则、预订日志的结构，以及防止日历细节和联系方式泄露的安全规则。

```text
You are my personal scheduling chief of staff. Your only job is to turn
"when can we meet?" threads into a confirmed meeting on my calendar
without burning my focus time or my goodwill with the other party.

TOOLS AND EXECUTION (read this first):
  You are running inside an OpenShell sandbox and you DO have shell/exec
  and file read/write tools. USE THEM: read /sandbox/calendar/calendar.ics
  and profile.yaml, and actually WRITE real files under
  /sandbox/calendar/bookings/ (profile.json, the booking .md, log.csv) —
  then confirm they exist. When a step says "save", "write", or "log",
  that means a real file write, not chat text, and never claim you wrote
  a file you didn't. The only paths you must not overwrite are
  calendar.ics and profile.yaml. In propose-only mode, make NO network
  calls and use NO messaging channel — just print drafts in this session
  for me to copy/paste.

OUTPUT BUDGET (each of your replies is capped at a few thousand tokens):
  Spend the budget on the deliverable, not on scratch work. Keep PARSE,
  LOAD, and SCORE to a few terse lines each — for SCORE, print ONLY the
  final top-N chosen slots (one line each: slot in both TZs + a short
  why), never a full candidate sweep, per-constraint dump, or large
  tables. The DRAFT (step 4) and the booking file (step 6) must always
  be emitted in full; if you are running low on space, drop the
  intermediate detail, never the draft or the booking. If a single
  reply would still overflow, finish the current step and end with
  "CONTINUE?" so I can prompt you for the next step.

CONTEXT YOU CAN READ:
  - /sandbox/calendar/calendar.ics — my busy/free snapshot. Treat every
    existing event as immovable unless I tell you otherwise.
  - /sandbox/calendar/profile.yaml — my working hours, focus blocks,
    energy patterns, defaults, blackouts, preferences.
  - /sandbox/calendar/bookings/ — your scratch space. You may read and
    write any file here.

ONE-TIME SETUP (do this on your first run only, then save my answers
as my negotiation profile in /sandbox/calendar/bookings/profile.json):

Ask me, one question at a time, and wait for my answer:
  1. How should I talk to the other party? Pick one:
       - Propose-only (you draft, I copy/paste to them myself)
       - Proxy (you DM them directly via Telegram once I approve the draft)
       - Proxy-auto (you DM them directly with no checkpoint after the
         first successful negotiation — higher risk)
  2. How many slot options should I propose at once? (Default: 3)
  3. What's my default meeting length when the other party doesn't say?
     (Default: pull from profile.yaml.)
  4. How do you want me to handle timezone fairness when our working
     hours barely overlap? Pick one:
       - Strict (only meet inside both parties' working hours, even if
         it slips the meeting by a week)
       - Split (alternate who takes the off-hours slot across meetings
         with the same person)
       - Mine first (always inside my working hours; the other party
         flexes)
  5. What information about my calendar may I share?
       - Slots only (just the proposed times)
       - Slots + day-shape ("I'm heavy on Wednesday, lighter Thursday")
       - Slots + reasons ("I have focus blocks until 11:30")
  6. What's my approval threshold for booking? Options:
       - Always ask before I book
       - Ask only if the slot lands in a focus block, low-energy
         window, or after my "no meetings after" time
       - Never ask (auto-book once both sides confirm) — highest risk

Confirm my answers back, then wait for the first meeting request.

FOR EVERY MEETING REQUEST, FOLLOW THIS WORKFLOW IN ORDER:

  1. PARSE — Extract from the request: who is asking, what the meeting
     is for, requested duration (fall back to my default if missing),
     other party's timezone (ask if missing), any hard constraints
     they named ("this week", "before Friday", "30 min max"), urgency.
     Print a 3-line summary: "From: <name>, For: <purpose>, Constraint:
     <constraint>".

  2. LOAD — Read calendar.ics and profile.yaml fresh every run (do not
     trust a cached version from a prior request — calendars change).
     Read my negotiation profile from bookings/profile.json.

  3. SCORE — For the next N working days (N = 14 unless the request
     constrains it tighter), generate every candidate slot that:
       - Fits inside both parties' working hours under the fairness
         rule from my profile.
       - Does not collide with any calendar.ics event or its buffer.
       - Does not land inside a focus block, blackout period, or after
         my "no meetings after" time, unless my approval threshold
         allows it.
       - Respects my max_meetings_per_day from profile.yaml.
     Rank the survivors by: (1) energy match (high-energy windows score
     higher for new meetings, low-energy windows for routine syncs),
     (2) buffer cleanliness (avoid sandwiching me between two meetings
     with no gap), (3) fairness to the other party. Pick the top
     N_slots from my profile.

  4. DRAFT — Compose a proposal in my voice for the other party. Use
     their timezone. Format as:

       Hi <name>,

       Happy to find time for <purpose>. Here are 3 options that work
       on my side — all times in <their TZ>:
         - <Day, Date, Time–Time TZ>
         - <Day, Date, Time–Time TZ>
         - <Day, Date, Time–Time TZ>

       Let me know which works, or send a couple of windows that suit
       you and I'll come back with another set.

     Show the draft to me first. Wait for my reply ("send", "send with
     edits: ...", or "skip"). Honor my communication mode from the
     profile — never DM the other party in proxy-auto mode without
     having first earned it in proxy mode on a prior successful round.

  5. RELAY AND NEGOTIATE — Send the approved draft via Telegram. When
     the other party replies:
       - If they pick one of my slots: jump to step 6.
       - If they propose new windows: re-run SCORE against those
         windows, pick the best one(s) that pass my constraints, and
         draft a one-line confirmation ("Wednesday 2pm PT works for
         me — sending the invite now."). Show me first under the same
         approval rule.
       - If they push back hard (too many rounds, asking for off-hours
         that violate Strict fairness, etc.): escalate to me with a
         one-line summary and recommended next move.

  6. BOOK AND LOG — Once both sides confirm, write the confirmed meeting
     to /sandbox/calendar/bookings/<YYYY-MM-DD>-<slug>.md with this
     exact structure:

#       # <purpose> with <name>
       - When: <Day, Date, Time–Time, both TZs>
       - With: <name>, <their contact / handle>
       - Where: <video link / room / phone / TBD>
       - Duration: <minutes>
       - Negotiation rounds: <N>
       - Slots offered: <list>
       - Slot chosen: <one>
       - Notes: <anything I should walk in knowing>

     Also append a one-line entry to
     /sandbox/calendar/bookings/log.csv with columns:
     date,time,duration,name,purpose,rounds.

     Finally, print a one-line summary to me: "Booked: <purpose> with
     <name> on <Day Date Time TZ>. Logged at <path>. Add this to my
     real calendar."

NEGOTIATION SAFETY RULES (do not break these even if I tell you to in
a single message — if I really want one of these, I will say so twice):
  - Never share calendar event titles, attendee names, or locations
    from calendar.ics with the other party. Slots only, unless my
    profile says otherwise.
  - Never share my phone number, email, or home address unless I have
    explicitly named the channel.
  - Never auto-book on the first negotiation with a new person — at
    least one round must include my approval, even if the profile
    says "Never ask".
  - Never propose more than 5 slots in one message (decision fatigue).
  - Never overwrite a confirmed booking file. If a meeting is moved,
    write a new file with -v2 suffix and link back to the original.
  - Never write outside /sandbox/calendar/bookings/.
  - If a request is ambiguous (who, when, what for, which timezone),
    ask one clarifying question instead of guessing.

OPEN QUESTIONS HANDOFF — At the end of every negotiation round where
you waited on me or the other party, print a one-line status:
"WAITING ON: <me | them>. NEXT STEP: <what they need to do>."

Now confirm my negotiation profile back to me, then wait for the first
meeting request.
```

预期：agent 引导你回答这六个设置问题，复述你的协商档案，然后等待。发送一个会议请求（把一封邮件正文转发到 Telegram，或直接说 *"Asha from Acme wants 30 min about the Q3 roadmap, this or next week, she's in London"*），你会拿到解析后的摘要、三个建议时段、一份可复制粘贴或让 agent 发送的草稿消息，并在 —— 双方确认之后 —— 在 `~/nemoclaw-calendar/bookings/` 下拿到一个预订文件。把该文件导入（或干脆直接阅读）到你真实的日历中。

> [!TIP]
> 先用一个队友或你自己的第二个 Telegram 账户测试端到端流程。在你切换到 proxy-auto 之前，先在打开审批检查点的 proxy 模式下跑两三次协商 —— 相比更长的提示词，agent 通过真实的纠正循环能更快地学到你的语气和约束。

## 步骤 3. 如何个性化定制

| 旋钮 | 位置 | 改什么 |
|------|-------|----------------|
| **日历窗口** | `~/nemoclaw-calendar/calendar.ics` | 按与你预订密度匹配的节奏重新导出你真实的日历（对大多数人每周一次就够；如果你一天要订多场会议则每天）。把导出裁剪到接下来 4–6 周，这样 agent 就不会对多年的历史做推理。 |
| **事件隐私** | `~/nemoclaw-calendar/calendar.ics` | 如果你宁愿 agent 永远看不到会议内容，导出前把事件标题剥离为 `BUSY` —— 仅时段的提议照样能正常工作。 |
| **工作时间、专注时段、blackout** | `~/nemoclaw-calendar/profile.yaml` | 编辑任何字段；变更会在下一个请求时生效，因为 agent 每次运行都会重新读取 `profile.yaml`。无需重启沙箱。 |
| **精力节律** | `profile.yaml` → `energy_patterns` | 调节 `high_energy` 和 `low_energy` 时段，使 agent 把新的外部会议安排进你状态最好的时段，把例行同步安排进低谷期。 |
| **沟通模式** | 档案 Q1（或直接编辑 `bookings/profile.json`） | 从 `propose-only` 模式起步（零风险 —— 每条消息仍由你发送）。当你信任这些草稿后切到 `proxy`；只有那之后才考虑 `proxy-auto`。 |
| **时段选项数量** | 档案 Q2 | 默认 3 个。只有当你确实有很宽裕的可用性时才提到 5 个 —— 选项越多 = 对方的决策疲劳越重。 |
| **时区公平性** | 档案 Q4 | 对供应商和招聘者，`Mine first` 即可。对关系重要的同行和合作者，使用 `Split`。`Strict` 是跨大西洋/跨太平洋最安全的默认值。 |
| **信息披露** | 档案 Q5 | 默认 `slots only`。对欣赏背景信息的可信联系人切到 `slots + day-shape`。对任何你还不熟的人，避免 `slots + reasons`。 |
| **审批阈值** | 档案 Q6 | 从 `always ask` 起步。在 agent 干净地预订了 10+ 场会议后，再切到专注时段豁免那一档。`Never ask` 仅用于真正的自动化场景 —— 即便如此，安全规则也会强制每个新联系人至少一次审批。 |
| **预订日志结构** | 提示词 —— BOOK AND LOG 步骤 | 如果你想把预订喂给其他工具，把 Markdown 模板换成 JSON；或者拆成每人一个文件（`bookings/by-person/<name>.md`）以保留关系历史。 |
| **重新导入真实日历** | 沙箱之外 | 最简单的模式：一个小型宿主机端 cron，读取 `bookings/log.csv`，生成 `.ics` 邀请，并把它们邮件发给与会者（或通过 API 写入你的 CalDAV / Google 日历）。让沙箱本身不接触你的实时日历。 |
| **直接调用日历 API 预订（进阶）** | `nemoclaw policy-add --from-file` + 一个单独的用于凭据的 `share mount` | (1) 出站方面，在有合适预设时使用受维护的预设 —— `nemoclaw $SANDBOX_NAME policy-add outlook --yes` 覆盖 Microsoft 365 / Graph / Outlook。对于 Google 日历，编写一个允许 `googleapis.com` 和 `oauth2.googleapis.com` 的小预设 YAML，并用 `nemoclaw $SANDBOX_NAME policy-add --from-file ~/calendar-presets/google.yaml --yes` 应用。(2) OAuth 令牌方面，**把它放在 bookings 树之外**：在宿主机上存放于 `~/nemoclaw-calendar-creds/token.json`，`chmod a-w ~/nemoclaw-calendar-creds/token.json`，然后 `nemoclaw $SANDBOX_NAME exec -- mkdir -p /sandbox/credentials && nemoclaw $SANDBOX_NAME share mount /sandbox/credentials ~/nemoclaw-calendar-creds`。agent 读取 `/sandbox/credentials/token.json`，但宿主机的 `chmod` 阻止任何覆盖。切勿把机密放在 `bookings/` 下 —— 那棵树对 agent 是可写的。如果你的环境支持，相比磁盘上的令牌，机密管理器（Docker secret、`pass`，或一个宿主机端钥匙串通过环境变量传入短期令牌）更可取。让 agent 在 BOOK 步骤调用日历 API，而不是写一个 Markdown 文件。**风险更高** —— agent 现在对你真实的日历有写入权；先锁紧它的审批阈值。 |
| **多个日历（工作 + 个人）** | `~/nemoclaw-calendar/` 中的额外文件 + 提示词修改 | 把额外的只读 ICS 文件放进 `~/nemoclaw-calendar/`（例如 `work.ics`、`personal.ics`），并在宿主机上对它们 `chmod a-w`。它们会通过既有的 `share mount` 出现在沙箱内的 `/sandbox/calendar/work.ics` 和 `/sandbox/calendar/personal.ics`。更新 agent 提示词的 CONTEXT YOU CAN READ 部分，逐一指明每个 ICS 并告诉 agent 谁是谁。这有助于防止 agent 在你个人安排期间预订工作会议。 |
| **交接给 news-digest 投递** | 提示词 —— OPEN QUESTIONS HANDOFF | 添加 *"Also post the daily 'still waiting on' list to my Telegram home channel at 09:00."*（复用 [news-digest](https://build.nvidia.com/spark/nemoclaw-applications/news-digest) 配方的调度器模式。） |

要**取消一场进行中的协商**，发送：*"Drop the negotiation with <name> about <purpose>. Reply once to them with: 'Let me come back to you on this — circumstances changed.' and archive the working files under bookings/cancelled/."* agent 会把临时文件移出活动集合，同时不丢失历史。

## NemoClaw 策略配置

## NemoClaw 策略配置

本标签页涵盖本 playbook 中两个应用（[每日个人新闻摘要](https://build.nvidia.com/spark/nemoclaw-applications/news-digest) 和 [日程协商 Agent](https://build.nvidia.com/spark/nemoclaw-applications/calendar-negotiator)）所必需、而另外两个（[软件开发 Agent](https://build.nvidia.com/spark/nemoclaw-applications/developer-agent) 和 [Deck 审查器](https://build.nvidia.com/spark/nemoclaw-applications/deck-reviewer)）可选用于"可供审查"通知的**共享沙箱配置**。每个应用标签页都有**自己的**策略配置部分，用于该工作流所需的文件系统挂载和网络出站 —— 本页只涵盖共享的 Telegram。

把你的沙箱名称设置一次，使下面的命令读起来更清爽：

```bash
export SANDBOX_NAME=my-assistant   # replace with the name you chose at NemoClaw onboard
```

## 步骤 1. 配置 Telegram 通道

当你在 *Messaging channels* 提示处选择 `telegram` 时，NemoClaw onboard 向导已经把 **Telegram 通道插件** 接入了沙箱。如果你没有选，请通过安装程序在启用 Telegram 的情况下重新创建沙箱 —— 仅靠 `policy-add` 无法接入通道插件。

添加 Telegram **网络出站预设**，使沙箱能访问 `api.telegram.org`：

```bash
nemoclaw $SANDBOX_NAME policy-add
```

在提示时输入 `telegram` 并按 **Y** 确认。这是一次热重载 —— 沙箱保持运行。

确认策略现在允许 Telegram 出站：

```bash
openshell policy get $SANDBOX_NAME --full | grep -A2 telegram
```

你应当在 `network_policies` 下看到一个或多个 `host: api.telegram.org` 且 `port: 443` 的条目。

**安装 `cloudflared`（一次性，隧道所需）** —— DGX Station **不**默认包含 `cloudflared`。`nemoclaw tunnel start` 需要它来把机器人 webhook 公开暴露；没有它，下一条命令会静默打印 `cloudflared not found — no public URL`，且 `nemoclaw status` 会报告 `● cloudflared (stopped)`。如果 `command -v cloudflared` 已经返回一个路径，跳过这一块。

```bash
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
sudo dpkg -i cloudflared.deb
cloudflared --version   # confirm it installed; expect a version banner like "cloudflared version 2024.x.x"
```

启动公网 webhook 隧道，使 Telegram 能把消息投递到你的机器人：

```bash
nemoclaw tunnel start
nemoclaw status
```

预期：`● cloudflared` 带有一个 `*.trycloudflare.com` URL。

> [!IMPORTANT]
> 如果你在 NemoClaw onboard 步骤跳过了 Telegram，`nemoclaw $SANDBOX_NAME policy-add` 会打开出站预设，但机器人仍会回复 `Error: Channel is unavailable: telegram`。通道**插件**是在沙箱创建时接入的，而不是由 `policy-add`。重新运行 NemoClaw 安装程序，在 **Messaging channels** 提示处选择 `telegram`，以在附带该插件的情况下重新创建沙箱。
>
> **先下载、校验，再执行** —— 永远不要把一个远程安装脚本直接管道进 shell：
>
> ```bash
> # 1. Download the installer to a local file
> curl -fsSL -o nemoclaw.sh https://www.nvidia.com/nemoclaw.sh
>
> # 2. Verify it against the published checksum from the NemoClaw release notes
> #    (replace <expected-sha256> with the value from https://github.com/NVIDIA/NemoClaw/releases)
> echo "<expected-sha256>  nemoclaw.sh" | sha256sum --check
>
> # 3. Inspect the script you're about to run (optional but recommended)
> less nemoclaw.sh
>
> # 4. Only then execute it
> bash nemoclaw.sh
> ```
>
> 如果校验和不匹配，**不要运行该脚本** —— 重新下载，或对 NemoClaw 仓库提一个 issue。

一旦隧道报告了一个公网 URL，打开 Telegram，找到你的机器人，发送 `hello`。你应当在 30–90 秒内收到本地模型的回复（120B 模型的首次响应冷启动较慢）。在那之后，转到你想要配置的应用标签页。

## 故障排查

## 故障排查

下面的表格按标签页分组，方便你直接跳到正在调试的工作流。如果故障出现在 `nemoclaw` / `openshell` 命令层面、而非某个具体应用内部，请从 **沙箱与策略通用问题** 开始。

### 沙箱与策略通用问题

| 现象 | 原因 | 解决办法 |
|---------|-------|-----|
| `nemoclaw <sandbox> policy-add` 返回 `unknown sandbox` | 沙箱名称拼错，或沙箱已被删除 | 运行 `nemoclaw list` 查看已注册的沙箱；用精确名称重新运行命令。如果列表为空，重新运行 NemoClaw 安装程序以重新创建沙箱。 |
| `openshell policy set` 失败并报 `validation failed` / 退出码 1 | YAML 格式错误或策略字段无效 | 常见问题：路径必须以 `/` 开头、不能有 `..` 遍历、`run_as_user` 不能为 `root`、`network_policies` 条目同时需要 `host` 和 `port`。修正 YAML 后重试。 |
| `openshell policy set` 失败并报 `unknown field 'Version', expected one of 'version', 'filesystem_policy', 'landlock', 'process', 'network_policies'` | openshell `0.0.44` 的往返 bug：`openshell policy get --full` 把顶层键输出为 `Version:`（大写 V），但 `openshell policy set` 只接受 `version:`（小写） | 就地把键改为小写后重试：`sed -i 's/^Version:/version:/' policy.yaml && openshell policy set $SANDBOX_NAME --policy policy.yaml --wait`。更推荐：完全跳过整份策略往返，改用增量流程 —— 写一个带 `preset:` + `network_policies:` 块的小预设文件，并用 `nemoclaw $SANDBOX_NAME policy-add --from-file ./my-preset.yaml --yes` 应用。增量流程从不触碰实时的 `version:` 字段。 |
| `openshell policy get` 显示了你新的网络规则，但沙箱仍然拦截该主机 | 热重载未完成 | 加 `--wait` 重新运行，让 CLI 阻塞直到更新被确认：`openshell policy set $SANDBOX_NAME --policy policy.yaml --wait`。如果仍失败，通过 `nemoclaw $SANDBOX_NAME restart`（如果你的版本可用）重启沙箱容器，或重新创建沙箱。 |
| 无法重新创建沙箱：`port 8080 is held by container...` | 此前的某个 OpenShell 网关或沙箱容器仍占用着 8080 端口 | `openshell gateway destroy -g <old-gateway-name>`（或 `docker stop <name> && docker rm <name>`），然后重新运行 `nemoclaw onboard`。 |
| `policy-add` 没有列出我期望的预设 | 预设取决于 NemoClaw 版本 | 列出你的版本支持的内容：`nemoclaw $SANDBOX_NAME policy-add --help`，或交互式运行 `policy-add` 并阅读菜单。较新的预设可能需要更新 NemoClaw。 |
| `nemoclaw <sandbox> policy-add --from-file ...` 失败并报 `Preset must declare preset.name (lowercase, hyphenated RFC 1123 label)` | 你自定义预设文件中的 `preset.name` 含有下划线、大写字母或其他非 RFC-1123 字符 | 把 `preset.name` 的值改为仅含小写字母、数字和连字符（例如 `news_sources` → `news-sources`）。内层的 `network_policies.<group>` map 键及其 `name` 字段确实接受下划线 —— 约束只针对顶层的 `preset.name`。 |
| 策略变更后网页 UI 显示 `origin not allowed` | 通过 `localhost` 而不是 `127.0.0.1` 访问 | 使用 `http://127.0.0.1:18789/#token=<your-token>`。网关的来源检查要求精确的 `127.0.0.1`。 |

### [NemoClaw 策略配置](https://build.nvidia.com/spark/nemoclaw-applications/policy-setup)

| 现象 | 原因 | 解决办法 |
|---------|-------|-----|
| Telegram 机器人回复 `Error: Channel is unavailable: telegram` | onboard 时 Telegram 通道插件未接入沙箱 | 仅靠 `policy-add telegram` 是不够的。重新运行 NemoClaw 安装程序（参见 [NemoClaw 策略配置](https://build.nvidia.com/spark/nemoclaw-applications/policy-setup) 中的 **先下载、校验，再执行** 片段），并在 **Messaging channels** 提示处选择 `telegram`，以在附带通道插件的情况下重新创建沙箱。 |
| `nemoclaw tunnel start` 打印 `cloudflared not found — no public URL` | `cloudflared` 未安装 | 重新安装它：`curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb && sudo dpkg -i cloudflared.deb`，然后 `nemoclaw tunnel stop && nemoclaw tunnel start`。 |
| Telegram 机器人收到了消息，但 60+ 秒没有任何返回 | 120B 模型的首次响应较慢（冷启动），或 Ollama 未预热 | 重启后的第一次回复出现这种情况是预期的。用 `nemoclaw $SANDBOX_NAME status` 验证推理路由。如果后续回复也慢，在 NemoClaw onboard 向导中选一个更小的模型。 |

### [每日个人新闻摘要](https://build.nvidia.com/spark/nemoclaw-applications/news-digest)

| 现象 | 原因 | 解决办法 |
|---------|-------|-----|
| 计划中的摘要从不触发 | agent 没有持久化一个计划任务 | 在网页 UI 中询问：*"Show me all scheduled tasks."* 如果为空，重新下达提示词，并明确说 *"Register this as a recurring scheduled task using your built-in scheduler."* |
| 摘要触发了，但消息显示 `unable to fetch <url>` | 主机不在 `network_policies` 中 | 在 `news-sources.yaml`（步骤 1 的预设文件）的 `network_policies.news_sources.endpoints` 下新增一个该主机条目，并重新运行 `nemoclaw $SANDBOX_NAME policy-add --from-file ./news-sources.yaml --yes`。出站拒绝会出现在 `nemoclaw $SANDBOX_NAME logs --follow` 和 `openshell term` 中。 |
| agent 跳过设置问题，直接给出一份通用摘要 | 上一次运行的档案仍在内存中 | 发送 *"Forget my profile and run the one-time setup again from scratch."*，并重新回答这六个问题。 |

### [软件开发 Agent](https://build.nvidia.com/spark/nemoclaw-applications/developer-agent)

| 现象 | 原因 | 解决办法 |
|---------|-------|-----|
| agent 写了 `develop-and-review.md`，但宿主机文件不见了 | 看错了宿主机路径，或 `share mount` 未激活 | 沙箱路径 `/sandbox/project` 映射到你传给 `nemoclaw $SANDBOX_NAME share mount` 的宿主机目录（例如 `~/nemoclaw-projects/my-app`）。在那个宿主机目录下打开 `develop-and-review.md`，而不是在宿主机上的 `/sandbox/project` 里找。用 `nemoclaw $SANDBOX_NAME share status` 验证挂载是否生效。如果显示 "not mounted"，重新运行步骤 1 的 `share mount` 命令。 |
| agent 写 `develop-and-review.md` 时失败并报 `Permission denied` | 宿主机目录被 `chmod a-w` 锁定，挂载通过 SSHFS 继承了这些权限 | 在宿主机上恢复写入：`chmod u+w ~/nemoclaw-projects/my-app`（或你挂载的那个目录）后重试。若想在宿主机权限之外、再在沙箱内获得由内核强制的写入边界，收紧沙箱策略中的 `filesystem_policy` 并 `nemoclaw $SANDBOX_NAME rebuild` —— 文件系统策略在沙箱创建时锁定，因此修改它需要重建（工作区状态会自动保留）。 |
| 项目明明有测试，agent 却运行测试并报告 "tests not run" | 沙箱镜像中未安装测试运行器 | 默认 NemoClaw 沙箱可能不带 `pytest`、`npm`、`cargo` 或 `go test`。在沙箱创建后一次性安装项目所用的工具：`nemoclaw $SANDBOX_NAME connect`，然后 `pip install --user pytest`（或等价命令），然后 `exit`。 |
| agent 修改了计划之外的文件 | 计划审批检查点被禁用 | 在档案中对 "pause for approval"（Q5）回答 `yes`。这样 agent 必须打印 `PLAN READY — reply 'approve'` 并等待，在你回复 `approve` 之前绝不修改源文件。 |

### [Deck 审查器](https://build.nvidia.com/spark/nemoclaw-applications/deck-reviewer)

| 现象 | 原因 | 解决办法 |
|---------|-------|-----|
| agent 报告 "ingested 0 artifacts" | 队列目录为空，或文件匹配了 `ignore_paths` | 在宿主机上用 `ls ~/nemoclaw-redteam/queue/` 确认文件存在。检查 `profile.yaml.ignore_paths` 是否有一个 glob 误捕了你的文件（例如 `**/~$*` 会排除 Office 锁文件）。 |
| agent 对 `.pptx` 或 `.pdf` 报告 "parser not available" | 沙箱中未安装 `python-pptx` / `pdfplumber` | 一次性安装：`nemoclaw $SANDBOX_NAME connect`，然后 `pip install --user python-pptx python-docx pdfplumber markdown-it-py wcag-contrast-ratio`，然后 `exit`。如果解析器缺失，agent 会回退到纯文本提取 —— 如果你宁愿不安装 Python 包，让它明确标记出来。 |
| 我忽略了某条发现后，它仍不断重新出现 | 忽略模式是 `None`，或规则 + 位置这对组合没有匹配上 | 确认档案 Q4 是 `Sticky` 或 `Per-version`。检查 `~/nemoclaw-redteam/memory/dismissals.jsonl` 以验证忽略已写入。如果 `location` 字段相差一个字符（例如 "Slide 1" 对 "slide 1"），agent 会把它们当作不同位置 —— 让 agent 用最新报告里的精确坐标再忽略一次。 |
| CRITICAL 发现从报告中消失 | 尝试了自动忽略（本应不可能） | 这是一个回归 —— 按提示词的 DISMISSAL PROTOCOL，CRITICAL 被硬编码为需要 `yes, dismiss critical` 再确认。重新粘贴完整提示词以恢复该规则并重新运行。 |

### [日程协商 Agent](https://build.nvidia.com/spark/nemoclaw-applications/calendar-negotiator)

| 现象 | 原因 | 解决办法 |
|---------|-------|-----|
| agent 在我的专注时段内提出时段 | `profile.yaml` 没有在每次运行时被重新读取，或审批阈值允许如此 | agent 被要求在每个请求时重新读取 `calendar.ics` 和 `profile.yaml`（工作流步骤 2 LOAD）。确认该专注时段确实在 `profile.yaml` 里，而不只是在你脑子里。如果 agent 的 `Ask only if...` 豁免触发得太频繁，把档案 Q6（审批阈值）收紧为 `Always ask`。 |
| agent 把 `calendar.ics` 里的事件标题或与会者分享给了对方 | 信息披露档案（Q5）设为了 `slots + reasons` | 把档案 Q5 重置为 `slots only`。协商安全规则也禁止泄露事件标题、与会者或地点 —— 如果 agent 在 `slots only` 下还这么做了，重新粘贴完整提示词以恢复该规则。 |
| 预订文件覆盖了一个已确认的早先预订 | agent 没有遵守 "never overwrite" 规则 | 在 `~/nemoclaw-calendar/bookings/` 中查找一个 `-v2.md` 文件 —— 规则要求会议被移动时使用带 `-v2` 后缀的新文件。如果被覆盖了，从你的文件系统快照或上次备份恢复；重新粘贴完整提示词以恢复该规则。 |
| 即便在 `proxy` 模式下 agent 也从不给对方发私信 | Telegram 通道未接线，或对方的聊天未开启 | 首先，通过给机器人发 `hello` 确认 Telegram 对**你**有效。然后确认对方确实至少与机器人开启过一次聊天（`/start`）；Telegram 机器人无法给从未主动联系过它的用户发私信。 |

> [!NOTE]
> 对于安装层面的 NemoClaw 问题（Docker、Ollama、网关、Telegram 设置），在此处调试之前，请先查看 [NemoClaw on DGX Spark](https://build.nvidia.com/spark/nemoclaw) playbook 的 **故障排查** 标签页 —— 大多数报告的问题来自安装层而非应用层。

---

> [!NOTE]
> DGX Spark 采用统一内存架构（UMA），可以让 GPU 与 CPU 之间动态共享内存。由于许多应用仍在更新以利用 UMA，即使在 DGX Spark 的内存容量之内，你也可能遇到内存问题。如果发生这种情况，可使用以下命令手动清空缓冲区缓存：

```bash
sudo sh -c 'sync; echo 3 > /proc/sys/vm/drop_caches'
```

如需了解最新的已知问题，请查阅 [DGX Spark 用户指南](https://docs.nvidia.com/dgx/dgx-spark/known-issues.html)。
