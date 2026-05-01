import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

function findClosingMarker(value: string, marker: "*" | "**", fromIndex: number) {
  let index = fromIndex;

  while (index < value.length) {
    const foundAt = value.indexOf(marker, index);

    if (foundAt === -1) {
      return -1;
    }

    if (foundAt > fromIndex || marker === "**") {
      return foundAt;
    }

    index = foundAt + marker.length;
  }

  return -1;
}

function renderInlineMarkdown(value: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;

  while (cursor < value.length) {
    if (value.startsWith("**", cursor)) {
      const closingIndex = findClosingMarker(value, "**", cursor + 2);

      if (closingIndex !== -1) {
        const content = value.slice(cursor + 2, closingIndex);
        nodes.push(
          <strong key={`${keyPrefix}-strong-${cursor}`} className="font-semibold text-[var(--white)]">
            {renderInlineMarkdown(content, `${keyPrefix}-strong-${cursor}`)}
          </strong>,
        );
        cursor = closingIndex + 2;
        continue;
      }
    }

    if (value[cursor] === "*") {
      const closingIndex = findClosingMarker(value, "*", cursor + 1);

      if (closingIndex !== -1) {
        const content = value.slice(cursor + 1, closingIndex);
        nodes.push(
          <em key={`${keyPrefix}-em-${cursor}`} className="italic text-[var(--white)]">
            {renderInlineMarkdown(content, `${keyPrefix}-em-${cursor}`)}
          </em>,
        );
        cursor = closingIndex + 1;
        continue;
      }
    }

    const nextStrong = value.indexOf("**", cursor);
    const nextItalic = value.indexOf("*", cursor);
    const nextMarkerCandidates = [nextStrong, nextItalic].filter((item) => item !== -1);
    const nextMarker =
      nextMarkerCandidates.length > 0
        ? Math.min(...nextMarkerCandidates)
        : value.length;

    nodes.push(value.slice(cursor, nextMarker));
    cursor = nextMarker;
  }

  return nodes;
}

export function NoticeMarkdown({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const paragraphs = content.split(/\n{2,}/);

  return (
    <div className={cn("space-y-3 text-sm leading-7 text-[var(--muted)]", className)}>
      {paragraphs.map((paragraph, paragraphIndex) => {
        const lines = paragraph.split(/\n/);

        return (
          <p key={`paragraph-${paragraphIndex}`}>
            {lines.map((line, lineIndex) => (
              <span key={`line-${paragraphIndex}-${lineIndex}`}>
                {lineIndex > 0 ? <br /> : null}
                {renderInlineMarkdown(line, `paragraph-${paragraphIndex}-line-${lineIndex}`)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
