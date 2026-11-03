import { useState } from "react";
import { Box, Button, InputText } from "@sragatiping/cuboid";
import { smartLinkUrl } from "./smartLinkUrl";

/** What an empty link block shows: where to paste the address. It keeps the address once it is one a link can show, and says so when it is not. */
export function SmartLinkUrlField({ onSubmit }: { onSubmit: (url: string) => void }) {
  const [value, setValue] = useState("");
  const [invalid, setInvalid] = useState(false);

  const submit = () => {
    const url = smartLinkUrl(value);
    if (url) onSubmit(url);
    else setInvalid(true);
  };

  return (
    <Box flexDirection="row" alignItems="start" gap="1x">
      <Box flexGrow={1}>
        <InputText
          aria-label="Link address"
          placeholder="Paste a link"
          value={value}
          error={invalid ? "Enter an address starting with http:// or https://" : undefined}
          onChange={(event) => {
            setValue(event.target.value);
            setInvalid(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
        />
      </Box>
      <Button variant="primary" onClick={submit}>
        Add link
      </Button>
    </Box>
  );
}
