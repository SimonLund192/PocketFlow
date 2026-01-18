import "@testing-library/jest-dom";

// Keep Jest output clean by filtering a couple of well-known third‑party warnings
// that are common in jsdom and not actionable for unit tests.
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
	const msg = String(args[0] ?? "");

	// Recharts will warn when ResponsiveContainer can't measure element size in jsdom.
	if (msg.includes("The width(-1) and height(-1) of chart should be greater than 0")) {
		return;
	}

	// React warns when an older JSX transform is used by some deps in test env.
	if (msg.includes("Your app (or one of its dependencies) is using an outdated JSX transform")) {
		return;
	}

	originalWarn(...args);
};
