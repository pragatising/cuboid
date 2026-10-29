import { createContext, useContext } from "react";

/**
 * How wide the screen is that something is shown on (a device's, or a frame's), or null when it is not on one (a frame that fits its
 * content): what fills its container fills this.
 */
export const ScreenWidth = createContext<number | null>(null);
export const useScreenWidth = () => useContext(ScreenWidth);
