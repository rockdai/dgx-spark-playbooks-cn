import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const docsRoot = path.resolve(process.cwd(), "../website/docs");

export type DocPage = {
  slug: string;
  title: string;
  body: string;
  rawTitle?: string;
};

export type PlaybookItem = {
  slug: string;
  title: string;
};

function readMarkdownFile(filePath: string) {
  const source = fs.readFileSync(filePath, "utf8");
  return matter(source);
}

export function getIntroPage(): DocPage {
  const filePath = path.join(docsRoot, "intro.md");
  const { content } = readMarkdownFile(filePath);
  const headingMatch = content.match(/^#\s+(.+)$/m);
  const title = headingMatch?.[1]?.trim() ?? "DGX Spark 中文社区";

  return {
    slug: "intro",
    title,
    body: content,
    rawTitle: title,
  };
}

export function getPlaybook(slug: string): DocPage | null {
  const filePath = path.join(docsRoot, "playbooks", slug, "index.md");
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const { data, content } = readMarkdownFile(filePath);
  const headingMatch = content.match(/^#\s+(.+)$/m);
  const title = headingMatch?.[1]?.trim() ?? String(data.title || slug);

  return {
    slug,
    title,
    body: content,
    rawTitle: String(data.title || ""),
  };
}

export function listPlaybooks(): PlaybookItem[] {
  const playbooksDir = path.join(docsRoot, "playbooks");
  return fs
    .readdirSync(playbooksDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const playbook = getPlaybook(entry.name);
      return {
        slug: entry.name,
        title: playbook?.title || entry.name,
      };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}
