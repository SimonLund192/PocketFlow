"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";

export default function AnalyticsPage() {
	const { isAuthenticated, isLoading } = useAuth();
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		// Placeholder for future analytics API calls.
		// Keeping this page lightweight avoids regressions while we lock in routing.
		setError(null);
	}, []);

	if (isLoading) {
		return (
			<main className="p-6">
				<h1 className="text-2xl font-semibold">Analytics</h1>
				<p className="text-sm text-muted-foreground mt-2">Loading…</p>
			</main>
		);
	}

	if (!isAuthenticated) {
		return (
			<main className="p-6">
				<h1 className="text-2xl font-semibold">Analytics</h1>
				<p className="text-sm text-muted-foreground mt-2">Please log in to view analytics.</p>
			</main>
		);
	}

	return (
		<main className="p-6">
			<h1 className="text-2xl font-semibold">Analytics</h1>
			<p className="text-sm text-muted-foreground mt-2">
				Coming soon: deeper insights across transactions, budgets, and goals.
			</p>
			{error && (
				<div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
					{error}
				</div>
			)}
		</main>
	);
}
