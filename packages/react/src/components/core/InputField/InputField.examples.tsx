import { useId } from "react";
import { InputField } from "@sragatiping/cuboid";

/** The chrome around a control: a label above, help text and an error below. The control goes in `InputField.Shell`. */
export function Default() {
  const id = useId();
  return (
    <InputField label="Email" controlId={id} description="We send a confirmation link here.">
      <InputField.Shell>
        <input id={id} type="email" placeholder="ada@example.com" />
      </InputField.Shell>
    </InputField>
  );
}

export function WithError() {
  const id = useId();
  return (
    <InputField label="Email" controlId={id} error="Enter an email address.">
      <InputField.Shell invalid leadingVisual="mail">
        <input id={id} type="email" defaultValue="ada@" aria-invalid />
      </InputField.Shell>
    </InputField>
  );
}

export function WithLabelHelpAndCount() {
  const id = useId();
  return (
    <InputField label="Display name" controlId={id} labelHelp="Shown next to your comments." count="3 / 40">
      <InputField.Shell>
        <input id={id} defaultValue="Ada" />
      </InputField.Shell>
    </InputField>
  );
}

export function Disabled() {
  const id = useId();
  return (
    <InputField label="Email" controlId={id} disabled>
      <InputField.Shell disabled>
        <input id={id} defaultValue="ada@example.com" disabled />
      </InputField.Shell>
    </InputField>
  );
}
