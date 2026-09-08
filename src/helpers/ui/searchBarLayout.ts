import {
  MONTH_QUICK_ADD_COLLAPSED_HEIGHT,
  MONTH_QUICK_ADD_EXPANDED_HEIGHT,
} from "@/constants/schedule";
import { semantic } from "@/tokens";

/** Bottom search pill height when collapsed. Shared with month quick-add. */
export const SEARCH_BAR_COLLAPSED_HEIGHT = MONTH_QUICK_ADD_COLLAPSED_HEIGHT;

/** Bottom search pill height when focused. Shared with month quick-add. */
export const SEARCH_BAR_EXPANDED_HEIGHT = MONTH_QUICK_ADD_EXPANDED_HEIGHT;

/** Reserved viewport space for a bottom search bar above the safe area. */
export function getSearchBarReservedHeight(bottomInset: number): number {
  const verticalPad = semantic.space.stack.compact;
  return SEARCH_BAR_COLLAPSED_HEIGHT + verticalPad + verticalPad + bottomInset;
}
