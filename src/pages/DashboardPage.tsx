import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { MessageSquare, BookOpen, Moon, Pencil, Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { saveMoodEntry, getTodayMoodEntry, getCompletedSessionCount, getJournalEntryCount, getDreamCount } from "@/services/db/queries";

const MOOD_EMOJIS: Record<number, string> = {
  1: "\u{1F62B}", 2: "\u{1F622}", 3: "\u{1F614}", 4: "\u{1F615}", 5: "\u{1F610}",
  6: "\u{1F642}", 7: "\u{1F60A}", 8: "\u{1F604}", 9: "\u{1F929}", 10: "\u{1F973}",
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [todayMood, setTodayMood] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [journalCount, setJournalCount] = useState(0);
  const [dreamCount, setDreamCount] = useState(0);

  useEffect(() => {
    getTodayMoodEntry().then((entry) => {
      if (entry) setTodayMood(entry.mood);
    });
    getCompletedSessionCount().then(setSessionCount);
    getJournalEntryCount().then(setJournalCount);
    getDreamCount().then(setDreamCount);
  }, []);

  async function handleMoodSelect(mood: number) {
    setSaving(true);
    await saveMoodEntry(mood);
    setTodayMood(mood);
    setSaving(false);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Merhaba</h1>
        <p className="text-[var(--text-muted)]">
          {new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: MessageSquare, label: "Seans", color: "bg-primary-900/30 text-primary-400", path: "/session" },
          { icon: BookOpen, label: "Günlük", color: "bg-blue-900/30 text-blue-400", path: "/journal" },
          { icon: Moon, label: "Rüyalar", color: "bg-purple-900/30 text-purple-400", path: "/dreams" },
          { icon: Lightbulb, label: "İçgörüler", color: "bg-amber-900/30 text-amber-400", path: "/insights" },
        ].map((btn) => (
          <button
            key={btn.label}
            onClick={() => navigate(btn.path)}
            className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border-color)] hover:border-primary-500/50 hover:bg-[var(--bg-primary)] transition-all"
          >
            <div className={`w-10 h-10 rounded-xl ${btn.color} flex items-center justify-center shrink-0`}>
              <btn.icon className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">{btn.label}</span>
          </button>
        ))}
      </div>

      {/* Mood Entry */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {todayMood ? "Bugünkü Ruh Halin" : "Bugün nasıl hissediyorsun?"}
          </h3>
          {todayMood && (
            <button
              onClick={() => setTodayMood(null)}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Değiştir
            </button>
          )}
        </div>

        {todayMood ? (
          <div className="flex items-center justify-center gap-3 py-4">
            <span className="text-5xl">{MOOD_EMOJIS[todayMood]}</span>
            <span className="text-3xl font-bold text-[var(--text-primary)]">{todayMood}/10</span>
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((mood) => (
              <button
                key={mood}
                onClick={() => handleMoodSelect(mood)}
                disabled={saving}
                className="flex flex-col items-center gap-1 p-3 rounded-xl border border-[var(--border-color)] hover:border-primary-500 hover:bg-primary-500/10 transition-all disabled:opacity-50"
              >
                <span className="text-2xl">{MOOD_EMOJIS[mood]}</span>
                <span className="text-xs font-medium text-[var(--text-secondary)]">{mood}</span>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: MessageSquare, label: "Toplam Seans", count: sessionCount, color: "bg-primary-900/30 text-primary-400" },
          { icon: BookOpen, label: "Toplam Günlük", count: journalCount, color: "bg-blue-900/30 text-blue-400" },
          { icon: Moon, label: "Toplam Rüya", count: dreamCount, color: "bg-purple-900/30 text-purple-400" },
        ].map((stat) => (
          <Card key={stat.label}>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold">{stat.count}</span>
              <span className="text-xs text-[var(--text-muted)]">{stat.label}</span>
            </div>
          </Card>
        ))}
      </div>

    </div>
  );
}
