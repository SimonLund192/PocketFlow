"use client";

import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
	data?: Array<{ month: string; value: number }>;
};

const defaultData: Array<{ month: string; value: number }> = [
	{ month: "Jan", value: 48 },
	{ month: "Feb", value: 52 },
	{ month: "Mar", value: 76 },
	{ month: "Apr", value: 64 },
	{ month: "May", value: 74 },
	{ month: "Jun", value: 40 },
	{ month: "Jul", value: 45 },
	{ month: "Aug", value: 63 },
	{ month: "Sep", value: 61 },
	{ month: "Oct", value: 47 },
	{ month: "Nov", value: 69 },
	{ month: "Dec", value: 66 },
	{ month: "Jan", value: 67 },
	{ month: "Feb", value: 50 },
	{ month: "Mar", value: 43 },
	{ month: "Apr", value: 50 },
	{ month: "May", value: 55 },
	{ month: "Jun", value: 48 },
];

export function WeeklyExpensesChart({ data }: Props) {
	const chartData = data ?? defaultData;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Weekly Expenses</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="h-[360px]">
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={chartData} barCategoryGap={18}>
							<CartesianGrid vertical={false} stroke="#EEF2FF" />
							<XAxis
								dataKey="month"
								axisLine={false}
								tickLine={false}
								fontSize={12}
								tickMargin={8}
								stroke="#94A3B8"
							/>
							<YAxis
								axisLine={false}
								tickLine={false}
								fontSize={12}
								stroke="#94A3B8"
							/>
							<Tooltip
								cursor={{ fill: "rgba(99, 102, 241, 0.08)" }}
								contentStyle={{
									borderRadius: 12,
									border: "1px solid #E2E8F0",
									boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
								}}
							/>
							<Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#6366F1" />
						</BarChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	);
}
