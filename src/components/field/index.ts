/**
 * The field-guide component library.
 *
 * Everything the product is built from — marketing, app interior and admin
 * alike — comes from here, so the app cannot drift into looking like a
 * different product than the landing page.
 */

export { Avatar, avatarVariant, initialsFrom, type AvatarVariant } from "./avatar";
export { EmptyState } from "./empty-state";
export {
  Contours,
  IconApproved,
  IconArrowRight,
  IconBonus,
  IconCheck,
  IconClock,
  IconClose,
  IconCross,
  IconDot,
  IconGoogle,
  IconLock,
  IconPin,
  IconShield,
  IconStrava,
  LogoMark,
  Seal,
} from "./icons";
export { Modal } from "./modal";
export { Eyebrow, Panel, PanelHead } from "./panel";
export { Pill, PillGroup } from "./pill";
export {
  QuestBonus,
  QuestCard,
  QuestLocked,
  QuestParty,
  QuestSafetyNotice,
  type QuestCardProps,
} from "./quest-card";
export { Stat, StatRow, formatMetres, type StatItem } from "./stat";
export { STICKER_ARTWORK, Sticker, StickerSheet } from "./sticker";
export { DifficultyTag, Tag, isWarmDifficulty, type TagTone } from "./tag";
export { ToastProvider, useToast, type ToastTone } from "./toast";
