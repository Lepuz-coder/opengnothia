import { Home } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { ScreenPlaceholder } from "@/ui";

export default function HomeScreen() {
  const { t } = useTranslation();
  return <ScreenPlaceholder icon={Home} title={t.nav.home} description={t.dashboard.greeting} />;
}
