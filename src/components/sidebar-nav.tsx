// src/components/sidebar-nav.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarNavItem } from "@/types/nav";
import { type DocsConfig } from "@/config/docs";
import { cn } from "@/lib/utils";
import { docs } from "#site/content"; // Import the docs data

export interface DocsSidebarNavProps {
  config: DocsConfig;
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
            href={item.href}
            className={cn(
              "group flex w-full items-center rounded-md border border-transparent px-2 py-1 hover:underline",
              item.disabled && "cursor-not-allowed opacity-60",
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

export function DocsSidebarNav({ config }: DocsSidebarNavProps) {
  const pathname = usePathname();

  const items = config.components;

  // Find the root document entry
  const rootDoc = docs.find((doc) => doc.slug === "docs");

  return items.length ? (
    <div className="w-full">
      <div className="mt-8 mb-4">
        {rootDoc && (
          <Link className="font-semibold" href={`/${rootDoc.slug}`}>
            {rootDoc.title}
          </Link>
        )}
      </div>
      {items.map((item, index) => (
        <div key={index} className={cn("pb-4")}>
          <h4 className="mb-1 px-2 text-sm">
            <Link href={item.href}>
              {item.title}
            </Link>
          </h4>
          {item.items?.length && (
            <DocsSidebarNavItems items={item.items} pathname={pathname} />
          )}
        </div>
      ))}
    </div>
  ) : null;
}