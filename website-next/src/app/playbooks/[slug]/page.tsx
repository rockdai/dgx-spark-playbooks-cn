import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/MarkdownContent";
import { SiteShell } from "@/components/SiteShell";
import { getPlaybook, listPlaybooks } from "@/lib/content";
import styles from "./page.module.css";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return listPlaybooks().map((item) => ({ slug: item.slug }));
}

export default async function PlaybookPage({ params }: Props) {
  const { slug } = await params;
  const playbook = getPlaybook(slug);
  if (!playbook) {
    notFound();
  }

  return (
    <SiteShell>
      <section className={styles.hero}>
        <div className={styles.heroPanel}>
          <p className={styles.eyebrow}>Playbook</p>
          <h1>{playbook.title}</h1>
          {playbook.description ? <p className={styles.description}>{playbook.description}</p> : null}
          <div className={styles.metaRow}>
            <span>统一模板</span>
            <span>Markdown 驱动</span>
            <span>/{slug}</span>
          </div>
        </div>
      </section>

      <section className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <p className={styles.sidebarTitle}>页面目录</p>
            <nav className={styles.toc}>
              {playbook.toc.map((item) => (
                <a key={`${item.level}-${item.id}`} href={`#${item.id}`} className={item.level === 3 ? styles.tocChild : ""}>
                  {item.text}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <article className={styles.article}>
          <MarkdownContent content={playbook.body} />
        </article>
      </section>
    </SiteShell>
  );
}
