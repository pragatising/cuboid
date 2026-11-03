import React from "react";

/** An example that cannot be drawn is a finding: it says so, on the page, in plain text (this page has none of Bench's interface). */
export class Boundary extends React.Component<{ children: React.ReactNode; /** A change of this lets what is drawn be tried again. */ resetKey?: unknown }, { error: Error | null }> {
  state = { error: null as Error | null };
  componentDidUpdate(previous: { resetKey?: unknown }) {
    if (this.state.error && previous.resetKey !== this.props.resetKey) this.setState({ error: null });
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    return this.state.error ? (
      <p role="alert" data-bench-error="">
        This example could not be drawn: {this.state.error.message}
      </p>
    ) : (
      this.props.children
    );
  }
}
