/** What is a control inside a block's own view (an upload bar, a toolbar button, a resize handle, a field) and not part of the document. */
const CONTROL = 'button, input, textarea, select, a[href], [role="separator"], [role="slider"]';

/**
 * Whether an event came from a control in a block's view, whatever part of it was hit (a button's label and icon are spans inside it). The editor
 * leaves such an event alone: a click on "Add Image" opens the file chooser, it does not select the block, which is what the gutter's handle does.
 */
export const isControlEvent = ({ event }: { event: Event }): boolean => (event.target instanceof Element ? event.target.closest(CONTROL) !== null : false);
