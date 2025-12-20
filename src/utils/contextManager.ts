/**
 * Context Manager - Smart token budget management for chat history
 * Automatically trims old messages when context exceeds token budget
 */

import type { ChatMessage } from '../types';

// Token estimation: roughly 4 characters = 1 token (standard approximation)
const CHARS_PER_TOKEN = 4;

// Default token budget: 200k tokens (Puter API limit is 272k, leave buffer)
export const DEFAULT_TOKEN_BUDGET = 200000;

/**
 * Estimate token count for a string
 * Uses simple character-based estimation (4 chars ≈ 1 token)
 */
export function estimateTokens(text: string): number {
    return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Estimate token count for a single message
 * Includes role overhead (~4 tokens per message for role/formatting)
 */
export function estimateMessageTokens(message: ChatMessage): number {
    const contentTokens = estimateTokens(message.content);
    const roleOverhead = 4; // Approximate overhead for role, formatting
    return contentTokens + roleOverhead;
}

/**
 * Estimate total tokens for an array of messages
 */
export function estimateTotalTokens(messages: ChatMessage[]): number {
    return messages.reduce((total, msg) => total + estimateMessageTokens(msg), 0);
}

/**
 * Trim messages to fit within token budget
 * Strategy: Remove oldest messages first, always keep the most recent ones
 * 
 * @param messages - Full message history
 * @param tokenBudget - Maximum tokens allowed (default: 50,000)
 * @returns Trimmed messages that fit within budget
 */
export function trimToTokenBudget(
    messages: ChatMessage[],
    tokenBudget: number = DEFAULT_TOKEN_BUDGET
): ChatMessage[] {
    if (messages.length === 0) {
        return [];
    }

    // Calculate total tokens
    const totalTokens = estimateTotalTokens(messages);

    // If within budget, return all messages
    if (totalTokens <= tokenBudget) {
        return messages;
    }

    // Need to trim - remove oldest messages first
    const trimmedMessages: ChatMessage[] = [];
    let currentTokens = 0;

    // Iterate from newest to oldest (reverse)
    for (let i = messages.length - 1; i >= 0; i--) {
        const msgTokens = estimateMessageTokens(messages[i]);

        // Check if adding this message would exceed budget
        if (currentTokens + msgTokens <= tokenBudget) {
            trimmedMessages.unshift(messages[i]); // Add to front
            currentTokens += msgTokens;
        } else {
            // Budget exceeded, stop adding older messages
            break;
        }
    }

    // Log trimming info for debugging
    const removedCount = messages.length - trimmedMessages.length;
    if (removedCount > 0) {
        console.log(
            `[ContextManager] Trimmed ${removedCount} old messages. ` +
            `Original: ${totalTokens} tokens, After: ${currentTokens} tokens, ` +
            `Budget: ${tokenBudget} tokens`
        );
    }

    return trimmedMessages;
}

/**
 * Context Manager class for more advanced usage
 */
export class ContextManager {
    private tokenBudget: number;

    constructor(tokenBudget: number = DEFAULT_TOKEN_BUDGET) {
        this.tokenBudget = tokenBudget;
    }

    /**
     * Get messages trimmed to fit within token budget
     */
    fitToBudget(messages: ChatMessage[]): ChatMessage[] {
        return trimToTokenBudget(messages, this.tokenBudget);
    }

    /**
     * Get current token usage info
     */
    getUsageInfo(messages: ChatMessage[]): {
        totalTokens: number;
        budget: number;
        usage: number; // percentage
        isOverBudget: boolean;
    } {
        const totalTokens = estimateTotalTokens(messages);
        return {
            totalTokens,
            budget: this.tokenBudget,
            usage: Math.round((totalTokens / this.tokenBudget) * 100),
            isOverBudget: totalTokens > this.tokenBudget,
        };
    }

    /**
     * Set new token budget
     */
    setTokenBudget(budget: number): void {
        this.tokenBudget = budget;
    }
}

// Export a default instance
export const contextManager = new ContextManager();
