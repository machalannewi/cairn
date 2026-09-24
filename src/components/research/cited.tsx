"use client";

import { createContext, Fragment, useContext, type ReactNode } from "react";

type Ctx = { active: number | null; focus: (n: number) => void };
export const CiteContext = createContext<Ctx>({ active: null, focus: () => {} });

export function Cite({ n }: { n: number }) {
  const { active, focus } = useContext(CiteContext);
  return (
    <button type="button" className="cite" data-active={active === n} onClick={() => focus(n)} aria-label={`Source ${n}`}>
      {n}
    </button>
  );
}

export function CiteList({ ns }: { ns: number[] }) {
  if (!ns.length) return null;
  return (
    <span className="ml-1 whitespace-nowrap">
      {ns.map((n) => (
        <Cite key={n} n={n} />
      ))}
    </span>
  );
}

/** Inline text with **bold** and [n] citation chips. */
export function Inline({ text }: { text: string }) {
  const parts = text.split(/(\[\d+\]|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        const c = /^\[(\d+)\]$/.exec(p);
        if (c) return <Cite key={i} n={Number(c[1])} />;
        const b = /^\*\*([^*]+)\*\*$/.exec(p);
        if (b) return <strong key={i}>{b[1]}</strong>;
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

/** Paragraphs + bullet lists, enough for model-written answers. */
export function Rich({ text }: { text: string }) {
  const blocks = text.trim().split(/\n{2,}/);
  const out: ReactNode[] = [];
  blocks.forEach((block, bi) => {
    const lines = block.split("\n");
    if (lines.every((l) => /^\s*[-*•]\s+/.test(l))) {
      out.push(
        <ul key={bi}>
          {lines.map((l, li) => (
            <li key={li}>
              <Inline text={l.replace(/^\s*[-*•]\s+/, "")} />
            </li>
          ))}
        </ul>,
      );
    } else {
      out.push(
        <p key={bi}>
          <Inline text={lines.join(" ").replace(/^#+\s*/, "")} />
        </p>,
      );
    }
  });
  return <div className="prose-cairn">{out}</div>;
}
