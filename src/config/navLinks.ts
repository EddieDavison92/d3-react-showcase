
export interface NavLink {
    href: string;
    title: string;
    label?: string;
    disabled?: boolean;
    items?: NavLink[];
  }
  
  export const navLinks: NavLink[] = [
    {
      href: "animated-choropleth",
      title: "Animated Choropleth",
    },
    {
      href: "scatterplot-matrix",
      title: "Scatterplot Matrix",
    }
  ];