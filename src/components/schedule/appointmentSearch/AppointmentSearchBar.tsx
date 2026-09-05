export {
  SearchBar,
  type SearchBarProps,
} from "@/components/search";
export { getSearchBarReservedHeight } from "@/helpers/searchBarLayout";

/** @deprecated Use `SearchBar` from `@/components/search`. */
export { SearchBar as AppointmentSearchBar } from "@/components/search";

/** @deprecated Use `SearchBarProps` from `@/components/search`. */
export type { SearchBarProps as AppointmentSearchBarProps } from "@/components/search";

/** @deprecated Use `getSearchBarReservedHeight` from `@/helpers/searchBarLayout`. */
export { getSearchBarReservedHeight as getAppointmentSearchBarReservedHeight } from "@/helpers/searchBarLayout";
