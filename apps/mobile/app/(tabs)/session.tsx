import { MessageSquare } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { ScreenPlaceholder } from "@/ui";

export default function SessionScreen() {
  const { t } = useTranslation();
  return <ScreenPlaceholder icon={MessageSquare} title={t.session.title} description={t.session.description} />;
}
