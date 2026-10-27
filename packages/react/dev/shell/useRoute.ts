import { useEffect, useState } from "react";

/** The component being looked at, from the URL hash (`#/Button`), so a page can be linked to and the back button works. */
export function useRoute(fallback: string): [string, (name: string) => void] {
  const read = () => decodeURIComponent(window.location.hash.replace(/^#\//, "")) || fallback;
  const [name, setName] = useState(read);
  useEffect(() => {
    const onChange = () => setName(read());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `read` only closes over `fallback`, which is the first item
  }, []);
  return [name, (next) => (window.location.hash = `#/${encodeURIComponent(next)}`)];
}
