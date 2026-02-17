import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { getTokenUsageRecords, getTokenUsageSummaryByProvider } from "@/services/db/queries";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation, getDateLocale } from "@/i18n";
import type { TokenUsageRecord } from "@/types";

interface ProviderSummary {
  provider: string;
  model: string;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost: number;
  call_count: number;
}

const PAGE_SIZE = 20;

const PROVIDER_NAMES: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
};

function formatCost(cost: number): string {
  return cost === 0 ? "0$" : `$${cost.toFixed(4)}`;
}

export default function ExpensesPage() {
  const { t, language } = useTranslation();
  const locale = getDateLocale(language);
  const [records, setRecords] = useState<TokenUsageRecord[]>([]);
  const [summaries, setSummaries] = useState<ProviderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function load() {
      const [recs, sums] = await Promise.all([
        getTokenUsageRecords(1000),
        getTokenUsageSummaryByProvider(),
      ]);
      setRecords(recs);
      setSummaries(sums);
      setLoading(false);
    }
    load();
  }, []);

  const modelOptions = useMemo(() => {
    const models = [...new Set(records.map((r) => r.model))].sort();
    return [
      { value: "all", label: t.expenses.allModels },
      ...models.map((m) => ({ value: m, label: m })),
    ];
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (selectedModel === "all") return records;
    return records.filter((r) => r.model === selectedModel);
  }, [records, selectedModel]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const providerGroups = summaries.reduce<Record<string, ProviderSummary[]>>((acc, s) => {
    (acc[s.provider] ??= []).push(s);
    return acc;
  }, {});

  const totalCost = summaries.reduce((sum, s) => sum + s.total_cost, 0);

  function handleModelChange(model: string) {
    setSelectedModel(model);
    setCurrentPage(1);
  }

  function getPageNumbers(): (number | "...")[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const pages: (number | "...")[] = [1];
    if (currentPage > 3) pages.push("...");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">{t.expenses.title}</h1>
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{t.common.loading}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.expenses.title}</h1>
          <p className="text-sm text-[var(--text-muted)]">{t.expenses.description}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-[var(--text-muted)]">{t.expenses.totalExpense}</p>
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
                        {m.call_count} {t.common.call}
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
            {t.expenses.noUsageData}
          </p>
        </Card>
      )}

      {/* Filter + Table */}
      {records.length > 0 && (
        <>
          {/* Model Filter */}
          <div className="flex items-center gap-3">
            <div className="w-64">
              <Select
                options={modelOptions}
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
              />
            </div>
            <span className="text-sm text-[var(--text-muted)]">
              {filteredRecords.length} {t.common.record}
            </span>
          </div>

          {/* Usage Records Table */}
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-left text-[var(--text-muted)]">
                    <th className="px-4 py-3 font-medium">{t.expenses.date}</th>
                    <th className="px-4 py-3 font-medium">Model</th>
                    <th className="px-4 py-3 font-medium">{t.expenses.type}</th>
                    <th className="px-4 py-3 font-medium text-right">{t.expenses.input}</th>
                    <th className="px-4 py-3 font-medium text-right">{t.expenses.output}</th>
                    <th className="px-4 py-3 font-medium text-right">{t.expenses.cost}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.map((r) => (
                    <tr key={r.id} className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-tertiary)] transition-colors">
                      <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap">
                        {new Date(r.created_at + "Z").toLocaleString(locale, {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 truncate max-w-[160px]">{r.model}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {(t.expenses.callTypes as Record<string, string>)[r.call_type] ?? r.call_type}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{r.input_tokens.toLocaleString(locale)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{r.output_tokens.toLocaleString(locale)}</td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">{formatCost(r.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-color)]">
                <span className="text-sm text-[var(--text-muted)]">
                  {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredRecords.length)} / {filteredRecords.length}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {getPageNumbers().map((page, i) =>
                    page === "..." ? (
                      <span key={`dots-${i}`} className="px-2 text-sm text-[var(--text-muted)]">...</span>
                    ) : (
                      <Button
                        key={page}
                        variant={page === currentPage ? "primary" : "ghost"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    )
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
