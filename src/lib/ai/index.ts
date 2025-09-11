import type { ModelId } from "tokenlens";

export type Model = {
  name: string;
  value: string;
  context: number;
  priceModelId: ModelId;
};

export const models: Record<string, Model> = {
  "google/gemini-2.5-flash": {
    name: "Google Gemini 2.5 Flash",
    value: "google/gemini-2.5-flash",
    context: 1000000,
    priceModelId: "google:gemini-2.5-flash",
  },
  "google/gemini-2.5-flash-lite": {
    name: "Google Gemini 2.5 Flash Lite",
    value: "google/gemini-2.5-flash-lite",
    context: 1000000,
    priceModelId: "google:gemini-2.5-flash-lite-preview-06-17",
  },
  "google/gemini-2.5-pro": {
    name: "Google Gemini 2.5 Pro",
    value: "google/gemini-2.5-pro",
    context: 1000000,
    priceModelId: "google:gemini-2.5-pro",
  },
  "deepseek/deepseek-r1": {
    name: "Deepseek R1",
    value: "deepseek/deepseek-r1",
    context: 164000,
    priceModelId: "deepseek:deepseek-reasoner",
  },
  "deepseek/deepseek-chat-v3.1": {
    name: "Deepseek Chat V3.1",
    value: "deepseek/deepseek-chat-v3.1",
    context: 164000,
    priceModelId: "deepseek:deepseek-chat",
  },
  "openai/gpt-4o": {
    name: "OpenAI GPT-4o",
    value: "openai/gpt-4o",
    context: 200000,
    priceModelId: "openai:gpt-4o",
  },
  "openai/gpt-5-mini": {
    name: "OpenAI GPT-5 Mini",
    value: "openai/gpt-5-mini",
    context: 400000,
    priceModelId: "openai:gpt-5-mini",
  },
  "openai/gpt-5": {
    name: "OpenAI GPT-5",
    value: "openai/gpt-5",
    context: 400000,
    priceModelId: "openai:gpt-5",
  },
  "openai/gpt-oss-120b": {
    name: "OpenAI GPT-OSS-120B",
    value: "openai/gpt-oss-120b",
    context: 131000,
    priceModelId: "openai:gpt-5-mini",
  },
  "xai/grok-3": {
    name: "xAI Grok-3",
    value: "xai/grok-3",
    context: 131000,
    priceModelId: "xai:grok-3",
  },
  "xai/grok-3-mini": {
    name: "xAI Grok-3 Mini",
    value: "xai/grok-3-mini",
    context: 131000,
    priceModelId: "xai:grok-3-mini",
  },
  "xai/grok-4": {
    name: "xAI Grok-4",
    value: "xai/grok-4",
    context: 256000,
    priceModelId: "xai:grok-4",
  },
  "anthropic/claude-sonnet-4": {
    name: "Anthropic Claude Sonnet 4",
    value: "anthropic/claude-sonnet-4",
    context: 200000,
    priceModelId: "anthropic:claude-sonnet-4-20250514",
  },
  "anthropic/claude-3.7-sonnet": {
    name: "Anthropic Claude Sonnet 3.7",
    value: "anthropic/claude-3.7-sonnet",
    context: 200000,
    priceModelId: "anthropic:claude-3-7-sonnet-20250219",
  },
  "anthropic/claude-opus-4.1": {
    name: "Anthropic Claude Opus 4.1",
    value: "anthropic/claude-opus-4.1",
    context: 200000,
    priceModelId: "anthropic:claude-opus-4-1-20250805",
  },
  "openrouter/sonoma-dusk-alpha": {
    name: "OpenRouter Sonoma Dusk Alpha",
    value: "openrouter/sonoma-dusk-alpha",
    context: 2000000,
    priceModelId: "openai:o1-mini",
  },
  "openrouter/sonoma-sky-alpha": {
    name: "OpenRouter Sonoma Sky Alpha",
    value: "openrouter/sonoma-sky-alpha",
    context: 2000000,
    priceModelId: "openai:o1-mini",
  },
  "nvidia/nemotron-nano-9b-v2": {
    name: "NVIDIA Nemotron Nano 9B v2",
    value: "nvidia/nemotron-nano-9b-v2",
    context: 128000,
    priceModelId: "openai:o1-mini",
  },
  "z-ai/glm-4.5": {
    name: "Z-AI GLM 4.5",
    value: "z-ai/glm-4.5",
    context: 131000,
    priceModelId: "openai:o1-mini",
  },
  "z-ai/glm-4.5-air": {
    name: "Z-AI GLM 4.5 Air",
    value: "z-ai/glm-4.5-air",
    context: 131000,
    priceModelId: "openai:o1-mini",
  },
};
