// src/components/sidebar-nav.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarNavItem } from "@/types/nav";
import { cn } from "@/lib/utils";

export interface DocsSidebarNavProps {
  config: { components: SidebarNavItem[] };
  indexTitle: string; // Receive index title as a prop
}

interface DocsSidebarNavItemsProps {
  items: SidebarNavItem[];
  pathname: string | null;
}

const DocsSidebarNavItems = ({
  items,
  pathname,
}: DocsSidebarNavItemsProps) => {
  return items.length ? (
    <div className="grid grid-flow-row auto-rows-max text-sm">
      {items.map((item: SidebarNavItem, index: number) =>
        !item.disabled ? (
          <Link
            key={index}
            href={item.href ?? "#"} // Ensure a fallback for href
            className={cn(
              "group flex w-full items-center rounded-md border border-transparent px-2 py-1 hover:underline",
              pathname === item.href
                ? "font-medium text-foreground"
                : "text-muted-foreground"
            )}
            target={item.external ? "_blank" : ""}
            rel={item.external ? "noreferrer" : ""}
          >
            {item.title}
            {item.label && (
              <span className="ml-2 rounded-md bg-[#adfa1d] px-1.5 py-0.5 text-xs leading-none text-[#000000] no-underline group-hover:no-underline">
                {item.label}
              </span>
            )}
          </Link>
        ) : (
          <span
            key={index}
            className={cn(
              "flex w-full cursor-not-allowed items-center rounded-md p-2 text-muted-foreground hover:underline",
              item.disabled && "cursor-not-allowed opacity-60"
            )}
          >
            {item.title}
            {item.label && (
              <span className="ml-2 rounded-md bg-muted px-1.5 py-0.5 text-xs leading-none text-muted-foreground no-underline group-hover:no-underline">
                {item.label}
              </span>
            )}
          </span>
        )
      )}
    </div>
  ) : null;
};

export function DocsSidebarNav({ config, indexTitle }: DocsSidebarNavProps) {  // Ensure named export
  const pathname = usePathname();

  const items = config.components;

  return items.length ? (
    <div className="w-full">
      <div className="mt-8 mb-4">
        <Link className="font-semibold" href="/docs">
          {indexTitle}
        </Link>
      </div>
      {items
        .sort((a, b) => a.title.localeCompare(b.title)) // Sort items alphabetically by title
        .map((item, index) => (
          <div key={index} className={cn("pb-4")}>
            <h4 className="mb-1 px-2 text-sm">
              <Link href={item.href ?? "#"}>{item.title}</Link> {/* Use fallback for href */}
            </h4>
            {item.items?.length && (
              <DocsSidebarNavItems items={item.items} pathname={pathname} />
            )}
          </div>
        ))}
    </div>
  ) : null;
}
