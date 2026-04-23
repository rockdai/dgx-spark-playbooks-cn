import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import styles from "./markdown-content.module.css";

type Props = {
  content: string;
};

function normalizeMarkdown(source: string) {
  return source
    .replace(/^::spark-download\s*$/gm, "")
    .replace(/\]\(\/playbooks\//g, "](/playbooks/")
    .replace(/\]\(\/spark\//g, "](https://build.nvidia.com/spark/")
    .replace(/href="\/spark\//g, 'href="https://build.nvidia.com/spark/');
}

export function MarkdownContent({ content }: Props) {
  return (
    <div className={styles.markdown}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw, rehypeSlug]}
        components={{
          a: ({ href, ...props }) => {
            const isExternal = !!href && /^https?:\/\//.test(href);
            return <a href={href} {...props} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noreferrer" : undefined} />;
          },
        }}
      >
        {normalizeMarkdown(content)}
      </ReactMarkdown>
    </div>
  );
}
