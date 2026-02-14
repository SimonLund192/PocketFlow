import {
  DollarSign,
  Minus,
  Gamepad2,
  Receipt,
  Lightbulb,
  Heart,
  PiggyBank,
  Landmark,
  Home,
  Car,
  Shield,
  Globe,
  Smartphone,
  ShoppingBag,
  Zap,
  Coffee,
  CreditCard,
  Plane,
  BookOpen,
  Gift,
  Dumbbell,
  PawPrint,
  Music,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";

// ============================================================================
// Preset constants — single source of truth for category creation UI
// ============================================================================

export const CATEGORY_TYPES = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
  { value: "savings", label: "Savings" },
  { value: "fun", label: "Fun" },
] as const;

export const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#3b82f6", "#6366f1", "#a855f7",
  "#ec4899", "#f43f5e", "#06b6d4", "#84cc16",
];

export const PRESET_ICONS = [
  "💰", "🏠", "🛒", "💡", "🚗", "⛽", "📱", "📺",
  "🎬", "🍽️", "👕", "🐾", "🎁", "✈️", "🎮", "🛍️",
  "🏋️", "📦", "🎓", "🛡️", "💻", "🎨", "🌍", "📈",
];

// ============================================================================
// Legacy icon mapping (old string-name → Lucide component)
// Kept for backward-compat until all DB records are migrated.
// ============================================================================

const LEGACY_ICON_MAP: Record<string, LucideIcon> = {
  dollar: DollarSign,
  moneybag: DollarSign,
  minus: Minus,
  car: Car,
  house: Home,
  gamepad: Gamepad2,
  subscription: Smartphone,
  horse: PawPrint,
  receipt: Receipt,
  cart: ShoppingCart,
  food: ShoppingBag,
  plane: Plane,
  heart: Heart,
  book: BookOpen,
  lightbulb: Lightbulb,
  gift: Gift,
  coffee: Coffee,
  fitness: Dumbbell,
  pet: PawPrint,
  music: Music,
  "piggy-bank": PiggyBank,
  landmark: Landmark,
  shield: Shield,
  globe: Globe,
  zap: Zap,
};

/**
 * Check whether an icon value is an emoji (new format) vs a legacy string key.
 */
export function isEmojiIcon(icon: string): boolean {
  if (!icon) return false;
  // Legacy keys are short ASCII-only strings like "dollar", "car"
  return !/^[a-z0-9-]+$/.test(icon);
}

/**
 * Returns the Lucide icon component for a legacy icon string.
 * Falls back to CreditCard if the icon is unknown.
 * For emoji icons, callers should render the emoji string directly.
 */
export function getIconComponent(icon: string): LucideIcon {
  return LEGACY_ICON_MAP[icon] || CreditCard;
}

// ============================================================================
// Color utilities
// ============================================================================

/**
 * Legacy color-name → Tailwind bg class map.
 */
const LEGACY_COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-500",
  pink: "bg-pink-500",
  red: "bg-red-500",
  yellow: "bg-yellow-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  indigo: "bg-indigo-500",
};

/**
 * Check whether a color value is a hex string (new format) vs a legacy name.
 */
export function isHexColor(color: string): boolean {
  if (!color) return false;
  return color.startsWith("#");
}

/**
 * Returns the Tailwind background color class for a legacy color name.
 * For hex colors, callers should use inline style instead.
 * Falls back to bg-gray-500 if the color is unknown.
 */
export function getColorClass(color: string): string {
  if (isHexColor(color)) return ""; // caller should use inline style
  return LEGACY_COLOR_MAP[color] || "bg-gray-500";
}

/**
 * Map old icon string-names to the canonical emoji equivalent.
 * Used by the migration script.
 */
export const LEGACY_ICON_TO_EMOJI: Record<string, string> = {
  dollar: "💰",
  moneybag: "💰",
  minus: "💰",
  car: "🚗",
  house: "🏠",
  gamepad: "🎮",
  subscription: "📱",
  horse: "🐾",
  receipt: "🛒",
  cart: "🛒",
  food: "🍽️",
  plane: "✈️",
  heart: "❤️",
  book: "🎓",
  lightbulb: "💡",
  gift: "🎁",
  coffee: "☕",
  fitness: "🏋️",
  pet: "🐾",
  music: "🎵",
  "piggy-bank": "💰",
  landmark: "🏠",
  shield: "🛡️",
  globe: "🌍",
  zap: "⚡",
};

/**
 * Map old color names to hex equivalents. Used by the migration script.
 */
export const LEGACY_COLOR_TO_HEX: Record<string, string> = {
  blue: "#3b82f6",
  pink: "#ec4899",
  red: "#ef4444",
  yellow: "#eab308",
  green: "#22c55e",
  purple: "#a855f7",
  orange: "#f97316",
  indigo: "#6366f1",
};
