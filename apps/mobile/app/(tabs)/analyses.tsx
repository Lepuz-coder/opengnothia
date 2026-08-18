import { BarChart3 } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { ScreenPlaceholder } from "@/ui";

export default function AnalysesScreen() {
  const { t } = useTranslation();
  return <ScreenPlaceholder icon={BarChart3} title={t.analyses.title} description={t.analyses.description} />;
}
