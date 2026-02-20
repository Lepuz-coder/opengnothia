import type { TTSModel, TTSVoice } from "@/types";

const TTS_COST_PER_1K_CHARS: Record<TTSModel, number> = {
  "tts-1": 0.015,
  "tts-1-hd": 0.030,
};

export interface TTSResult {
  audioBlob: Blob;
  cost: number;
  characterCount: number;
}

export async function testTranscriptApiKey(apiKey: string): Promise<{ success: boolean; statusCode?: number }> {
  try {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        voice: "alloy",
        input: "test",
        response_format: "mp3",
      }),
    });
    if (!response.ok) {
      return { success: false, statusCode: response.status };
    }
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function synthesizeSpeech(
  text: string,
  apiKey: string,
  model: TTSModel = "tts-1",
  voice: TTSVoice = "alloy",
): Promise<TTSResult> {
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      voice,
      input: text,
      response_format: "mp3",
    }),
  });

  if (!response.ok) {
    throw new Error(`TTS failed (${response.status})`);
  }

  const audioBlob = await response.blob();
  const characterCount = text.length;
  const cost = (characterCount / 1000) * TTS_COST_PER_1K_CHARS[model];

  return { audioBlob, cost, characterCount };
}

export function playAudioBlob(blob: Blob): { promise: Promise<void>; stop: () => void } {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  let stopped = false;

  const promise = new Promise<void>((resolve, reject) => {
    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      if (!stopped) reject(new Error("Audio playback failed"));
      else resolve();
    };
    audio.play().catch((err) => {
      URL.revokeObjectURL(url);
      reject(err);
    });
  });

  const stop = () => {
    stopped = true;
    audio.pause();
    audio.currentTime = 0;
    URL.revokeObjectURL(url);
  };

  return { promise, stop };
}
