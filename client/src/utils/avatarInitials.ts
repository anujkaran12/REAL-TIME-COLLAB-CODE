export const getInitials = (name?: string) => {
  const parts = name?.trim().split(/\s+/).filter(Boolean) || [];

  if (parts.length === 0) {
    return "U";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};
