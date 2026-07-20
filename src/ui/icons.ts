/**
 * Thin wrapper around Lucide icons for DOM usage (no React).
 */

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  createElement,
  Ellipsis,
  ExternalLink,
  File,
  Folder,
  Search,
  Settings,
  X,
  type IconNode
} from "lucide";

export type IconName =
  | "search"
  | "folder"
  | "file"
  | "copy"
  | "settings"
  | "external-link"
  | "ellipsis"
  | "x"
  | "chevron-left"
  | "chevron-right"
  | "check";

const ICONS: Record<IconName, IconNode> = {
  search: Search,
  folder: Folder,
  file: File,
  copy: Copy,
  settings: Settings,
  "external-link": ExternalLink,
  ellipsis: Ellipsis,
  x: X,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  check: Check
};

export type IconOptions = {
  size?: number;
  className?: string;
  strokeWidth?: number;
  label?: string;
};

/** Create an inline SVG element from Lucide. */
export function createIcon(name: IconName, options: IconOptions = {}): SVGSVGElement {
  const size = options.size ?? 16;
  const strokeWidth = options.strokeWidth ?? 1.75;
  const svg = createElement(ICONS[name], {
    width: size,
    height: size,
    "stroke-width": strokeWidth,
    class: ["icon", options.className].filter(Boolean).join(" ")
  }) as SVGSVGElement;

  if (options.label) {
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", options.label);
    svg.removeAttribute("aria-hidden");
  } else {
    svg.setAttribute("aria-hidden", "true");
  }

  return svg;
}

/** SVG markup string for Shadow DOM templates. */
export function iconHtml(name: IconName, options: IconOptions = {}): string {
  return createIcon(name, options).outerHTML;
}

/** Append icon + text label into a button (clears existing children). */
export function setButtonContent(
  button: HTMLElement,
  icon: IconName,
  label: string,
  options: IconOptions = {}
): void {
  button.replaceChildren();
  button.append(
    createIcon(icon, { size: options.size ?? 16, strokeWidth: options.strokeWidth }),
    document.createTextNode(label)
  );
}
