import React from "react";
import { Box } from "../../Box";
import { Text } from "../../Text";
import { useSmartCardContext } from "../SmartCardContext";

export type SmartCardBlockFooterProps = Omit<React.ComponentPropsWithRef<"div">, "color" | "content">;

/** The line at the bottom: the service the link belongs to, and what is given as `children` (its actions) at the end. Nothing is drawn when both are empty. */
export function SmartCardBlockFooter({ children, ...props }: SmartCardBlockFooterProps) {
  const { data } = useSmartCardContext("SmartCard.Block.Footer");
  if (!data?.provider && !children) return null;
  return (
    <Box data-component="SmartCard.Block.Footer" flexDirection="row" alignItems="center" justifyContent="space-between" gap="1x" {...props}>
      <Text as="span" size="sm" color="neutral.muted">
        {data?.provider}
      </Text>
      {children}
    </Box>
  );
}
