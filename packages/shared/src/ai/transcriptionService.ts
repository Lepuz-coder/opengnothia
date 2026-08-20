import { AIError } from "./AIError";

// gpt-4o-transcribe: better accuracy than whisper-1 at the same price ($0.006/min)
export const STT_MODEL = "gpt-4o-transcribe";
const STT_COST_PER_MINUTE = 0.006;

async function getWavDurationMinutes(blob: Blob): Promise<number> {
  // The byte-rate header only exists in WAV; other containers (mobile records
  // AAC/m4a) get duration 0 rather than a garbage read.
  if (!blob.type.includes("wav")) return 0;
  try {
    const header = await blob.slice(0, 44).arrayBuffer();
    const view = new DataView(header);
    // WAV header bytes 28-31: byte rate (sample_rate * channels * bits_per_sample / 8)
    const byteRate = view.getUint32(28, true);
    if (byteRate === 0) return 0;
    const dataBytes = blob.size - 44;
    return Math.max(0, dataBytes / byteRate / 60);
  } catch {
    return 0;
  }
}

export interface TranscriptionResult {
  text: string;
  cost: number;
  durationMinutes: number;
}

export async function transcribeAudio(
  audioBlob: Blob,
  apiKey: string,
  language?: string,
  baseUrl: string = "https://api.openai.com/v1",
  // RN's built-in fetch cannot serialize Blob-backed FormData; mobile injects
  // expo/fetch here (the aiService fetchImpl precedent, D15).
  fetchImpl: typeof fetch = fetch,
): Promise<TranscriptionResult> {
  const durationMinutes = await getWavDurationMinutes(audioBlob);

  const formData = new FormData();
  const filename = (audioBlob as Partial<File>).name || "recording.wav";
  formData.append("file", audioBlob, filename);
  formData.append("model", STT_MODEL);
  if (language) {
    formData.append("language", language);
  }

  const response = await fetchImpl(`${baseUrl}/audio/transcriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    // AIError keeps the status/body readable by the proxy error contract
    // (mobile's 403 → paywall path); message unchanged for existing catches.
    const rawBody = await response.text().catch(() => undefined);
    throw new AIError(`Transcription failed (${response.status})`, response.status, rawBody);
  }

  const data = await response.json();
  const cost = durationMinutes * STT_COST_PER_MINUTE;

  return {
    text: data.text,
    cost,
    durationMinutes,
  };
}
