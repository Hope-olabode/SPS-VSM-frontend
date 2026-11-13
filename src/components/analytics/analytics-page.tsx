"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ActivityIcon,
  BuildingIcon,
  CalendarIcon,
  ClockIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  TargetIcon,
  TrendingUpIcon,
  UserCheckIcon,
  UsersIcon,
} from "@/src/components/icons";
import { api, type ApiAnalytics, errorMessage } from "@/src/lib/api";
import { ranges, type RangeKey } from "@/src/lib/mock-analytics";
import { formatMinutes } from "@/src/lib/report-calculations";
import { shiftDays, todayIso } from "@/src/lib/visitor-filters";
import { VisitorAvatar } from "../dashboard/visitor-avatar";
import { ChartCard, CountBadge } from "./chart-card";
import { StatTile } from "./stat-tile";

// Colors come from CSS variables in globals.css, so charts follow light/dark mode on their own.
const palette = [1, 2, 3, 4, 5, 6, 7].map((n) => `var(--chart-${n})`);

const axisTick = { fill: "var(--muted)", fontSize: 11 };
const tooltipProps = {
  contentStyle: {
    background: "var(--surface)",
    border: "1px solid var(--line-strong)",
    borderRadius: 8,
    fontSize: 12,
    color: "var(--fg)",
    boxShadow: "var(--shadow)",
  },
  labelStyle: { color: "var(--soft)" },
  itemStyle: { color: "var(--fg)" },
  cursor: { fill: "var(--brand-soft)" },
};

const dayLabel = (iso: string) => iso.slice(5); // 2026-11-07 -> 11-07

/** What to show before the first answer arrives, and when a range has no visits */
const emptyData: ApiAnalytics = {
  from: "",
  to: "",
  days: 1,
  total: 0,
  avgDurationMinutes: null,
  returnRate: 0,
  compliance: null,
  change: null,
  trend: [],
  byType: [],
  peakHours: [],
  busiestDays: [],
  byPurpose: [],
  topVisitors: [],
  topHosts: [],
  topCompanies: [],
};

const rangeTitles: Record<RangeKey | "custom", string> = { today: "today", "7d": "7 days", "30d": "30 days", month: "this month", custom: "selected dates" };

/** The first and last day to count, worked out from today's date */
function datesFor(range: RangeKey | "custom", from: string, to: string): [string, string] {
  const today = todayIso();
  if (range === "today") return [today, today];
  if (range === "7d") return [shiftDays(today, -6), today];
  if (range === "30d") return [shiftDays(today, -29), today];
  if (range === "month") return [`${today.slice(0, 8)}01`, today];
  // a custom range with one date picked counts from there to today (or the last 30 days up to the date)
  return [from || shiftDays(to || today, -29), to || today];
}

