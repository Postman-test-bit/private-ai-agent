/**
 * Type definitions for the LLM chat application.
 */

export interface Env {
	/**
	 * Binding for the Workers AI API.
	 */
	AI: Ai;

	/**
	 * Binding for static assets.
	 */
	ASSETS: { fetch: (request: Request) => Promise<Response> };

	/**
	 * OpenRouter API Key (from Cloudflare Secrets)
	 */
	OPENROUTER_KEY?: string;

	/**
	 * Claude API Key (from Cloudflare Secrets)
	 */
	CLAUDE_KEY?: string;
}

/**
 * Represents a chat message.
 */
export interface ChatMessage {
	role: "system" | "user" | "assistant";
	content: string;
}
