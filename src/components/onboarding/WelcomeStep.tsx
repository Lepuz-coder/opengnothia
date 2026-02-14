import { Shield, Lock, Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="text-center space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Hoş geldin</h1>
      <p className="text-[var(--text-secondary)]">
        OpenGnothia, yapay zeka destekli psikolojik destek uygulamandır. Tüm verilerin cihazında kalır, güvenliğin bizim için en önemli şey.
      </p>

      <div className="space-y-3 text-left">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-primary)]">
          <Lock className="w-5 h-5 text-primary-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">Tamamen Yerel</p>
            <p className="text-xs text-[var(--text-muted)]">Tüm verilerin cihazında şifrelenmiş olarak saklanır</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-primary)]">
          <Shield className="w-5 h-5 text-primary-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">Kendi API Anahtarın</p>
            <p className="text-xs text-[var(--text-muted)]">AI sağlayıcınla doğrudan iletişim, aracı yok</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-primary)]">
          <Heart className="w-5 h-5 text-primary-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">Açık Kaynak</p>
            <p className="text-xs text-[var(--text-muted)]">Kodun tamamı incelenebilir, topluluk tarafından geliştirilir</p>
          </div>
        </div>
      </div>

      <Button onClick={onNext} size="lg" className="w-full">
        Başlayalım
      </Button>
    </div>
  );
}
