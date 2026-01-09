import { router, useLocalSearchParams } from "expo-router";
import { SkillDetailView } from "@/components/settings";

export default function SkillDetailScreen() {
	const { name } = useLocalSearchParams<{ name: string }>();

	const handleBack = () => {
		router.back();
	};

	return (
		<SkillDetailView
			skillName={decodeURIComponent(name || "")}
			onBack={handleBack}
			onDeleted={handleBack}
		/>
	);
}
