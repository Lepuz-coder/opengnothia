import { Wind } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { ScreenPlaceholder } from "@/ui";

export default function BreatheScreen() {
  const { t } = useTranslation();
  return <ScreenPlaceholder icon={Wind} title={t.breathing.title} description={t.breathing.description} />;
}
