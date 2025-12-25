
export interface NavLink {
    href: string;
    title: string;
    label?: string;
    disabled?: boolean;
    items?: NavLink[];
  }
  
  export const navLinks: NavLink[] = [
    {
      href: "/docs",
      title: "Docs",
    },
    {
      href: "/animated-choropleth",
      title: "Animated Choropleth",
    },
    {
      href: "/scatterplot-matrix",
      title: "Scatterplot Matrix",
    },
    {
      href: "/heatmap",
      title: "Heatmap",
    },
    {
      href: "/force-graph",
      title: "Force Graph",
    },
    {
      href: "/hierarchical",
      title: "Hierarchical",
    }
  ];