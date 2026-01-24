"use client"

import { cn } from "@/lib/utils"
import React, { useEffect, useState } from "react"
import { codeToHtml } from "shiki"
import "@/styles/components/code-block.css"

export type CodeBlockProps = {
    children?: React.ReactNode
    className?: string
} & React.HTMLProps<HTMLDivElement>

function CodeBlock({ children, className, ...props }: CodeBlockProps) {
    return (
        <div
            className={cn("code-block-container", className)}
            {...props}
        >
            {children}
        </div>
    )
}

export type CodeBlockCodeProps = {
    code: string
    language?: string
    theme?: string
    className?: string
} & React.HTMLProps<HTMLDivElement>

function CodeBlockCode({
    code,
    language = "tsx",
    theme = "github-dark",
    className,
    ...props
}: CodeBlockCodeProps) {
    const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null)

    useEffect(() => {
        async function highlight() {
            if (!code) {
                setHighlightedHtml("<pre><code></code></pre>")
                return
            }

            try {
                // Check theme dynamically
                const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
                const html = await codeToHtml(String(code), {
                    lang: language,
                    theme: isDark ? 'github-dark' : 'github-light'
                })
                setHighlightedHtml(html)
            } catch (e) {
                console.error("Shiki highlighting failed", e)
                setHighlightedHtml(`<pre><code>${code}</code></pre>`)
            }
        }
        highlight()

        // Listen for theme changes in the DOM
        const observer = new MutationObserver(() => {
            highlight()
        })
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

        return () => observer.disconnect()
    }, [code, language])

    const classNames = cn("code-block-content", className)

    // SSR fallback: render plain code if not hydrated yet
    return highlightedHtml ? (
        <div
            className={classNames}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            {...props}
        />
    ) : (
        <div className={classNames} {...props}>
            <pre>
                <code>{code}</code>
            </pre>
        </div>
    )
}

export type CodeBlockGroupProps = React.HTMLAttributes<HTMLDivElement>

function CodeBlockGroup({
    children,
    className,
    ...props
}: CodeBlockGroupProps) {
    return (
        <div
            className={cn("code-block-group", className)}
            {...props}
        >
            {children}
        </div>
    )
}

export { CodeBlockGroup, CodeBlockCode, CodeBlock }
