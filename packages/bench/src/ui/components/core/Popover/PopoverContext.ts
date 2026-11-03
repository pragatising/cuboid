import { createContext, useContext } from "react";

/** What `Popover.Header` and `Popover.Body` need to know about the popover they are in. */
export type PopoverContextValue = {
  /** The id a string header's title gets, so the panel can be named by it. */
  titleId: string;
  hasHeader: boolean;
};

export const PopoverContext = createContext<PopoverContextValue>({ titleId: "", hasHeader: false });
export const usePopoverContext = () => useContext(PopoverContext);
