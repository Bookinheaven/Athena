import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  PolarRadiusAxis,
  AreaChart,
  Area,
  LabelList,
  LineChart,
  Line,
  ComposedChart,
} from "recharts";
import {
  ArrowRight,
  Clock,
  Target,
  CheckCircle,
  Smile,
  Brain,
  Loader2,
  TrendingUp,
  Activity,
  Calendar,
  Zap,
  Award,
  BarChart3,
} from "lucide-react";
import { useAuth } from "../../../../contexts/AuthContext";
import sessionService from "../../../../services/sessionService";

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [kpis, setKpis] = useState(null);
  const [focusTrends, setFocusTrends] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [focusVsBreakData, setFocusVsBreakData] = useState([]);
  const [focusMoodData, setFocusMoodData] = useState([]);
  const [topDistractions, setTopDistractions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [productivityScore, setProductivityScore] = useState(0);
  const [dailyComparison, setDailyComparison] = useState([]);
  const [moodTrend, setMoodTrend] = useState([]);
  const [sessionsByDay, setSessionsByDay] = useState([]);
  const [completionRate, setCompletionRate] = useState([]);

  useEffect(() => {
    setIsLoading(true);
    const fetchData = async () => {
      try {
        const data = await sessionService.getInsights();
        const dataInsights = data.insights;
        setKpis(dataInsights.kpis);
        setFocusMoodData(dataInsights.focusMoodData);
        setFocusTrends(dataInsights.focusTrends);
        setFocusVsBreakData(dataInsights.focusVsBreakData);
        setTopDistractions(dataInsights.topDistractions);
        setRecentSessions(data.recentSessions || []);
        setProductivityScore(dataInsights.productivityScore);
        setDailyComparison(dataInsights.dailyComparison);
        setMoodTrend(dataInsights.moodTrend);
        setSessionsByDay(dataInsights.sessionsByDay);
        setCompletionRate(dataInsights.completionRate);
        setIsLoading(false);
      } catch (e) {
        console.error(e);
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 font-sans flex items-center justify-center bg-background-color text-text-primary">
        <div className="text-center">
          <Loader2
            size={48}
            className="animate-spin mx-auto text-button-primary"
          />
          <p className="mt-4 text-text-secondary">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen p-8 font-sans flex items-center justify-center bg-background-color text-text-primary">
        <div className="text-center p-8 rounded-2xl bg-card-background">
          <p className="text-text-secondary">
            Could not load user data. Please log in again.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="mt-4 px-6 py-2 rounded-lg font-semibold transition-all bg-button-primary text-button-primary-text"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const displayName = user.fullName;
  const username = user.username;
  const photoURL = `https://ui-avatars.com/api/?name=${user.fullName.replace(
    " ",
    "+"
  )}`;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 pt-20 font-sans fade-in bg-background-color text-text-primary">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <header className="mb-10 slide-up">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-text-primary">
                Welcome back, {displayName?.split(" ")[0] || "User"}! 👋
              </h1>
              <p className="text-lg text-text-secondary">
                Here's your productivity and wellness dashboard.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-5 py-3 rounded-xl card-hover cursor-pointer bg-card-background border border-card-border">
                <img
                  src={photoURL}
                  alt="Profile"
                  className="w-12 h-12 rounded-full border-2 border-button-primary"
                />
                <div className="hidden sm:block">
                  <p className="font-semibold text-text-primary">
                    {displayName}
                  </p>
                  <p className="text-xs text-text-muted">@{username}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="space-y-6">
          {/* KPIs Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 slide-up">
            {!kpis ? (
              <>
                <KpiSkeleton />
                <KpiSkeleton />
                <KpiSkeleton />
                <KpiSkeleton />
                <KpiSkeleton />
              </>
            ) : (
              <>
                <KpiCard
                  icon={<Clock size={24} />}
                  title="Total Focus Time"
                  value={formatTime(kpis.totalFocusTime)}
                  color="#3b82f6"
                />
                <KpiCard
                  icon={<CheckCircle size={24} />}
                  title="Sessions Completed"
                  value={kpis.sessionsCompleted}
                  color="#22c55e"
                />
                <KpiCard
                  icon={<Brain size={24} />}
                  title="Avg. Focus"
                  value={`${kpis.avgFocus} / 5`}
                  color="#a855f7"
                />
                <KpiCard
                  icon={<Smile size={24} />}
                  title="Avg. Mood"
                  value={`${kpis.avgMood} / 5`}
                  color="#f59e0b"
                />
                <KpiCard
                  icon={<Award size={24} />}
                  title="Productivity Score"
                  value={`${productivityScore || 0}%`}
                  color="#ec4899"
                />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <WeeklyFocusAreaChart
                data={focusTrends}
                isLoading={!focusTrends || focusTrends.length === 0}
              />
            </div>
            <div>
              <ProductivityScoreCard score={productivityScore || 0} />
            </div>
          </div>

          {/* Main Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DailyComparisonChart
              data={dailyComparison}
              isLoading={!dailyComparison || dailyComparison.length === 0}
            />
            <SessionsByDayChart
              data={sessionsByDay}
              isLoading={!sessionsByDay || sessionsByDay.length === 0}
            />
          </div>

          {/* Insights Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={24} className="text-button-primary" />
              <h2 className="text-2xl font-bold text-text-primary">
                Personalized Insights
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FocusVsBreakChart
                data={focusVsBreakData}
                isLoading={!focusVsBreakData || focusVsBreakData.length === 0}
              />
              <CompletionRateChart
                data={completionRate}
                isLoading={!completionRate || completionRate.length === 0}
              />
              <FocusMoodRadarChart
                data={focusMoodData}
                isLoading={!focusMoodData || focusMoodData.length === 0}
              />
            </div>
          </div>

          {/* Trends and Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <MoodFocusTrendChart
                data={moodTrend}
                isLoading={!moodTrend || moodTrend.length === 0}
              />
            </div>
            <div>
              <TopDistractionsChart
                data={topDistractions}
                isLoading={!topDistractions}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              icon={<Calendar size={28} />}
              title="Avg. Session Length"
              value={formatTime(kpis?.avgSessionLength || 0)}
              subtitle="Per session"
              color="#3b82f6"
            />
            <StatCard
              icon={<Target size={28} />}
              title="Avg. Tasks Completed"
              value={`${kpis?.avgTodosCompleted || 0} tasks`}
              subtitle="Per session"
              color="#22c55e"
            />
            <StatCard
              icon={<Zap size={28} />}
              title="Total Sessions"
              value={kpis?.sessionsCompleted || 0}
              subtitle="All time"
              color="#f59e0b"
            />
          </div>

          <div className="rounded-2xl p-6 shadow-lg card-hover bg-card-background border border-card-border hover:border-blue-400">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Activity size={22} className="text-button-primary" />
                <h3 className="text-xl font-bold text-text-primary">
                  Recent Sessions
                </h3>
              </div>
              <button
                onClick={() => navigate("/sessions")}
                className="text-sm flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all hover:scale-105 text-button-primary bg-background-secondary"
              >
                View All <ArrowRight size={14} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 hover:border-blue-400">
              {!recentSessions ? (
                <>
                  <SessionItemSkeleton />
                  <SessionItemSkeleton />
                  <SessionItemSkeleton />
                </>
              ) : recentSessions.length > 0 ? (
                recentSessions
                  .slice(0, 6)
                  .map((session) => (
                    <SessionItem key={session.id} session={session} />
                  ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Target size={48} className="mx-auto mb-3 text-text-muted" />
                  <p className="text-sm text-text-secondary">
                    You have no recent sessions. Start your first session!
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const KpiCard = ({ icon, title, value, color }) => (
  <div className="rounded-2xl p-5 shadow-md flex flex-col justify-between card-hover transition-all cursor-pointer bg-card-background border border-card-border hover:border-blue-400">
    <div style={{ color: color }}>{icon}</div>
    <p className="text-xs font-medium mb-2 text-text-muted">{title}</p>
    <p className="text-2xl font-bold text-text-primary">{value}</p>
  </div>
);

const StatCard = ({ icon, title, value, subtitle, color }) => (
  <div className="rounded-2xl p-6 shadow-lg card-hover bg-card-background border border-card-border hover:border-blue-400">
    <div className="flex items-center justify-between mb-4">
      <div style={{ color: color }}>{icon}</div>
      <div className="px-3 py-1 rounded-full text-xs font-semibold bg-background-secondary text-text-primary">
        {subtitle}
      </div>
    </div>
    <h3 className="text-sm font-medium mb-2 text-text-secondary">{title}</h3>
    <p className="text-3xl font-bold text-text-primary">{value}</p>
  </div>
);

const ProductivityScoreCard = ({ score }) => (
  <div className="rounded-2xl p-6 shadow-lg card-hover h-full flex flex-col justify-center bg-card-background border border-card-border hover:border-blue-400">
    <div className="text-center">
      <BarChart3 size={40} className="mx-auto mb-4 text-button-primary" />
      <h3 className="text-lg font-bold mb-2 text-text-primary">
        Productivity Score
      </h3>
      <div className="relative w-40 h-40 mx-auto mb-4">
        <svg className="transform -rotate-90 w-40 h-40">
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="var(--color-background-secondary)"
            strokeWidth="12"
            fill="none"
          />
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="var(--color-button-primary)"
            strokeWidth="12"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 70}`}
            strokeDashoffset={`${2 * Math.PI * 70 * (1 - score / 100)}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl font-bold text-text-primary">{score}%</span>
        </div>
      </div>
      <p className="text-sm text-text-secondary">
        {score >= 80
          ? "🎉 Excellent performance!"
          : score >= 60
          ? "👍 Good work!"
          : "💪 Keep pushing!"}
      </p>
    </div>
  </div>
);

const SessionItem = ({ session }) => {
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };
  const isCompleted = session.isDone === true;

  return (
    <div className="flex flex-col p-4 rounded-xl card-hover transition-all bg-background-secondary border border-border-secondary hover:border-blue-400">
      <div className="flex items-start justify-between mb-3">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center opacity-20"
          style={{
            backgroundColor: isCompleted
              ? "var(--color-button-success)"
              : "var(--color-button-primary)",
          }}
        >
          <div
            style={{
              color: isCompleted
                ? "var(--color-button-success)"
                : "var(--color-button-primary)",
            }}
          >
            {isCompleted ? <CheckCircle size={20} /> : <Target size={20} />}
          </div>
        </div>
        <span className="text-xs px-2 py-1 rounded-full font-semibold bg-card-background text-text-muted">
          {formatDate(session.createdAt)}
        </span>
      </div>
      <p
        className="font-semibold text-sm mb-2 line-clamp-2 text-text-primary"
        title={session.title}
      >
        {session.title}
      </p>
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">
          {formatTime(session.actualFocusDuration || 0)}
        </span>
        <span className="text-text-muted">{`${session.completedSegments || 0}/${
          session.totalSegments || 0
        } Segments`}</span>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 rounded-lg shadow-xl bg-card-background border border-card-border ">
        <p className="font-bold text-sm mb-1 text-text-primary">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${
              typeof entry.value === "number"
                ? entry.value.toFixed(1)
                : entry.value
            }`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const WeeklyFocusAreaChart = ({ data, isLoading }) => (
  <div className="rounded-2xl p-6 shadow-lg card-hover h-full bg-card-background border border-card-border hover:border-blue-400">
    <h3 className="text-xl font-bold mb-6 text-text-primary">
      Weekly Focus Trends
    </h3>
    {isLoading ? (
      <div className="h-72 w-full flex items-center justify-center">
        <p className="text-text-muted">No focus trend data yet.</p>
      </div>
    ) : (
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-button-primary)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-button-primary)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border-secondary)"
              opacity={0.3}
            />
            <XAxis
              dataKey="day"
              tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(value) => `${(value / 60).toFixed(1)}h`}
              tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="focusTime"
              name="Focus Time (min)"
              stroke="var(--color-button-primary)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorFocus)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )}
  </div>
);

const DailyComparisonChart = ({ data, isLoading }) => (
  <div className="rounded-2xl p-6 shadow-lg card-hover bg-card-background border border-card-border hover:border-blue-400">
    <h3 className="text-xl font-bold mb-6 text-text-primary">
      This Week vs Last Week
    </h3>
    {isLoading ? (
      <div className="h-72 w-full flex items-center justify-center">
        <p className="text-text-muted">Loading comparison data...</p>
      </div>
    ) : (
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border-secondary)"
              opacity={0.3}
            />
            <XAxis
              dataKey="day"
              tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
              tickFormatter={(value) => `${value}m`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: "var(--color-text-primary)" }} />
            <Bar
              dataKey="lastWeek"
              fill="#94a3b8"
              radius={[8, 8, 0, 0]}
              name="Last Week"
            />
            <Line
              type="monotone"
              dataKey="thisWeek"
              stroke="var(--color-button-primary)"
              strokeWidth={3}
              name="This Week"
              dot={{ fill: "var(--color-button-primary)", r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    )}
  </div>
);

const SessionsByDayChart = ({ data, isLoading }) => (
  <div className="rounded-2xl p-6 shadow-lg card-hover bg-card-background border border-card-border hover:border-blue-400">
    <h3 className="text-xl font-bold mb-6 text-text-primary">
      Sessions by Day
    </h3>
    {isLoading ? (
      <div className="h-72 w-full flex items-center justify-center">
        <p className="text-text-muted">Loading session data...</p>
      </div>
    ) : (
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border-secondary)"
              opacity={0.3}
            />
            <XAxis
              dataKey="day"
              tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
            />
            <YAxis tick={{ fill: "var(--color-text-muted)", fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="sessions"
              fill="var(--color-button-primary)"
              radius={[8, 8, 0, 0]}
              name="Sessions"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`hsl(${220 + index * 10}, 70%, ${50 + index * 3}%)`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    )}
  </div>
);

const MoodFocusTrendChart = ({ data, isLoading }) => (
  <div className="rounded-2xl p-6 shadow-lg card-hover bg-card-background border border-card-border hover:border-blue-400">
    <h3 className="text-xl font-bold mb-6 text-text-primary">
      Mood & Focus Trends
    </h3>
    {isLoading ? (
      <div className="h-72 w-full flex items-center justify-center">
        <p className="text-text-muted">Loading trend data...</p>
      </div>
    ) : (
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border-secondary)"
              opacity={0.3}
            />
            <XAxis
              dataKey="day"
              tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
            />
            <YAxis
              domain={[0, 5]}
              tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: "var(--color-text-primary)" }} />
            <Line
              type="monotone"
              dataKey="mood"
              stroke="#f59e0b"
              strokeWidth={3}
              name="Mood"
              dot={{ fill: "#f59e0b", r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="focus"
              stroke="#a855f7"
              strokeWidth={3}
              name="Focus"
              dot={{ fill: "#a855f7", r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )}
  </div>
);

const FocusVsBreakChart = ({ data, isLoading }) => {
  const COLORS = ["var(--color-button-primary)", "var(--color-text-muted)"];

  return (
    <div className="rounded-2xl p-6 shadow-lg card-hover bg-card-background border border-card-border hover:border-blue-400">
      <h3 className="text-lg font-bold mb-4 text-text-primary">
        Focus vs. Break Ratio
      </h3>
      {isLoading ? (
        <div className="h-56 w-full flex items-center justify-center">
          <p className="text-text-muted">No data available.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={85}
              labelLine={false}
              label={({
                cx,
                cy,
                midAngle,
                innerRadius,
                outerRadius,
                percent,
              }) => {
                const radius = innerRadius + (outerRadius - innerRadius) * 1.3;
                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                return (
                  <text
                    x={x}
                    y={y}
                    fill="var(--color-text-primary)"
                    textAnchor={x > cx ? "start" : "end"}
                    dominantBaseline="central"
                    fontWeight="600"
                  >
                    {`${(percent * 100).toFixed(0)}%`}
                  </text>
                );
              }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Legend
              iconType="circle"
              wrapperStyle={{ color: "var(--color-text-primary)" }}
            />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

const CompletionRateChart = ({ data, isLoading }) => {
  const COLORS = ["#22c55e", "#ef4444"];

  return (
    <div className="rounded-2xl p-6 shadow-lg card-hover bg-card-background border border-card-border hover:border-blue-400">
      <h3 className="text-lg font-bold mb-4 text-text-primary">
        Task Completion Rate
      </h3>
      {isLoading ? (
        <div className="h-56 w-full flex items-center justify-center">
          <p className="text-text-muted">No data available.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={85}
              labelLine={false}
              label={({
                cx,
                cy,
                midAngle,
                innerRadius,
                outerRadius,
                percent,
              }) => {
                const radius = innerRadius + (outerRadius - innerRadius) * 1.3;
                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                return (
                  <text
                    x={x}
                    y={y}
                    fill="var(--color-text-primary)"
                    textAnchor={x > cx ? "start" : "end"}
                    dominantBaseline="central"
                    fontWeight="600"
                  >
                    {`${(percent * 100).toFixed(0)}%`}
                  </text>
                );
              }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Legend
              iconType="circle"
              wrapperStyle={{ color: "var(--color-text-primary)" }}
            />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

const FocusMoodRadarChart = ({ data, isLoading }) => (
  <div className="rounded-2xl p-6 shadow-lg card-hover bg-card-background border border-card-border hover:border-blue-400">
    <h3 className="text-lg font-bold mb-4 text-text-primary">
      Average Focus & Mood
    </h3>
    {isLoading ? (
      <div className="h-56 w-full flex items-center justify-center">
        <p className="text-text-muted">No data available.</p>
      </div>
    ) : (
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="var(--color-border-secondary)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
          />
          <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} />
          <Radar
            name="Rating"
            dataKey="value"
            stroke="var(--color-button-primary)"
            fill="var(--color-button-primary)"
            fillOpacity={0.6}
            strokeWidth={2}
          />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    )}
  </div>
);

const TopDistractionsChart = ({ data, isLoading }) => {
  const chartData =
    data?.map(([name, count]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count: count,
    })) || [];

  const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899"];

  return (
    <div className="h-full flex flex-col rounded-2xl p-6 shadow-lg card-hover bg-card-background border border-card-border hover:border-blue-400">
      <h3 className="text-lg font-bold mb-5 text-text-primary">
        Top Distractions
      </h3>
      {isLoading ? (
        <div className="space-y-3 pt-2">
          <div className="h-6 w-3/4 rounded-lg animate-pulse bg-background-secondary"></div>
          <div className="h-6 w-1/2 rounded-lg animate-pulse bg-background-secondary"></div>
          <div className="h-6 w-2/3 rounded-lg animate-pulse bg-background-secondary"></div>
        </div>
      ) : chartData.length > 0 ? (
        <div style={{ height: `${Math.max(chartData.length * 50, 150)}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 0, right: 40, top: 5, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border-secondary)"
                horizontal={false}
                opacity={0.3}
              />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "var(--color-text-secondary)",
                  fontSize: 13,
                  fontWeight: 500,
                }}
                width={90}
              />
              <Tooltip cursor={{ fill: "rgba(128, 90, 213, 0.1)" }} />
              <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
                <LabelList
                  dataKey="count"
                  position="right"
                  fill="var(--color-text-primary)"
                  fontSize={13}
                  fontWeight="600"
                  formatter={(value) => `${value}x`}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex flex-col grow justify-center text-center hover:border-blue-400">
          <CheckCircle size={80} className="mx-auto mb-3 text-button-success" />
          <p className="text-sm text-text-secondary">
            No distractions reported! 🎉
          </p>
        </div>
      )}
    </div>
  );
};

// --- Skeleton Loading Components ---
const KpiSkeleton = () => (
  <div className="rounded-2xl p-5 shadow-md animate-pulse bg-card-background border border-card-border hover:border-blue-400">
    <div className="h-6 w-6 rounded mb-3 bg-background-secondary"></div>
    <div className="h-3 w-3/4 rounded mb-2 bg-background-secondary"></div>
    <div className="h-8 w-1/2 rounded bg-background-secondary"></div>
  </div>
);

const SessionItemSkeleton = () => (
  <div className="flex flex-col p-4 rounded-xl animate-pulse bg-background-secondary hover:border-blue-400">
    <div className="flex items-start justify-between mb-3">
      <div className="w-10 h-10 rounded-lg bg-border-secondary"></div>
      <div className="h-5 w-16 rounded-full bg-border-secondary"></div>
    </div>
    <div className="h-4 w-3/4 rounded mb-2 bg-border-secondary"></div>
    <div className="flex items-center justify-between">
      <div className="h-3 w-1/4 rounded bg-border-secondary"></div>
      <div className="h-3 w-1/3 rounded bg-border-secondary"></div>
    </div>
  </div>
);

export default Dashboard;
