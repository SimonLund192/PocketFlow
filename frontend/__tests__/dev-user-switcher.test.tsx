import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("@/lib/api", () => ({
	api: {
		listUsers: jest.fn().mockResolvedValue([]),
		createUser: jest.fn(),
	},
	getSelectedUserId: () => null,
	setSelectedUserId: () => undefined,
}));

import DevUserSwitcher from "@/components/DevUserSwitcher";

describe("DevUserSwitcher", () => {
	it("renders basic UI", async () => {
		render(<DevUserSwitcher />);
		expect(await screen.findByText("User")).toBeInTheDocument();
		expect(screen.getByLabelText("Dev user")).toBeInTheDocument();
	});
});
