import type { AIProviderConfig } from "@/types";

export const providers: AIProviderConfig[] = [
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude models",
    baseUrl: "https://api.anthropic.com/v1",
    requiresKey: true,
    models: [
      // Claude Opus
      {
        id: "claude-opus-4-7",
        name: "Claude Opus 4.7",
        contextWindow: 200000,
        costPer1kInput: 0.005,
        costPer1kOutput: 0.025,
        supportsThinking: true,
        supportsAdaptiveThinking: true,
        requiresAdaptiveThinking: true,
      },
      {
        id: "claude-opus-4-6",
        name: "Claude Opus 4.6",
        contextWindow: 200000,
        costPer1kInput: 0.005,
        costPer1kOutput: 0.025,
        supportsThinking: true,
        supportsAdaptiveThinking: true,
      },
      {
        id: "claude-opus-4-5-20251101",
        name: "Claude Opus 4.5",
        contextWindow: 200000,
        costPer1kInput: 0.005,
        costPer1kOutput: 0.025,
        supportsThinking: true,
      },
      {
        id: "claude-opus-4-1-20250805",
        name: "Claude Opus 4.1",
        contextWindow: 200000,
        costPer1kInput: 0.015,
        costPer1kOutput: 0.075,
        supportsThinking: true,
      },
      {
        id: "claude-opus-4-20250514",
        name: "Claude Opus 4",
        contextWindow: 200000,
        costPer1kInput: 0.015,
        costPer1kOutput: 0.075,
        supportsThinking: true,
      },
      // Claude Sonnet
      {
        id: "claude-sonnet-4-6",
        name: "Claude Sonnet 4.6",
        contextWindow: 200000,
        costPer1kInput: 0.003,
        costPer1kOutput: 0.015,
        supportsThinking: true,
        supportsAdaptiveThinking: true,
      },
      {
        id: "claude-sonnet-4-5-20250929",
        name: "Claude Sonnet 4.5",
        contextWindow: 200000,
        costPer1kInput: 0.003,
        costPer1kOutput: 0.015,
        supportsThinking: true,
      },
      {
        id: "claude-sonnet-4-20250514",
        name: "Claude Sonnet 4",
        contextWindow: 200000,
        costPer1kInput: 0.003,
        costPer1kOutput: 0.015,
        supportsThinking: true,
      },
      // Claude Haiku
      {
        id: "claude-haiku-4-5-20251001",
        name: "Claude Haiku 4.5",
        contextWindow: 200000,
        costPer1kInput: 0.001,
        costPer1kOutput: 0.005,
        supportsThinking: true,
      },
      {
        id: "claude-3-5-haiku-20241022",
        name: "Claude Haiku 3.5",
        contextWindow: 200000,
        costPer1kInput: 0.0008,
        costPer1kOutput: 0.004,
        supportsThinking: true,
      },
      {
        id: "claude-3-haiku-20240307",
        name: "Claude Haiku 3",
        contextWindow: 200000,
        costPer1kInput: 0.00025,
        costPer1kOutput: 0.00125,
      },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT & o-series models",
    baseUrl: "https://api.openai.com/v1",
    requiresKey: true,
    models: [
      // GPT-5 Serisi
      {
        id: "gpt-5.5",
        name: "GPT-5.5",
        contextWindow: 400000,
        costPer1kInput: 0.0025,
        costPer1kOutput: 0.015,
        supportsThinking: true,
        supportsXHighThinking: true,
      },
      {
        id: "gpt-5.4",
        name: "GPT-5.4",
        contextWindow: 400000,
        costPer1kInput: 0.0025,
        costPer1kOutput: 0.015,
        supportsThinking: true,
        supportsXHighThinking: true,
      },
      {
        id: "gpt-5.4-mini",
        name: "GPT-5.4 Mini",
        contextWindow: 400000,
        costPer1kInput: 0.00075,
        costPer1kOutput: 0.0045,
        supportsThinking: true,
        supportsXHighThinking: true,
      },
      {
        id: "gpt-5.3",
        name: "GPT-5.3",
        contextWindow: 400000,
        costPer1kInput: 0.0015,
        costPer1kOutput: 0.012,
        supportsThinking: true,
      },
      {
        id: "gpt-5.2",
        name: "GPT-5.2",
        contextWindow: 400000,
        costPer1kInput: 0.00175,
        costPer1kOutput: 0.014,
        supportsThinking: true,
      },
      {
        id: "gpt-5.1",
        name: "GPT-5.1",
        contextWindow: 128000,
        costPer1kInput: 0.00125,
        costPer1kOutput: 0.01,
        supportsThinking: true,
      },
      {
        id: "gpt-5",
        name: "GPT-5",
        contextWindow: 400000,
        costPer1kInput: 0.00125,
        costPer1kOutput: 0.01,
        supportsThinking: true,
      },
      {
        id: "gpt-5-mini",
        name: "GPT-5 Mini",
        contextWindow: 400000,
        costPer1kInput: 0.00025,
        costPer1kOutput: 0.002,
        supportsThinking: true,
      },
      {
        id: "gpt-5-nano",
        name: "GPT-5 Nano",
        contextWindow: 400000,
        costPer1kInput: 0.00005,
        costPer1kOutput: 0.0004,
        supportsThinking: true,
      },
      {
        id: "gpt-5-pro",
        name: "GPT-5 Pro",
        contextWindow: 400000,
        costPer1kInput: 0.015,
        costPer1kOutput: 0.12,
        supportsThinking: true,
      },
      // GPT-4.1 Serisi
      {
        id: "gpt-4.1",
        name: "GPT-4.1",
        contextWindow: 1000000,
        costPer1kInput: 0.002,
        costPer1kOutput: 0.008,
      },
      {
        id: "gpt-4.1-mini",
        name: "GPT-4.1 Mini",
        contextWindow: 1000000,
        costPer1kInput: 0.0004,
        costPer1kOutput: 0.0016,
      },
      {
        id: "gpt-4.1-nano",
        name: "GPT-4.1 Nano",
        contextWindow: 1000000,
        costPer1kInput: 0.0001,
        costPer1kOutput: 0.0004,
      },
      // GPT-4o Serisi
      {
        id: "gpt-4o",
        name: "GPT-4o",
        contextWindow: 128000,
        costPer1kInput: 0.0025,
        costPer1kOutput: 0.01,
      },
      {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        contextWindow: 128000,
        costPer1kInput: 0.00015,
        costPer1kOutput: 0.0006,
      },

    ],
  },
];

