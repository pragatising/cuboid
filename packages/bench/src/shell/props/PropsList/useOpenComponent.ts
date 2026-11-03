import { exported } from "../../playground/compose";
import { locate, useSource } from "../../source";

/**
 * Where a header's arrow goes. A component that has a page of its own (`Box`, `Button`) opens it, on its Anatomy; one that is only written
 * inside another's folder (`ButtonBase`) opens its file in the source of the page that has the folder. Without a place to go, nothing:
 * the arrow is not shown.
 */
export function useOpenComponent() {
  const source = useSource();
  /** The source of a component, given where it is written (`src/…/ButtonBase.tsx#ButtonBase`). */
  const toSource = (id: string | undefined) => {
    const at = source ? locate(id) : null;
    return at && source ? () => source.open(at.component, at.file) : undefined;
  };
  /** A component, by name: its page when it has one, else its source from where it is written. */
  const to = (name: string, id?: string) => (source && exported[name] ? () => source.goto(name) : toSource(id));
  return { toSource, to };
}
