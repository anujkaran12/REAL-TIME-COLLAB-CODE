const AVATAR_COLORS = [
  "#2563eb",
  "#059669",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#be123c",
  "#4f46e5",
  "#16a34a",
  "#c2410c",
];

export const getAvatarColor = (seed = "") => {
  const safeSeed = seed || "user";
  const hash = safeSeed.split("").reduce((total, char) => {
    return char.charCodeAt(0) + ((total << 5) - total);
  }, 0);

  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};
