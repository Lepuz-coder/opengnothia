import { useNavigate } from "react-router";
import { MessageSquare, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useEffect, useState } from "react";
import { getTodaySession } from "@/services/db/queries";

export function SessionStatusCard() {
  const navigate = useNavigate();
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    getTodaySession().then((s) => {
      if (s && s.status === "completed") setHasSession(true);
    });
  }, []);

  return (
    <Card>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
          <MessageSquare className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-[var(--text-primary)]">
            {hasSession ? "Bugünkü Seans" : "Seans"}
          </h3>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {hasSession ? (
              <span className="flex items-center gap-1.5 text-green-600">
                <CheckCircle className="w-4 h-4" /> Tamamlandı
              </span>
            ) : (
              "Bugünkü seansın seni bekliyor"
            )}
          </p>
          {!hasSession && (
            <Button onClick={() => navigate("/session")} size="sm" className="mt-3">
              Seans Başlat
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
