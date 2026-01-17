import { getSelectedUserId, setSelectedUserId } from "../lib/api";

describe("API user context contract", () => {
  beforeEach(() => {
    // jsdom localStorage is available in Jest env
    localStorage.clear();
    jest.restoreAllMocks();
  });

  test("api attaches X-User-Id header when selected", async () => {
    setSelectedUserId("user-123");

    const fetchSpy = jest.fn().mockResolvedValue({
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
    } as any);
    (globalThis as any).fetch = fetchSpy;

    const { api } = await import("../lib/api");

    await api.getDashboardStats();

    expect(fetchSpy).toHaveBeenCalled();
    const [, init] = fetchSpy.mock.calls[0] as [unknown, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["X-User-Id"]).toBe("user-123");
  });

  test("getSelectedUserId reads from localStorage", () => {
    localStorage.setItem("selected_user_id", "abc");
    expect(getSelectedUserId()).toBe("abc");
  });
});
