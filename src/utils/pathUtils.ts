export function joinPath(parentPath: string, name: string): string {
  if (!parentPath) {
    return name;
  }
  if (!name) {
    return parentPath;
  }

  const normalized = parentPath.replace(/[/\\]+$/, "");
  const separator = parentPath.includes("/") && !parentPath.includes("\\") ? "/" : "\\";
  return `${normalized}${separator}${name}`;
}

export function isFolderType(type: string | undefined): boolean {
  return (type ?? "").toLowerCase() === "folder";
}

export function getParentPath(fullPath: string): string {
  const normalized = fullPath.replace(/[/\\]+$/, "");
  const idx = Math.max(normalized.lastIndexOf("\\"), normalized.lastIndexOf("/"));
  if (idx <= 0) {
    return "";
  }
  return normalized.slice(0, idx);
}
