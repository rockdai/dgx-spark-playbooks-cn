import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

const featuredCards = [
  {
    title: '连接与初始化',
    eyebrow: 'Connect',
    description: '从本地访问、双机互联到多机组网，快速完成 DGX Spark 基础连接。',
    to: '/playbooks/connect-to-your-spark/',
  },
  {
    title: '推理部署',
    eyebrow: 'Inference',
    description: '覆盖 vLLM、TRT-LLM、SGLang、llama.cpp、Ollama 等核心推理方案。',
    to: '/playbooks/vllm/',
  },
  {
    title: '微调与训练',
    eyebrow: 'Fine-tune',
    description: '包含 PyTorch、NeMo、Unsloth、LLaMA Factory 等中文实践手册。',
    to: '/playbooks/pytorch-fine-tune/',
  },
  {
    title: 'Agent 与应用',
    eyebrow: 'Applications',
    description: '从 OpenClaw、OpenShell 到多智能体应用，整理适合中文社区的上手路径。',
    to: '/playbooks/openclaw/',
  },
];

const quickLinks = [
  {label: 'vLLM', to: '/playbooks/vllm/'},
  {label: 'OpenClaw', to: '/playbooks/openclaw/'},
  {label: 'TRT-LLM', to: '/playbooks/trt-llm/'},
  {label: 'Connect to your Spark', to: '/playbooks/connect-to-your-spark/'},
  {label: 'NemoClaw', to: '/playbooks/nemoclaw/'},
  {label: 'TXT2KG', to: '/playbooks/txt2kg/'},
];

const statItems = [
  {label: '中文在线文档', value: '1 套'},
  {label: '核心入口方向', value: '4 类'},
  {label: '部署目标域名', value: 'dgx-spark.ai'},
];

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();

  return (
    <Layout
      title={siteConfig.title}
      description="DGX Spark 中文手册，面向中文社区的在线文档站。">
      <header className={styles.hero}>
        <div className="container">
          <div className={styles.heroInner}>
            <p className={styles.kicker}>DGX Spark Chinese Docs</p>
            <Heading as="h1" className={styles.title}>
              DGX Spark 中文手册
            </Heading>
            <p className={styles.subtitle}>
              基于官方 DGX Spark Playbooks 整理的中文在线文档站，聚焦连接、推理、微调、Agent 与应用实践。
            </p>
            <div className={styles.ctaRow}>
              <Link className="button button--primary button--lg" to="/intro">
                开始阅读
              </Link>
              <Link className={styles.secondaryButton} to="/playbooks/vllm/">
                浏览 Playbooks
              </Link>
            </div>
            <div className={styles.statsRow}>
              {statItems.map((item) => (
                <div key={item.label} className={styles.statCard}>
                  <span className={styles.statValue}>{item.value}</span>
                  <span className={styles.statLabel}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <section className="container margin-vert--lg">
          <div className={styles.sectionHeader}>
            <Heading as="h2">选择你要进入的方向</Heading>
            <p>参考 build.nvidia.com/spark 的入口方式，先把高频路径做成卡片式入口。</p>
          </div>
          <div className={styles.cardGrid}>
            {featuredCards.map((card) => (
              <Link key={card.title} className={styles.card} to={card.to}>
                <div className={styles.cardGlow} />
                <span className={styles.cardEyebrow}>{card.eyebrow}</span>
                <Heading as="h3">{card.title}</Heading>
                <p>{card.description}</p>
                <span className={styles.cardAction}>进入文档</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="container margin-vert--lg">
          <div className={styles.panel}>
            <div>
              <Heading as="h2">快速入口</Heading>
              <p>面向高频访问文档，适合第一次搭环境或快速回查命令。</p>
            </div>
            <div className={styles.quickLinks}>
              {quickLinks.map((link) => (
                <Link key={link.label} className={styles.quickLink} to={link.to}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="container margin-vert--lg">
          <div className={styles.dualPanel}>
            <div className={styles.noticeBox}>
              <Heading as="h2">Community Notice</Heading>
              <p>
                This website is a community-driven Chinese translation based on the official DGX Spark Playbooks. It is made by the community and love, and is not affiliated with, endorsed by, or maintained by NVIDIA.
              </p>
            </div>
            <div className={styles.noticeBox}>
              <Heading as="h2">当前目标</Heading>
              <p>
                先把站点以独立域名形式稳定上线，再逐步清理 broken links、broken anchors 与少量内容层 warning。
              </p>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
