import { router, useLocalSearchParams } from "expo-router";
import { AgentDetailView } from "@/components/settings";

export default function AgentDetailScreen() {
	const { name } = useLocalSearchParams<{ name: string }>();

	const handleBack = () => {
		router.back();
	};

	return (
		<AgentDetailView
			agentName={decodeURIComponent(name || "")}
			onBack={handleBack}
			onDeleted={handleBack}
		/>
	);
}
