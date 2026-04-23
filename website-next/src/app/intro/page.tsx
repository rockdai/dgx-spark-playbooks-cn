import { MarkdownContent } from "@/components/MarkdownContent";
import { SiteShell } from "@/components/SiteShell";
import { getIntroPage, listPlaybooks } from "@/lib/content";
import styles from "./page.module.css";

export default function IntroPage() {
  const intro = getIntroPage();
  const playbooks = listPlaybooks();

  return (
    <SiteShell>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>在线文档</p>
        <h1>{intro.title}</h1>
        <p className={styles.lead}>面向中文社区的 DGX Spark 内容入口，先保留 markdown 资产，再逐步升级为自定义前端体验。</p>
      </section>

      <section className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <p className={styles.sidebarTitle}>Playbooks</p>
            <div className={styles.sidebarList}>
              {playbooks.map((item) => (
                <a key={item.slug} href={`/playbooks/${item.slug}`}>
                  {item.title}
                </a>
              ))}
            </div>
          </div>
        </aside>
        <article className={styles.article}>
          <MarkdownContent content={intro.body} />
        </article>
      </section>
    </SiteShell>
  );
}