export function getProvider(id: string) {
  return providers.find((p) => p.id === id);
}

export function modelSupportsThinking(providerId: string, modelId: string): boolean {
  const provider = getProvider(providerId);
  if (!provider) return false;
  const model = provider.models.find((m) => m.id === modelId);
  return model?.supportsThinking ?? false;
}

export function modelSupportsAdaptiveThinking(providerId: string, modelId: string): boolean {
  const provider = getProvider(providerId);
  if (!provider) return false;
  const model = provider.models.find((m) => m.id === modelId);
  return model?.supportsAdaptiveThinking ?? false;
}

export function modelRequiresAdaptiveThinking(providerId: string, modelId: string): boolean {
  const provider = getProvider(providerId);
  if (!provider) return false;
  const model = provider.models.find((m) => m.id === modelId);
  return model?.requiresAdaptiveThinking ?? false;
}

export function modelSupportsXHighThinking(providerId: string, modelId: string): boolean {
  const provider = getProvider(providerId);
  if (!provider) return false;
  const model = provider.models.find((m) => m.id === modelId);
  return model?.supportsXHighThinking ?? false;
}

export function modelSupportsMaxThinking(providerId: string, modelId: string): boolean {
  if (providerId === "anthropic") return modelSupportsThinking(providerId, modelId);
  return modelSupportsXHighThinking(providerId, modelId);
}
