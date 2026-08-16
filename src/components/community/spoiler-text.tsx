"use client";

import { useMemo, useState } from "react";

type Segment = { text: string; spoiler: boolean; key: number };

function splitSpoilers(content: string): Segment[] {
  const regex = /\|\|([\s\S]+?)\|\||\[spoiler\]([\s\S]+?)\[\/spoiler\]/gi;
  const result: Segment[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content))) {
    if (match.index > cursor) result.push({ text: content.slice(cursor, match.index), spoiler: false, key: cursor });
    result.push({ text: match[1] ?? match[2] ?? "", spoiler: true, key: match.index });
    cursor = regex.lastIndex;
  }
  if (cursor < content.length) result.push({ text: content.slice(cursor), spoiler: false, key: cursor });
  return result.length ? result : [{ text: content, spoiler: false, key: 0 }];
}

export function SpoilerText({ content, className = "cm-text" }: { content: string; className?: string }) {
  const segments = useMemo(() => splitSpoilers(content), [content]);
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set());
  return <p className={className}>{segments.map((segment) => segment.spoiler && !revealed.has(segment.key) ? <button key={segment.key} type="button" className="inline-spoiler" onClick={() => setRevealed((current) => new Set(current).add(segment.key))}>trecho com spoiler — revelar</button> : <span key={segment.key}>{segment.text}</span>)}</p>;
}
