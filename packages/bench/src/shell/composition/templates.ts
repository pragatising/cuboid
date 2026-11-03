import type { Node } from "../../engine/types";
import type { DeviceId } from "../canvas/Device";

/**
 * A ready-made composition: a tree of the library's own components as data (`{ tag, props, children }`, the shape the engine already
 * composes examples in), so it is drawn, printed as code, and checked, exactly as an example is. Nothing in it is drawn by hand.
 * The device is where it is shown by default.
 */
export type Template = { id: string; title: string; description: string; device: DeviceId; root: Node };

const field = (children: Node[]): Node => ({ tag: "Box", props: { flexGrow: 1, flexBasis: "0", flexDirection: "column" }, children });

/** A sign-up form: text, every kind of input, a banner, a switch and the actions, in a page 72rem wide, centred. */
export const FORM: Template = {
  id: "form",
  title: "Form",
  description: "Text, every input, a banner and the actions, in a page 72rem wide.",
  device: "desktop",
  root: {
    tag: "Box",
    props: { flexDirection: "column", gap: "4x", width: "72rem", marginInline: "auto", paddingBlock: "8x", paddingInline: "4x" },
    children: [
      {
        tag: "Box",
        props: { flexDirection: "column", gap: "1x" },
        children: [
          { tag: "Heading", props: { as: "h1", size: "h3" }, children: ["Create your account"] },
          { tag: "Text", props: { color: "neutral.muted" }, children: ["It takes a minute. You can change any of this later in your settings."] },
        ],
      },
      { tag: "Callout", children: ["Your email is only used to sign in and to send receipts."] },
      {
        tag: "Box",
        props: { flexDirection: "row", gap: "3x" },
        children: [
          field([{ tag: "InputText", props: { label: "First name", placeholder: "Ada" } }]),
          field([{ tag: "InputText", props: { label: "Last name", placeholder: "Lovelace" } }]),
        ],
      },
      { tag: "InputText", props: { label: "Email", type: "email", placeholder: "ada@example.com", description: "We send a confirmation link here." } },
      { tag: "TextArea", props: { label: "About you", placeholder: "A line or two about what you work on" } },
      {
        tag: "Select",
        props: { label: "Country", defaultValue: "gb" },
        children: [
          { tag: "Select.Option", props: { value: "gb" }, children: ["United Kingdom"] },
          { tag: "Select.Option", props: { value: "in" }, children: ["India"] },
          { tag: "Select.Option", props: { value: "us" }, children: ["United States"] },
        ],
      },
      {
        tag: "Autocomplete",
        props: { label: "City", placeholder: "Start typing" },
        children: [
          { tag: "Autocomplete.Item", children: ["London"] },
          { tag: "Autocomplete.Item", children: ["Mumbai"] },
          { tag: "Autocomplete.Item", children: ["New York"] },
        ],
      },
      { tag: "Switch", props: { label: "Send me product news" } },
      { tag: "Divider" },
      {
        tag: "Box",
        props: { flexDirection: "row", gap: "2x", justifyContent: "flex-end" },
        children: [
          { tag: "Button", props: { variant: "secondary" }, children: ["Cancel"] },
          { tag: "Button", props: { variant: "primary" }, children: ["Create account"] },
        ],
      },
    ],
  },
};

export const TEMPLATES: Template[] = [FORM];
