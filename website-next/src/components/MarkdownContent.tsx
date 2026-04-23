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
          h1: ({ ...props }) => <h1 className={styles.h1} {...props} />,
          h2: ({ ...props }) => <h2 className={styles.h2} {...props} />,
          h3: ({ ...props }) => <h3 className={styles.h3} {...props} />,
          blockquote: ({ children, ...props }) => {
            const firstChild = React.Children.toArray(children)[0];
            const raw = typeof firstChild === "string" ? firstChild : "";
            const match = raw.match(/^\[!(NOTE|IMPORTANT|WARNING|TIP)\]\s*/i);
            const tone = match?.[1]?.toLowerCase() ?? "default";
            return (
              <blockquote className={`${styles.callout} ${styles[`callout${tone[0]?.toUpperCase() + tone.slice(1)}`] || ""}`.trim()} {...props}>
                {children}
              </blockquote>
            );
          },
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
