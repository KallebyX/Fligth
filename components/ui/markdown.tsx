import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export function Markdown({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn("space-y-3 text-base leading-relaxed text-ink/85", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mt-4 text-2xl font-black text-ink">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-4 text-xl font-extrabold text-ink">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-3 text-lg font-extrabold text-ink">{children}</h3>
          ),
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-extrabold text-ink">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-6">{children}</ul>,
          ol: ({ children }) => (
            <ol className="my-2 list-decimal space-y-1 pl-6">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          code: ({ children, ...props }) => {
            const isInline = !("className" in props && props.className);
            if (isInline) {
              return (
                <code className="rounded bg-cloud px-1.5 py-0.5 font-mono text-sm text-sky-deep">
                  {children}
                </code>
              );
            }
            return <code className="font-mono text-sm">{children}</code>;
          },
          pre: ({ children }) => (
            <pre className="my-3 overflow-x-auto rounded-2xl bg-ink p-4 font-mono text-sm leading-relaxed text-cloud">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-sky pl-4 italic text-ink/70">
              {children}
            </blockquote>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-sky underline underline-offset-2"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="my-4 border-cloud-deep/40" />,
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto">
              <table className="w-full border-collapse rounded-xl text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-cloud-deep/40 bg-cloud px-3 py-2 text-left font-bold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-cloud-deep/30 px-3 py-2">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
