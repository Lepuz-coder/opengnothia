import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { getTokenUsageRecords, getTokenUsageSummaryByProvider } from "@/services/db/queries";
import { Loader2 } from "lucide-react";
import type { TokenUsageRecord } from "@/types";

interface ProviderSummary {
  provider: string;
  model: string;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost: number;
  call_count: number;
}

const CALL_TYPE_LABELS: Record<string, string> = {
  greeting: "Karşılama",
  chat: "Mesaj",
  recommendation: "Öneri",
  summary: "Özet",
  patient_notes: "Notlar",
  dream_analysis: "Rüya Analizi",
};

const PROVIDER_NAMES: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
};

function formatCost(cost: number): string {
  return cost === 0 ? "0$" : `$${cost.toFixed(4)}`;
}

export default function ExpensesPage() {
  const [records, setRecords] = useState<TokenUsageRecord[]>([]);
  const [summaries, setSummaries] = useState<ProviderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [recs, sums] = await Promise.all([
        getTokenUsageRecords(200),
        getTokenUsageSummaryByProvider(),
      ]);
      setRecords(recs);
      setSummaries(sums);
      setLoading(false);
    }
    load();
  }, []);

  const providerGroups = summaries.reduce<Record<string, ProviderSummary[]>>((acc, s) => {
    (acc[s.provider] ??= []).push(s);
    return acc;
  }, {});

  const totalCost = summaries.reduce((sum, s) => sum + s.total_cost, 0);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Harcamalar</h1>
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Harcamalar</h1>
          <p className="text-sm text-[var(--text-muted)]">AI model kullanım maliyetleri</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-[var(--text-muted)]">Toplam Harcama</p>
          <p className="text-xl font-bold">{formatCost(totalCost)}</p>
        </div>
      </div>

      {/* Provider Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(providerGroups).map(([provider, models]) => {
          const providerTotal = models.reduce((s, m) => s + m.total_cost, 0);

          return (
            <Card key={provider}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">{PROVIDER_NAMES[provider] ?? provider}</h2>
                <span className="text-sm font-medium text-primary-500">{formatCost(providerTotal)}</span>
              </div>
              <div className="space-y-2">
                {models.map((m) => (
                  <div key={m.model} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)] truncate mr-2">{m.model}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[var(--text-muted)] text-xs">
                        {m.call_count} çağrı
                      </span>
                      <span className="font-medium">{formatCost(m.total_cost)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Empty state */}
      {records.length === 0 && (
        <Card>
          <p className="text-center text-[var(--text-muted)] py-8">
            Henüz kullanım verisi yok. Bir seans başlattığında burada görünecek.
          </p>
        </Card>
      )}

      {/* Usage Records Table */}
      {records.length > 0 && (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-left text-[var(--text-muted)]">
                  <th className="px-4 py-3 font-medium">Tarih</th>
                  <th className="px-4 py-3 font-medium">Model</th>
                  <th className="px-4 py-3 font-medium">Tür</th>
                  <th className="px-4 py-3 font-medium text-right">Girdi</th>
                  <th className="px-4 py-3 font-medium text-right">Çıktı</th>
                  <th className="px-4 py-3 font-medium text-right">Maliyet</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-tertiary)] transition-colors">
                    <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap">
                      {new Date(r.created_at + "Z").toLocaleString("tr-TR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 truncate max-w-[160px]">{r.model}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {CALL_TYPE_LABELS[r.call_type] ?? r.call_type}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.input_tokens.toLocaleString("tr-TR")}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.output_tokens.toLocaleString("tr-TR")}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">{formatCost(r.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
