import React from "react";
import { render, waitFor } from "@testing-library/react";

import { AuthProvider } from "@/contexts/AuthContext";

jest.mock("@/lib/api", () => {
	const actual = jest.requireActual("@/lib/api");
	return {
		...actual,
		api: {
			...actual.api,
			getCurrentUser: jest.fn().mockResolvedValue({
				id: "user-123",
				email: "Lund16@gmail.com",
				full_name: "Simon Lund",
				created_at: new Date().toISOString(),
			}),
		},
	};
});

describe("AuthContext user scoping", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("sets selected_user_id to the logged-in user's id on initial load", async () => {
		localStorage.setItem("token", "fake-token");
		render(
			<AuthProvider>
				<div>child</div>
			</AuthProvider>
		);

		await waitFor(() => {
			expect(localStorage.getItem("selected_user_id")).toBe("user-123");
		});
	});
});
