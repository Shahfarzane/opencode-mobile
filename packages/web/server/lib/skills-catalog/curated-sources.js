export const CURATED_SKILLS_SOURCES = [
  {
    id: 'anthropic',
    label: 'Anthropic',
    description: "Anthropic’s public skills repository",
    source: 'anthropics/skills',
    defaultSubpath: 'skills',
  },
];

export function getCuratedSkillsSources() {
  return CURATED_SKILLS_SOURCES.slice();
}
