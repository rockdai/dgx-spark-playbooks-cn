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
        <p className={styles.eyebrow}>Playbook</p>
        <h1>{playbook.title}</h1>
        <p className={styles.meta}>Slug: {slug}</p>
      </section>

      <section className={styles.contentShell}>
        <article className={styles.article}>
          <MarkdownContent content={playbook.body} />
        </article>
      </section>
    </SiteShell>
  );
}
