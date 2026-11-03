import { createContext, useContext } from "react";
import type { AvatarSize } from "./Avatar";

/** The size an `Avatar.Stack` gives the avatars in it, so each does not repeat it. */
export const AvatarStackContext = createContext<AvatarSize | null>(null);

export const useAvatarStackSize = () => useContext(AvatarStackContext);
