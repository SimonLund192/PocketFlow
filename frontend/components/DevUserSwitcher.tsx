"use client";

import { useEffect, useMemo, useState } from "react";
import { api, getSelectedUserId, setSelectedUserId, type User } from "@/lib/api";

type LoadState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "loaded"; users: User[] }
  | { kind: "error"; message: string };

export function DevUserSwitcher() {
  const [loadState, setLoadState] = useState<LoadState>({ kind: "idle" });
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    const initial = getSelectedUserId() || "";
    setSelected(initial);
  }, []);

  useEffect(() => {
    let alive = true;
    setLoadState({ kind: "loading" });

    api
      .listUsers()
      .then((users) => {
        if (!alive) return;
        setLoadState({ kind: "loaded", users });

        const current = getSelectedUserId();
        if (!current && users.length > 0) {
          setSelectedUserId(users[0].id);
          setSelected(users[0].id);
        }
      })
      .catch((err: any) => {
        if (!alive) return;
        const message = err?.detail || err?.message || "Failed to load users";
        setLoadState({ kind: "error", message: String(message) });
      });

    return () => {
      alive = false;
    };
  }, []);

  const users = useMemo(() => {
    if (loadState.kind !== "loaded") return [];
    return loadState.users;
  }, [loadState]);

  return (
    <div className="w-12">
      <label className="sr-only" htmlFor="dev-user-switcher">
        Dev user
      </label>
      <select
        id="dev-user-switcher"
        data-testid="dev-user-switcher"
        value={selected}
        onChange={(e) => {
          const next = e.target.value;
          setSelected(next);
          if (next) setSelectedUserId(next);
        }}
        className="w-12 h-10 rounded-xl bg-white/10 text-white/90 text-[10px] px-1 outline-none border border-white/10"
        title={loadState.kind === "error" ? "Dev user: unavailable" : "Dev user"}
        disabled={loadState.kind === "loading" || loadState.kind === "error"}
      >
        {users.length === 0 ? <option value="">–</option> : null}
        {users.map((u) => (
          <option key={u.id} value={u.id} className="text-black">
            {u.full_name?.slice(0, 1) || "U"}
          </option>
        ))}
      </select>
    </div>
  );
}
