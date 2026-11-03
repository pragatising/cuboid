import { createContext } from "react";

/**
 * Where a picture's file goes. An app provides it (`<ImageUpload.Provider value={upload}>`): it takes the file and returns the address to keep. Without
 * one a picture keeps the file's own data URL.
 */
export const ImageUpload = createContext<((file: File) => Promise<string>) | undefined>(undefined);

/**
 * What removing a picture does. An app provides it (`<ImageRemove.Provider value={remove}>`): it gets the picture's address and may delete the uploaded
 * file. The block lets go of the picture once it resolves, and keeps it, showing the reason, if it rejects. Without one removing only clears the block.
 */
export const ImageRemove = createContext<((src: string) => void | Promise<void>) | undefined>(undefined);

/** The writer edits Cuboid's `Image` in place: the same picture a reader gets, with its Add Image bar, resize handles, caption and toolbar. */
