const mockJsonResponse = (status: number, body: any, headers: Record<string, string> = {}) => {
	const h = new Headers({ "content-type": "application/json", ...headers });
	return {
		ok: status >= 200 && status < 300,
		status,
		headers: h,
		json: async () => body,
	} as any;
};

describe("api.ts request normalization", () => {
	beforeEach(() => {
		localStorage.clear();
		jest.resetModules();
	});

	it("uses updated selected user id on subsequent calls", async () => {
		const fetchMock = jest.fn();
		(globalThis as any).fetch = fetchMock;

		fetchMock.mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: new Headers({ "content-type": "application/json" }),
			json: async () => ({
				net_income: 0,
				total_savings: 0,
				total_expenses: 0,
				goals_achieved: 0,
				period_change_percentage: 0,
				last_month_net_income: 0,
			}),
		});
		fetchMock.mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: new Headers({ "content-type": "application/json" }),
			json: async () => ({
				net_income: 0,
				total_savings: 0,
				total_expenses: 0,
				goals_achieved: 0,
				period_change_percentage: 0,
				last_month_net_income: 0,
			}),
		});

		localStorage.setItem("selected_user_id", "user-a");
		const { api } = await import("../lib/api");
		await api.getDashboardStats();
		expect(fetchMock.mock.calls[0][1].headers["X-User-Id"]).toBe("user-a");

		localStorage.setItem("selected_user_id", "user-b");
		await api.getDashboardStats();
		expect(fetchMock.mock.calls[1][1].headers["X-User-Id"]).toBe("user-b");
	});

	test("attaches X-User-Id header", async () => {
		const { api, setSelectedUserId } = await import("../lib/api");
		setSelectedUserId("u1");

		const fetchSpy = jest.fn().mockResolvedValue(mockJsonResponse(200, { net_income: 0 }));
		(globalThis as any).fetch = fetchSpy;

		await api.getDashboardStats();

		const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
		const headers = init.headers as Record<string, string>;
		expect(headers["X-User-Id"]).toBe("u1");
	});

	test("parses successful JSON response", async () => {
		const { api, setSelectedUserId } = await import("../lib/api");
		setSelectedUserId("u1");

		const payload = {
			net_income: 1,
			total_savings: 2,
			total_expenses: 3,
			goals_achieved: 0,
			period_change_percentage: 0,
			last_month_net_income: 0,
		};

		(globalThis as any).fetch = jest.fn().mockResolvedValue(mockJsonResponse(200, payload));

		await expect(api.getDashboardStats()).resolves.toEqual(payload);
	});

	test("throws an Error on non-2xx", async () => {
		const { api, setSelectedUserId } = await import("../lib/api");
		setSelectedUserId("u1");

		(globalThis as any).fetch = jest
			.fn()
			.mockResolvedValue(mockJsonResponse(400, { detail: "Missing required X-User-Id header" }));

		await expect(api.getDashboardStats()).rejects.toThrow("Failed to fetch dashboard stats");
	});

	test("treats 204 as an error for JSON endpoints", async () => {
		const { api, setSelectedUserId } = await import("../lib/api");
		setSelectedUserId("u1");

		(globalThis as any).fetch = jest.fn().mockResolvedValue({
			ok: true,
			status: 204,
			headers: new Headers(),
			json: async () => {
				throw new Error("should not be called");
			},
		} as any);

			await expect(api.getDashboardStats()).rejects.toThrow("should not be called");
	});

	test("getTransactions includes X-User-Id header", async () => {
		const { api, setSelectedUserId } = await import("../lib/api");
		setSelectedUserId("tx-user");

		const fetchSpy = jest.fn().mockResolvedValue(mockJsonResponse(200, []));
		(globalThis as any).fetch = fetchSpy;

		await api.getTransactions();

		const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
		const headers = init.headers as Record<string, string>;
		expect(headers["X-User-Id"]).toBe("tx-user");
	});
});

