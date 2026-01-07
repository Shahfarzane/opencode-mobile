import { router, useLocalSearchParams } from "expo-router";
import { CommandDetailView } from "@/components/settings";

export default function CommandDetailScreen() {
	const { name } = useLocalSearchParams<{ name: string }>();

	const handleBack = () => {
		router.back();
	};

	return (
		<CommandDetailView
			commandName={decodeURIComponent(name || "")}
			onBack={handleBack}
			onDeleted={handleBack}
		/>
	);
}
