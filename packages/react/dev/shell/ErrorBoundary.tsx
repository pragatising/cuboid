import React from "react";
import { EmptyState } from "../../src";

type Props = {
  children: React.ReactNode;
  /** What could not be shown, as the heading of the message (`default` layout only). @default "Something went wrong" */
  heading?: string;
  /** `compact` for a small place (an example in a frame, a pane); `default` for a page. @default "default" */
  layout?: "default" | "compact";
  /**
   * When this changes the error is forgotten and the children are tried again: the page or the component being looked at is another.
   * Without it a crash would stay until the page was reloaded.
   */
  resetKey?: unknown;
};

/**
 * Keeps one part of the shell from taking the rest down: what throws while its children draw is shown as an `EmptyState`, with the error's
 * own message, where they would be. The rest of the shell stays, and moving to another page or component tries again.
 */
export class ErrorBoundary extends React.Component<Props, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    // For whoever is looking at the console as well as the page.
    console.error(error);
  }

  componentDidUpdate(previous: Props) {
    if (this.state.error && previous.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const { heading = "Something went wrong", layout = "default" } = this.props;
    return <EmptyState role="alert" layout={layout} icon="error" heading={heading} description={error.message || String(error)} />;
  }
}
