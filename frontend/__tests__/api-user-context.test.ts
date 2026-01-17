import { getSelectedUserId, setSelectedUserId, api } from '../lib/api';

let fetchMock: jest.Mock;

function mockJsonResponse(status: number, body: unknown) {
	return {
		ok: status >= 200 && status < 300,
		status,
		json: async () => body,
	} as Response;
}

describe('user context (dev mode)', () => {
	beforeEach(() => {
		fetchMock = jest.fn();
		(global as any).fetch = fetchMock;
		localStorage.clear();
	});

	test('setSelectedUserId stores and clears selected user', () => {
		expect(getSelectedUserId()).toBeNull();

		setSelectedUserId('u-123');
		expect(getSelectedUserId()).toBe('u-123');
		expect(localStorage.getItem('selected_user_id')).toBe('u-123');

		setSelectedUserId(null);
		expect(getSelectedUserId()).toBeNull();
		expect(localStorage.getItem('selected_user_id')).toBeNull();
	});

	test('api.getTransactions attaches X-User-Id when selected', async () => {
		setSelectedUserId('tx-user');

		fetchMock.mockResolvedValueOnce(mockJsonResponse(200, []));
		await api.getTransactions();

		const [, init] = fetchMock.mock.calls[0];
		expect(init.headers['X-User-Id']).toBe('tx-user');
	});

	test('api.getTransactions does not attach X-User-Id when none selected', async () => {
		fetchMock.mockResolvedValueOnce(mockJsonResponse(200, []));
		await api.getTransactions();

		const [, init] = fetchMock.mock.calls[0];
		expect(init.headers['X-User-Id']).toBeUndefined();
	});
});
