import React from "react";
import { ErrorBoundary } from "../ErrorBoundary";

/**
 * Draws an example, and when drawing it throws says so where it is, as an EmptyState with the error's message: a component that cannot be
 * drawn from what the engine composed (or wrote) is a finding, and must not take the rest of the shell down with it.
 */
export function ExampleBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary layout="compact" heading="This example could not be drawn">
      {children}
    </ErrorBoundary>
  );
}
