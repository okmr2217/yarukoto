export type Category = {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
  updatedAt: string;
};

export const CATEGORY_COLORS = [
  { name: "red", value: "#EF4444" },
  { name: "orange", value: "#F97316" },
  { name: "yellow", value: "#EAB308" },
  { name: "green", value: "#22C55E" },
  { name: "blue", value: "#3B82F6" },
  { name: "purple", value: "#A855F7" },
  { name: "gray", value: "#6B7280" },
] as const;
