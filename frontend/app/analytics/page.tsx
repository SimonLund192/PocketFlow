"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { WeeklyExpensesChart } from "@/components/analytics/WeeklyExpensesChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AnalyticsPage() {
	// Next.js requires `useSearchParams()` to be used within a Suspense boundary.
	// We keep the page logic intact by rendering a Suspense-wrapped body.
	return (
		<Suspense fallback={<AnalyticsPageFallback />}>
			<AnalyticsPageBody />
		</Suspense>
	);
}

function AnalyticsPageFallback() {
	return (
		<div className="space-y-4">
			<div className="space-y-1">
				<h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
				<p className="text-sm text-muted-foreground">Loading…</p>
			</div>
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Card key={i}>
						<CardHeader className="space-y-2">
							<div className="h-3 w-24 animate-pulse rounded bg-muted" />
							<div className="h-7 w-20 animate-pulse rounded bg-muted" />
							<div className="h-3 w-40 animate-pulse rounded bg-muted" />
						</CardHeader>
					</Card>
				))}
			</div>
		</div>
	);
}

function AnalyticsPageBody() {
	const { isAuthenticated, isLoading } = useAuth();
	const router = useRouter();
	const searchParams = useSearchParams();
	const [error, setError] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState("analytics");

	useEffect(() => {
		// Placeholder for future analytics API calls.
		// Keeping this page lightweight avoids regressions while we lock in routing.
	}, []);

	useEffect(() => {
		const tabParam = searchParams.get("tab");
		if (tabParam) setActiveTab(tabParam);
	}, [searchParams]);

	const handleTabChange = (value: string) => {
		setActiveTab(value);
		if (value === "analytics") {
			router.push("/analytics", { scroll: false });
			return;
		}
		router.push(`/analytics?tab=${value}`, { scroll: false });
	};

	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="space-y-1">
					<h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
					<p className="text-sm text-muted-foreground">Loading…</p>
				</div>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Card key={i}>
							<CardHeader className="space-y-2">
								<div className="h-3 w-24 animate-pulse rounded bg-muted" />
								<div className="h-7 w-20 animate-pulse rounded bg-muted" />
								<div className="h-3 w-40 animate-pulse rounded bg-muted" />
							</CardHeader>
						</Card>
					))}
				</div>
			</div>
		);
	}

	if (!isAuthenticated) {
		return (
				<div className="space-y-6">
					<h1 className="text-2xl font-semibold">Analytics</h1>
					<p className="text-sm text-muted-foreground mt-2">Please log in to view analytics.</p>
				</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
				<p className="text-sm text-muted-foreground">
					Showing insights for your most recent activity.
				</p>
			</div>

			<Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
				<TabsList className="h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
					<TabsTrigger value="analytics" className="rounded-full">
						Analytics
					</TabsTrigger>
					<TabsTrigger value="expenses" className="rounded-full">
						Expenses
					</TabsTrigger>
					<TabsTrigger value="income" className="rounded-full">
						Income
					</TabsTrigger>
					<TabsTrigger value="income-vs-expenses" className="rounded-full">
						Income vs Expenses
					</TabsTrigger>
					<TabsTrigger value="balance" className="rounded-full">
						Balance
					</TabsTrigger>
					<TabsTrigger value="transaction-history" className="rounded-full">
						Transaction History
					</TabsTrigger>
				</TabsList>

				<TabsContent value="analytics" className="space-y-6">
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						<Card>
							<CardHeader className="space-y-1">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Daily Average
								</CardTitle>
								<div className="text-2xl font-semibold">$68.00</div>
								<p className="text-xs text-muted-foreground">
									Avg spend per day (last 30 days)
								</p>
							</CardHeader>
							<CardContent />
						</Card>

						<Card>
							<CardHeader className="space-y-1">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Change
								</CardTitle>
								<div className="text-2xl font-semibold text-emerald-600">+12%</div>
								<p className="text-xs text-muted-foreground">
									Compared to previous 30 days
								</p>
							</CardHeader>
							<CardContent />
						</Card>

						<Card>
							<CardHeader className="space-y-1">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Total Transactions
								</CardTitle>
								<div className="text-2xl font-semibold">315</div>
								<p className="text-xs text-muted-foreground">Last 90 days</p>
							</CardHeader>
							<CardContent />
						</Card>

						<Card>
							<CardHeader className="space-y-1">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Categories
								</CardTitle>
								<div className="text-2xl font-semibold">14</div>
								<p className="text-xs text-muted-foreground">
									Active spending categories
								</p>
							</CardHeader>
							<CardContent />
						</Card>
					</div>

					<WeeklyExpensesChart />
				</TabsContent>

				{(
					[
						"expenses",
						"income",
						"income-vs-expenses",
						"balance",
						"transaction-history",
					] as const
				).map((tab) => (
					<TabsContent key={tab} value={tab}>
						<Card>
							<CardHeader>
								<CardTitle className="capitalize">
									{tab.replaceAll("-", " ")}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									This view is coming next.
								</p>
							</CardContent>
						</Card>
					</TabsContent>
				))}
			</Tabs>

			{error && (
				<div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
					{error}
				</div>
			)}
		</div>
	);
}
