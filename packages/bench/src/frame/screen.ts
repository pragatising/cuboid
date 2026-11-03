import { createContext, useContext } from "react";

/**
 * How wide the screen is that something is shown on (a device's, or a frame's), or null when it is not on one (a frame that fits its
 * content): what fills its container fills this.
 */
export const ScreenWidth = createContext<number | null>(null);
export const useScreenWidth = () => useContext(ScreenWidth);

/**
 * Whether the page in here scrolls by itself: on a device it does, as a page does in a window. In a frame it does not: the frame clips what does
 * not fit, as a frame does in Figma, and is as tall as what it holds unless it is given a height.
 */
export const ScreenScrolls = createContext(false);
export const useScreenScrolls = () => useContext(ScreenScrolls);
