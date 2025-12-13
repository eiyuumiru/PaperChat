/**
 * Markdown utilities
 * Configuration for react-markdown
 */

import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";

// Remark plugins for markdown parsing
export const remarkPlugins = [
  remarkGfm, // GitHub Flavored Markdown (tables, strikethrough, etc.)
  remarkMath, // Math expressions ($inline$ and $$block$$)
];

// Rehype plugins for HTML processing
export const rehypePlugins = [
  rehypeKatex, // Render LaTeX math
  rehypeHighlight, // Syntax highlighting for code blocks
];
