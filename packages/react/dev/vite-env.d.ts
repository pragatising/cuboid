/// <reference types="vite/client" />

/** A fingerprint of what a check's answer depends on (dev/sourceHash.ts). */
declare module "virtual:source-hash" {
  const hash: string;
  export default hash;
}
