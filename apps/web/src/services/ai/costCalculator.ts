import { providers } from "@/constants/providers";
import type { AIProvider } from "@/types";

export function calculateCost(
  provider: AIProvider,
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const providerConfig = providers.find((p) => p.id === provider);
  const modelConfig = providerConfig?.models.find((m) => m.id === model);

  const costPer1kInput = modelConfig?.costPer1kInput ?? 0;
  const costPer1kOutput = modelConfig?.costPer1kOutput ?? 0;

  return (inputTokens / 1000) * costPer1kInput + (outputTokens / 1000) * costPer1kOutput;
}
