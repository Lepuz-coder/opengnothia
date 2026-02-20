// OpenAI Whisper-1 pricing: $0.006 per minute
const WHISPER_COST_PER_MINUTE = 0.006;

function getWavDurationMinutes(blob: Blob): Promise<number> {
  return blob.slice(0, 44).arrayBuffer().then((header) => {
    const view = new DataView(header);
    // WAV header bytes 28-31: byte rate (sample_rate * channels * bits_per_sample / 8)
    const byteRate = view.getUint32(28, true);
    if (byteRate === 0) return 0;
    const dataBytes = blob.size - 44;
    return Math.max(0, dataBytes / byteRate / 60);
  });
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
): Promise<TranscriptionResult> {
  const durationMinutes = await getWavDurationMinutes(audioBlob);

  const formData = new FormData();
  formData.append("file", audioBlob, "recording.wav");
  formData.append("model", "whisper-1");
  if (language) {
    formData.append("language", language);
  }

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Transcription failed (${response.status})`);
  }

  const data = await response.json();
  const cost = durationMinutes * WHISPER_COST_PER_MINUTE;

  return {
    text: data.text,
    cost,
    durationMinutes,
  };
}
