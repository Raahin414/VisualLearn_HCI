"use client";
import { Component, type ReactNode } from "react";
export class StudyErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main id="main" className="container prose-page">
          <h1>Your saved work is preserved.</h1>
          <p>
            The study screen could not open. Reopen your private return link or
            reload this page to recover the server-saved session.
          </p>
          <button
            className="button button-primary"
            onClick={() => window.location.reload()}
          >
            Reload saved session
          </button>
        </main>
      );
    return this.props.children;
  }
}
