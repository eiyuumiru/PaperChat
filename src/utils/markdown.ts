/**
 * Markdown utilities
 * Configuration for react-markdown
 */

import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import type { PluggableList } from 'unified';

// Remark plugins for markdown parsing
export const remarkPlugins: PluggableList = [
    remarkGfm, // GitHub Flavored Markdown (tables, strikethrough, etc.)
    remarkMath, // Math expressions ($inline$ and $$block$$)
];

// Rehype plugins for HTML processing
export const rehypePlugins: PluggableList = [
    rehypeKatex, // Render LaTeX math
    rehypeHighlight, // Syntax highlighting for code blocks
];
