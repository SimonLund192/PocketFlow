import React from "react";
import { render, screen } from "@testing-library/react";

// Minimal smoke test: verifies Jest + RTL wiring works.
// We intentionally don't import Next.js pages here (they often rely on providers, fetch, etc.).

function Smoke() {
  return <div>Smoke OK</div>;
}

test("rtl renders", () => {
  render(<Smoke />);
  expect(screen.getByText("Smoke OK")).toBeInTheDocument();
});
