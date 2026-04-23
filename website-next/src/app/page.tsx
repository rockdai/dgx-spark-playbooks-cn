import { SiteShell } from "@/components/SiteShell";
import styles from "./page.module.css";

const connectionCards = [
  {
    title: "连接你的 DGX Spark",
    description: "配置本地网络访问、SSH 与远程开发入口，作为第一步开始使用。",
    href: "/playbooks/connect-to-your-spark",
    badge: "开始使用",
  },
  {
    title: "结合 Ollama 使用 Open WebUI",
    description: "快速搭建一个本地可交互的 AI Web 界面，适合演示、试用与日常对话。",
    href: "/playbooks/open-webui",
    badge: "热门入口",
  },
  {
    title: "使用 vLLM 进行推理",
    description: "面向更高吞吐与更稳定推理流程的部署路径，适合生产化实验。",
    href: "/playbooks/vllm",
    badge: "推理实践",
  },
];

export default function Home() {
  return (
    <SiteShell>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>DGX Spark</p>
          <h1 className={styles.title}>DGX Spark 中文社区</h1>
          <p className={styles.subtitle}>选择你希望进入 DGX Spark 的方式。我们把中文文档、购买入口和高频 playbooks 整理成一套更接近 NVIDIA 官网体验的社区版本。</p>
          <div className={styles.actions}>
            <a className={styles.primaryAction} href="/intro">
              开始使用
            </a>
            <a className={styles.secondaryAction} href="https://common-buy.aliyun.com/?commodityCode=datav_spark_public_cn" target="_blank" rel="noreferrer">
              立即购买
            </a>
          </div>
        </div>
      </section>

      <section className={styles.cardsSection}>
        <div className={styles.sectionHeader}>
          <p className={styles.sectionEyebrow}>Core Playbooks</p>
          <h2>从这里进入最常用的 DGX Spark 场景</h2>
        </div>
        <div className={styles.cardGrid}>
          {connectionCards.map((item) => (
            <a key={item.href} className={styles.card} href={item.href}>
              <div className={styles.cardTop}>
                <span className={styles.badge}>{item.badge}</span>
              </div>
              <div className={styles.cardBody}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
              <div className={styles.cardFooter}>
                <span className={styles.cardCta}>进入 Playbook</span>
              </div>
            </a>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
