import { router, useLocalSearchParams } from "expo-router";
import { ProviderDetailView } from "@/components/settings";

export default function ProviderDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();

	const handleBack = () => {
		router.back();
	};

	return (
		<ProviderDetailView
			providerId={decodeURIComponent(id || "")}
			onBack={handleBack}
		/>
	);
}
