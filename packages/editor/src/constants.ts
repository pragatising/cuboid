/**
 * What a container may hold. Text blocks are named; every block definition joins `columnBlock` and `calloutBlock` unless it opts out, so a
 * new block (image, embed, table) can be put in a column or a callout without touching this list.
 */
export const COLUMN_CONTENT = "(paragraph | heading | bulletList | orderedList | blockquote | columnBlock)+";
export const CALLOUT_CONTENT = "(paragraph | heading | bulletList | orderedList | blockquote | calloutBlock)+";

/** A table does not grow past this many columns: past it the cells are narrower than a word, and the page scrolls sideways. */
export const MAX_TABLE_COLUMNS = 12;
