import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const docsRoot = path.resolve(process.cwd(), "../website/docs");

export type TocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

export type DocPage = {
  slug: string;
  title: string;
  body: string;
  rawTitle?: string;
  description?: string;
  toc: TocItem[];
};

export type PlaybookItem = {
  slug: string;
  title: string;
};

function readMarkdownFile(filePath: string) {
  const source = fs.readFileSync(filePath, "utf8");
  return matter(source);
}

function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[`*_~]/g, "")
    .replace(/\((.*?)\)/g, "$1")
    .replace(/（(.*?)）/g, "$1")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function cleanMarkdown(content: string) {
  return content
    .replace(/^::spark-download\s*$/gm, "")
    .replace(/^<a id="([^"]+)"><\/a>\s*$/gm, "")
    .replace(/^##\s+(Configured if you use mDNS hostname|Configured if you use IP address|Check SSH client version|Connect using mDNS hostname \(preferred\)|Alternative: Connect using IP address|Check hostname|Check system information|Exit the session|local port 11000 → remote port 11000)\s*$/gm, "");
}

function extractDescription(content: string) {
  const lines = cleanMarkdown(content)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (line.startsWith("# ") || line.startsWith(">") || line.startsWith("## ")) {
      continue;
    }
    return line;
  }

  return undefined;
}

function extractToc(content: string): TocItem[] {
  const items: TocItem[] = [];
  for (const line of cleanMarkdown(content).split("\n")) {
    const match = /^(##|###)\s+(.+)$/.exec(line.trim());
    if (!match) continue;
    const hashes = match[1];
    const text = match[2].trim();
    if (!text) continue;
    if (text === "目录") continue;
    items.push({
      id: slugify(text),
      text,
      level: hashes === "##" ? 2 : 3,
    });
  }
  return items;
}

export function getIntroPage(): DocPage {
  const filePath = path.join(docsRoot, "intro.md");
  const { content } = readMarkdownFile(filePath);
  const cleaned = cleanMarkdown(content);
  const headingMatch = cleaned.match(/^#\s+(.+)$/m);
  const title = headingMatch?.[1]?.trim() ?? "DGX Spark 中文社区";

  return {
    slug: "intro",
    title,
    body: cleaned,
    rawTitle: title,
    description: extractDescription(cleaned),
    toc: extractToc(cleaned),
  };
}

export function getPlaybook(slug: string): DocPage | null {
  const filePath = path.join(docsRoot, "playbooks", slug, "index.md");
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const { data, content } = readMarkdownFile(filePath);
  const cleaned = cleanMarkdown(content);
  const headingMatch = cleaned.match(/^#\s+(.+)$/m);
  const title = headingMatch?.[1]?.trim() ?? String(data.title || slug);

  return {
    slug,
    title,
    body: cleaned,
    rawTitle: String(data.title || ""),
    description: extractDescription(cleaned),
    toc: extractToc(cleaned),
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
