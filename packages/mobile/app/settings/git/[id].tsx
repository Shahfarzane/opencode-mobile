import { router, useLocalSearchParams } from "expo-router";
import { GitIdentityDetailView } from "@/components/settings";

export default function GitIdentityDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();

	const handleBack = () => {
		router.back();
	};

	return (
		<GitIdentityDetailView
			profileId={decodeURIComponent(id || "")}
			onBack={handleBack}
			onDeleted={handleBack}
		/>
	);
}
