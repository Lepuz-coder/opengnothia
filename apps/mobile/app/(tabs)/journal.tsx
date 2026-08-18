import { BookOpen } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { ScreenPlaceholder } from "@/ui";

export default function JournalScreen() {
  const { t } = useTranslation();
  return <ScreenPlaceholder icon={BookOpen} title={t.nav.notebook} description={t.journal.description} />;
}
