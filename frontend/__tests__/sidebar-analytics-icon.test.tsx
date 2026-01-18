import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

import { Sidebar } from "@/components/Sidebar";

describe("Sidebar analytics nav", () => {
  it("contains analytics link", () => {
    render(<Sidebar />);
    const link = screen.getByTitle("Analytics") as HTMLAnchorElement;
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe("/analytics");
  });
});