export function AnalyticsPage() {
  const [range, setRange] = useState<RangeKey | "custom">("30d");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<ApiAnalytics>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [start, end] = useMemo(() => datesFor(range, from, to), [range, from, to]);

  // GET /api/analytics whenever the dates change
  useEffect(() => {
    if (start > end) {
      setError("The start date can't be after the end date.");
      setLoading(false);
      return;
    }
    let current = true; // ignore an answer that arrives after the person picked something else
    setLoading(true);
    api<ApiAnalytics>(`/analytics?from=${start}&to=${end}`)
      .then((result) => {
        if (!current) return;
        setData(result);
        setError("");
      })
      .catch((err) => current && setError(errorMessage(err, "Couldn't load the analytics.")))
      .finally(() => current && setLoading(false));
    return () => {
      current = false;
    };
  }, [start, end, reloadKey]);

  const view = {
    trend: data.trend,
    total: data.total,
    perDay: range === "today" ? data.total : data.days ? Math.round(data.total / data.days) : 0,
    title: rangeTitles[range],
  };
  const extras = {
    avgDuration: data.avgDurationMinutes === null ? "—" : formatMinutes(data.avgDurationMinutes),
    returnRate: data.returnRate,
    compliance: data.compliance === null ? "—" : `${data.compliance}%`,
    change: data.change ?? undefined,
  };
  const { byType: visitorsByType, peakHours, busiestDays, byPurpose: visitorsByPurpose, topVisitors, topHosts, topCompanies } = data;

  const description =
    range === "custom"
      ? "Visitor insights for the selected dates"
      : ranges.find((item) => item.key === range)?.description;

  const purposeTotal = visitorsByPurpose.reduce((sum, item) => sum + item.count, 0);
  const typeTotal = visitorsByType.reduce((sum, item) => sum + item.value, 0);

  const pickRange = (key: RangeKey) => {
    setRange(key);
    setFrom("");
    setTo("");
  };
  const pickDate = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setRange("custom");
  };

  const dateInput =
    "h-[38px] w-[140px] rounded-lg border border-line-strong bg-surface px-3 text-xs text-fg shadow-sm transition [color-scheme:light] focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/20 dark:[color-scheme:dark]";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="mb-[7px] text-[21px] font-bold leading-tight tracking-[-0.035em] sm:text-[25px]">Analytics</h1>
          <p className="text-xs text-soft">{description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Date range"
            className="flex h-[38px] items-center gap-[3px] overflow-x-auto rounded-lg border border-line bg-surface-soft p-[3px]"
          >
            {ranges.map((item) => {
              const selected = range === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => pickRange(item.key)}
                  aria-pressed={selected}
                  className={`inline-flex h-[30px] cursor-pointer items-center gap-1 whitespace-nowrap rounded-md px-3 text-xs font-medium transition ${
                    selected
                      ? "bg-brand text-white dark:text-[#04130a]"
                      : "text-soft hover:bg-brand-soft hover:text-brand"
                  }`}
                >
                  <CalendarIcon size={12} />
                  {item.label}
                </button>
              );
            })}
          </div>

          <input type="date" aria-label="From date" value={from} max={to || undefined} onChange={(e) => pickDate(setFrom)(e.target.value)} className={dateInput} />
          <input type="date" aria-label="To date" value={to} min={from || undefined} onChange={(e) => pickDate(setTo)(e.target.value)} className={dateInput} />
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 px-5 py-4 text-center text-xs text-red-600 dark:text-red-300">
          <p className="mb-2">{error}</p>
          <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="font-semibold text-brand hover:text-brand-hover">
            Try again
          </button>
        </div>
      )}

      <section aria-label="Summary" aria-busy={loading} className="grid grid-cols-2 gap-[11px] sm:gap-4 min-[1100px]:grid-cols-3 min-[1400px]:grid-cols-5">
        <StatTile label="Total Visitors" value={view.total.toLocaleString()} icon={UsersIcon} tone="green" change={extras.change} />
        <StatTile label={range === "today" ? "Visitors Today" : "Avg / Day"} value={String(view.perDay)} icon={ActivityIcon} tone="teal" />
        <StatTile label="Avg Visit Duration" value={extras.avgDuration} icon={ClockIcon} tone="amber" />
        <StatTile label="Return Rate" value={`${extras.returnRate}%`} icon={RotateCcwIcon} tone="slate" />
        <StatTile label="Check-Out Compliance" value={extras.compliance} icon={ShieldCheckIcon} tone="lime" />
      </section>

      <div className="grid gap-4 min-[1100px]:grid-cols-2">
        <ChartCard title={`Visitor Trend (${view.title})`} icon={TrendingUpIcon} className="min-[1100px]:col-span-2">
          {view.trend.length === 0 ? (
            <p className="grid h-[300px] place-items-center text-xs text-muted">{loading ? "Loading…" : "No visitors in the selected dates."}</p>
          ) : (
            <div className="h-[300px]" role="img" aria-label={`Visitor trend over ${view.title}`}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={view.trend} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: "var(--line-strong)" }} minTickGap={24} />
                  <YAxis tick={axisTick} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip {...tooltipProps} cursor={{ stroke: "var(--line-strong)" }} formatter={(value) => [value, "Visitors"]} />
                  <Area type="monotone" dataKey="count" stroke="var(--chart-1)" strokeWidth={2} fill="url(#trend-fill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Visitors by Type">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="h-[220px] w-full sm:w-1/2" role="img" aria-label="Visitors by type">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={visitorsByType} dataKey="value" nameKey="name" innerRadius={52} outerRadius={92} paddingAngle={2} stroke="var(--surface)" strokeWidth={2}>
                    {visitorsByType.map((item, index) => (
                      <Cell key={item.name} fill={palette[index % palette.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipProps} cursor={false} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="w-full space-y-2 text-xs sm:w-1/2">
              {visitorsByType.map((item, index) => (
                <li key={item.name} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: palette[index % palette.length] }} />
                  <span className="flex-1 text-soft">{item.name}</span>
                  <span className="font-semibold">{item.value}</span>
                  <span className="w-9 text-right text-muted">{typeTotal ? Math.round((item.value / typeTotal) * 100) : 0}%</span>
                </li>
              ))}
            </ul>
          </div>
        </ChartCard>

        <ChartCard title="Peak Hours">
          <div className="h-[280px]" role="img" aria-label="Visitors by hour of day">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHours} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hour" tick={axisTick} tickLine={false} axisLine={{ stroke: "var(--line-strong)" }} interval="preserveStartEnd" />
                <YAxis tick={axisTick} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip {...tooltipProps} formatter={(value) => [value, "Visitors"]} />
                <Bar dataKey="count" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Busiest Days of Week" icon={CalendarIcon}>
          <div className="h-[280px]" role="img" aria-label="Visitors by day of week">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={busiestDays} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={axisTick} tickLine={false} axisLine={{ stroke: "var(--line-strong)" }} />
                <YAxis tick={axisTick} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip {...tooltipProps} formatter={(value) => [value, "Visitors"]} />
                <Bar dataKey="count" fill="var(--chart-2)" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Visitors by Purpose" icon={TargetIcon}>
          <ul className="max-h-[280px] space-y-3.5 overflow-y-auto pr-1">
            {visitorsByPurpose.map((item, index) => {
              const percent = purposeTotal ? Math.round((item.count / purposeTotal) * 100) : 0;
              return (
                <li key={item.label} className="space-y-1.5">
                  <div className="flex justify-between gap-3 text-[13px]">
                    <span className="font-medium text-soft">{item.label}</span>
                    <span className="shrink-0 text-xs text-muted">
                      {item.count} ({percent}%)
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-soft ring-1 ring-inset ring-line">
                    {/* a minimum width keeps very small shares visible */}
                    <div className="h-full rounded-full" style={{ width: `${Math.max(percent, 4)}%`, background: palette[index % palette.length] }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </ChartCard>

        <ChartCard title="Top Visitors" icon={UserCheckIcon}>
          <ul className="space-y-3">
            {topVisitors.map((visitor) => (
              <li key={visitor.name} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="flex min-w-0 items-center gap-2.5">
                  <VisitorAvatar name={visitor.name} />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{visitor.name}</span>
                    {visitor.company && <span className="truncate text-[11px] text-muted">{visitor.company}</span>}
                  </span>
                </span>
                <CountBadge>{visitor.visits} visits</CountBadge>
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard title="Top Hosts" icon={UsersIcon}>
          <ul className="space-y-3">
            {topHosts.map((host) => (
              <li key={host.name} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="text-soft">{host.name}</span>
                <CountBadge>{host.visits}</CountBadge>
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard title="Top Visitor Companies" icon={BuildingIcon}>
          <ul className="space-y-3">
            {topCompanies.map((company) => (
              <li key={company.name} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="text-soft">{company.name}</span>
                <CountBadge>{company.visits}</CountBadge>
              </li>
            ))}
          </ul>
        </ChartCard>
      </div>
    </div>
  );
}
