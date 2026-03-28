"use client";

import katex from "katex";
import "katex/dist/katex.min.css";

interface MathProps {
  tex: string;
  display?: boolean;
}

export function Math({ tex, display = true }: MathProps) {
  const html = katex.renderToString(tex, {
    throwOnError: false,
    displayMode: display,
  });

  return (
    <span
      dangerouslySetInnerHTML={{ __html: html }}
      className={display ? "block my-2 text-center" : "inline"}
    />
  );
}
