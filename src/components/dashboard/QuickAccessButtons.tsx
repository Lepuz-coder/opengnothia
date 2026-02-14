import { useNavigate } from "react-router";
import { AlertTriangle, BookOpen, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function QuickAccessButtons() {
  const navigate = useNavigate();

  const buttons = [
    {
      icon: AlertTriangle,
      label: "Acil Destek",
      desc: "Kriz anında yardım",
      color: "bg-red-900/30 text-red-400",
      onClick: () => navigate("/session"),
    },
    {
      icon: BookOpen,
      label: "Son Günlük",
      desc: "Günlüğüne yaz",
      color: "bg-blue-900/30 text-blue-400",
      onClick: () => navigate("/journal"),
    },
    {
      icon: GraduationCap,
      label: "Aktif Program",
      desc: "Programını gör",
      color: "bg-amber-900/30 text-amber-400",
      onClick: () => navigate("/programs"),
    },
  ];

  return (
    <Card>
      <h3 className="font-semibold mb-3">Hızlı Erişim</h3>
      <div className="grid grid-cols-3 gap-3">
        {buttons.map((btn) => (
          <button
            key={btn.label}
            onClick={btn.onClick}
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[var(--bg-primary)] transition-colors"
          >
            <div className={`w-10 h-10 rounded-xl ${btn.color} flex items-center justify-center`}>
              <btn.icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">{btn.label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
