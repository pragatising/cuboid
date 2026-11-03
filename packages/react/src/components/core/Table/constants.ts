/** Cell padding and row height: the keys of `tokens.table.sizes.density`. */
export const TABLE_DENSITIES = ["dense", "spacious"] as const;

/** Which internal dividers are drawn. The outer frame is the root's and always stays. */
export const TABLE_LINES = ["none", "rows", "grid"] as const;

export const TABLE_ALIGNS = ["left", "center", "right"] as const;

/** What a cell does with content that does not fit: wrap onto more lines, or stay one line and be cut off (the whole text is then one hover, click or focus away). */
export const TABLE_ROW_LAYOUTS = ["wrap", "truncate"] as const;

/** A column's order: `none` is sortable and not sorted. A column that cannot be sorted has no sort at all. */
export const TABLE_SORTS = ["none", "asc", "desc"] as const;

/**
 * How the columns are sized. `auto` fits the content and works anywhere. `fixed` shares the container's width equally (or by the `col`s
 * given) and is what can cut text off; it needs a container that has a width. `scroll` is `fixed` with a floor: the table is never narrower
 * than its columns' own widths (give every column one with `col`), so it fills a wide container and scrolls sideways in a narrow one.
 */
export const TABLE_LAYOUTS = ["auto", "fixed", "scroll"] as const;
