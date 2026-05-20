import { GraduationCap } from "lucide-react";
import { PlaceholderPage } from "@/components/ui/PlaceholderPage";
import { useTranslation } from "@/i18n";

export default function ProgramsPage() {
  const { t } = useTranslation();
  return <PlaceholderPage icon={GraduationCap} title={t.programs.title} description={t.programs.comingSoon} />;
}
