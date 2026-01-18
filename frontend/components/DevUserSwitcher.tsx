"use client";

import { useEffect, useState } from "react";

import { api, getSelectedUserId, setSelectedUserId, type User } from "@/lib/api";

export default function DevUserSwitcher() {
	const [users, setUsers] = useState<User[]>([]);
	const [selected, setSelected] = useState<string | null>(getSelectedUserId());
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let active = true;
		(async () => {
			try {
				const list = await api.listUsers();
				if (active) setUsers(list);
			} catch (e) {
				if (active) setError(e instanceof Error ? e.message : String(e));
			}
		})();
		return () => {
			active = false;
		};
	}, []);

	const onChange = (userId: string) => {
		setSelectedUserId(userId);
		setSelected(userId);
	};

	return (
		<div className="text-xs">
			<div className="font-medium">User</div>
			{error && <div className="text-red-600">{error}</div>}
			<select
				aria-label="Dev user"
				className="mt-1 w-full rounded border px-2 py-1"
				value={selected ?? ""}
				onChange={(e) => onChange(e.target.value)}
			>
				<option value="">Select user…</option>
				{users.map((u) => (
					<option key={u.id} value={u.id}>
						{u.full_name}
					</option>
				))}
			</select>
		</div>
	);
}
