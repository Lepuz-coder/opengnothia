import { useState } from "react";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Slider } from "@/components/ui/Slider";
import { Toggle } from "@/components/ui/Toggle";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useCheckInStore } from "@/stores/useCheckInStore";
import { saveCheckIn } from "@/services/db/queries";

const tagOptions = ["Kaygılı", "Huzurlu", "Yorgun", "Enerjik", "Üzgün", "Mutlu", "Stresli", "Odaklanmış"];

export function CheckInWidget() {
  const {
    mood, setMood,
    energy, setEnergy,
    sleep, setSleep,
    hadDream, setHadDream,
    dreamNote, setDreamNote,
    tags, toggleTag,
    isSubmitted, submit,
  } = useCheckInStore();
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setSaving(true);
    await saveCheckIn({
      mood, energy, sleep,
      had_dream: hadDream,
      dream_note: dreamNote || null,
      tags,
    });
    submit();
    setSaving(false);
  }

  if (isSubmitted) {
    return (
      <Card className="text-center">
        <div className="flex items-center justify-center gap-2 text-green-600">
          <Check className="w-5 h-5" />
          <span className="font-medium">Bugünkü check-in tamamlandı</span>
        </div>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          Ruh hali: {mood}/10 | Enerji: {energy}/10 | Uyku: {sleep}/5
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Günlük Check-in</h3>

      <div className="space-y-4">
        <Slider label="Ruh Hali" value={mood} onChange={setMood} min={1} max={10} />
        <Slider label="Enerji" value={energy} onChange={setEnergy} min={1} max={10} />
        <Slider
          label="Uyku Kalitesi"
          value={sleep}
          onChange={setSleep}
          min={1}
          max={5}
          labels={["Kötü", "", "Orta", "", "Harika"]}
        />

        <Toggle checked={hadDream} onChange={setHadDream} label="Rüya gördüm" />

        {hadDream && (
          <textarea
            value={dreamNote}
            onChange={(e) => setDreamNote(e.target.value)}
            placeholder="Rüyanı kısaca anlat..."
            className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm resize-none h-20 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        )}

        <div>
          <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">Bugün nasıl hissediyorsun?</p>
          <div className="flex flex-wrap gap-2">
            {tagOptions.map((tag) => (
              <Badge key={tag} selected={tags.includes(tag)} onClick={() => toggleTag(tag)}>
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={saving} className="w-full">
          {saving ? "Kaydediliyor..." : "Check-in Yap"}
        </Button>
      </div>
    </Card>
  );
}
