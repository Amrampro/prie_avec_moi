import { useLocalSearchParams } from "expo-router";
import { NotificationsScreen } from "../../components/PrayerScreens";
export default function Detail() { const { id } = useLocalSearchParams<{id: string}>(); return <NotificationsScreen id={id} />; }
