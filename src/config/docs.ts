import { SidebarNavItem } from "@/types/nav"

export interface DocsConfig {
	components: SidebarNavItem[];
}
export const docsConfig: DocsConfig = {
	components: [
		{
			title: 'Animated Choropleth',
			href: '/docs/animated-choropleth',
		},
		{
			title: 'Scatterplot Matrix',
			href: '/docs/scatterplot-matrix',
		},
		{
			title: 'Heatmap',
			href: '/docs/heatmap',
		},
		// Additional components can be added here
	],
};
