import { lazy, Suspense, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import sessionService from "../../../../services/sessionService.js";
import { useAuth } from "../../../../contexts/AuthContext.jsx";
import Header from "./components/Header.jsx";
import {
  Brain,
  Calendar,
  CheckCircle,
  Clock,
  Flame,
  Gauge,
  Loader2,
  Smile,
  TrendingUp,
  Zap,
  BarChart3,
  PieChart
} from "lucide-react";

import MetricCard from "./components/cards/MetricCard.jsx";
import KpiSkeleton from "./components/skeletons/KpiSkeleton.jsx";
import StatCard from "./components/cards/StatCard.jsx";
import ChartSkeleton from "./components/skeletons/ChartSkeleton.jsx";
import StreakCard from "./components/StreakCard/StreakCard.jsx";
import StreakService from "../../../../services/streakService.js";
import TodaysInsights from "./components/StreakCard/TodaysInsights.jsx";

const WeeklyFocusAreaChart = lazy(() => import("./components/charts/WeeklyFocusAreaChart.jsx"));
const DailyComparisonChart = lazy(() => import("./components/charts/DailyComparisonChart.jsx"));
const SessionsByDayChart = lazy(() => import("./components/charts/SessionsByDayChart.jsx"));
const MoodFocusTrendChart = lazy(() => import("./components/charts/MoodFocusTrendChart.jsx"));
const CompletionRateChart = lazy(() => import("./components/charts/CompletionRateChart.jsx"));
const FocusMoodRadarChart = lazy(() => import("./components/charts/FocusMoodRadarChart.jsx"));
const FocusVsBreakChart = lazy(() => import("./components/charts/FocusVsBreakChart.jsx"));
const TopDistractionsChart = lazy(() => import("./components/charts/TopDistractionsChart.jsx"));
const RecentSessions = lazy(() => import("./components/charts/RecentSessions.jsx"));

const isMeaningful = (v) => v !== null && v !== undefined && Number(v) > 0;

const formatTime = (seconds = 0) => {
  if (isNaN(seconds) || seconds < 0) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Tab State
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);

  const [dashboard, setDashboard] = useState({
    kpis: null,
    productivityScore: 0,
    focusTrends: [],
    dailyComparison: [],
    sessionsByDay: [],
    focusMoodData: [],
    focusVsBreakData: [],
    completionRate: [],
    moodTrend: [],
    topDistractions: [],
    recentSessions: [],
    dailyStreak: 0,
    dailyTargetMinutes: 25,
    freezeBalance: 0,
    maxFreezeBalance: 0,
    streakRate: 0,
    state: "",
    focusMinutes: 0,
  });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await sessionService.getInsights();
        const todaysData = await sessionService.getTodaysInsights();
        const streakDataO = await StreakService.fetchStreak();
        const todaysInsights = todaysData?.insights || {};
        const insights = data?.insights || {};

        setDashboard({
          kpis: insights.kpis || null,
          productivityScore: insights.productivityScore || 0,
          focusTrends: insights.focusTrends || [],
          dailyComparison: insights.dailyComparison || [],
          sessionsByDay: insights.sessionsByDay || [],
          focusMoodData: insights.focusMoodData || [],
          focusVsBreakData: insights.focusVsBreakData || [],
          completionRate: insights.completionRate || [],
          moodTrend: insights.moodTrend || [],
          topDistractions: insights.topDistractions || [],
          recentSessions: data?.recentSessions || [],
          dailyStreak: streakDataO.currentStreak || 0,
          dailyTargetMinutes: streakDataO.dailyTargetMinutes || 25,
          freezeBalance: streakDataO.freezeBalance || 0,
          maxFreezeBalance: streakDataO.maxFreezeBalance || 0,
          streakRate: (streakDataO.focusMinutes / streakDataO.maxTargetMinutes) || 0,
          state: streakDataO.state || "green",
          focusMinutes: streakDataO.focusMinutes || 0,
          t_distractions: todaysInsights.distractions,
          t_sessions: todaysInsights.sessions || 0,
          t_longest_focus: formatTime(todaysInsights.longest_focus || 0),
          t_focus_blocks: todaysInsights.focus_blocks || 0,
        });
      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (!user && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-color">
        <div className="p-8 rounded-2xl bg-card-background border border-card-border text-center">
          <p className="text-text-secondary mb-4">
            Could not load user data. Please log in again.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-2 rounded-lg bg-button-primary text-button-primary-text"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-color">
        <div className="text-center">
          <Loader2
            size={48}
            className="animate-spin mx-auto text-button-primary mb-4"
          />
          <p className="text-text-secondary">
            Loading your dashboard…
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: Gauge },
    { id: "trends", label: "Trends", icon: BarChart3 },
    { id: "insights", label: "Insights", icon: PieChart },
  ];

  return (
    <div className="min-h-full bg-background-color text-text-primary p-6 sm:p-8 md:p-10 lg:p-12">
      <div className="max-w-7xl mx-auto w-full">
        <Header displayName={user.fullName} username={user.username} />

        <div className="flex flex-wrap gap-1.5 mb-8 bg-neutral-100 dark:bg-white/[0.04] p-1.5 rounded-xl border border-neutral-200 dark:border-white/10 w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer
                  ${activeTab === tab.id
                    ? "bg-white dark:bg-[#18181c] text-neutral-900 dark:text-white shadow-sm border border-neutral-200/60 dark:border-white/10"
                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"}
                `}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.main
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="space-y-10"
          >

            {activeTab === "overview" && (
              <div className="space-y-10">
                <section>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-button-primary/10">
                      <Flame className="text-amber-500" />
                    </div>
                    <h2 className="text-2xl font-bold">Today’s Momentum</h2>
                  </div>
                  <p className="text-sm text-text-secondary mt-1 mb-4">
                    Small consistent wins build long streaks.
                  </p>

                  <div className="grid gap-6 grid-cols-1 lg:grid-cols-[1.5fr_0.5fr]">
                    <StreakCard
                      dailyStreak={dashboard?.dailyStreak || 0}
                      dailyTargetMinutes={dashboard?.dailyTargetMinutes || 0}
                      todayFocusMinutes={dashboard?.focusMinutes || 0}
                      streakRate={dashboard?.streakRate || 0}
                      state={dashboard?.state || "green"}
                      freezeCredits={dashboard?.freezeBalance || 0}
                    />
                    <TodaysInsights
                      sessions={dashboard.t_sessions}
                      focusBlocks={dashboard.t_focus_blocks}
                      longestFocus={dashboard.t_longest_focus}
                      distractions={dashboard.t_distractions}
                    />
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-button-primary/10">
                      <Gauge className="text-button-primary" />
                    </div>
                    <h2 className="text-xl font-bold">Recent Performance</h2>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {!dashboard.kpis ? (
                      <>
                        <KpiSkeleton />
                        <KpiSkeleton />
                        <KpiSkeleton />
                        <KpiSkeleton />
                      </>
                    ) : (
                      <>
                        <MetricCard
                          icon={<Clock size={18} />}
                          title="Focus Time"
                          value={formatTime(dashboard.kpis.totalFocusTime)}
                          tag="Today"
                        />
                        <MetricCard
                          icon={<CheckCircle size={18} />}
                          title="Avg Completion"
                          value={isMeaningful(dashboard.kpis.avgSessions) ? `${dashboard.kpis.avgSessions}%` : "—"}
                          tag="7 days"
                        />
                        <MetricCard
                          icon={<Brain size={18} />}
                          title="Avg Focus"
                          value={isMeaningful(dashboard.kpis.avgFocus) ? `${dashboard.kpis.avgFocus} / 5` : "No ratings"}
                          tag="7 days"
                        />
                        <MetricCard
                          icon={<Smile size={18} />}
                          title="Avg Mood"
                          value={isMeaningful(dashboard.kpis.avgMood) ? `${dashboard.kpis.avgMood} / 5` : "No ratings"}
                          tag="7 days"
                        />
                      </>
                    )}
                  </div>
                </section>

                <section>
                  <Suspense fallback={<ChartSkeleton />}>
                    <RecentSessions
                      recentSessions={dashboard.recentSessions}
                      navigate={navigate}
                    />
                  </Suspense>
                </section>
              </div>
            )}

            {activeTab === "trends" && (
              <div className="space-y-10">
                <section>
                  <h2 className="text-xl font-bold mb-6">All-Time Statistics</h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <StatCard
                      icon={<Zap size={18} />}
                      title="Total Sessions"
                      value={dashboard.kpis?.sessionsStarted || 0}
                      subtitle="All time"
                    />
                    <StatCard
                      icon={<CheckCircle size={18} />}
                      title="Completed Sessions"
                      value={dashboard.kpis?.sessionsCompleted || 0}
                      subtitle="All time"
                    />
                    <StatCard
                      icon={<Calendar size={18} />}
                      title="Avg Session Length"
                      value={formatTime(dashboard.kpis?.avgSessionLength || 0)}
                      subtitle="Per session"
                    />
                    <StatCard
                      icon={<TrendingUp size={18} />}
                      title="Productivity"
                      value={`${dashboard.productivityScore}%`}
                      subtitle="Overall"
                    />
                  </div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Suspense fallback={<ChartSkeleton />}>
                    <WeeklyFocusAreaChart data={dashboard.focusTrends} />
                  </Suspense>
                  <Suspense fallback={<ChartSkeleton />}>
                    <DailyComparisonChart data={dashboard.dailyComparison} />
                  </Suspense>
                  <Suspense fallback={<ChartSkeleton />}>
                    <SessionsByDayChart data={dashboard.sessionsByDay} />
                  </Suspense>
                  <Suspense fallback={<ChartSkeleton />}>
                    <MoodFocusTrendChart data={dashboard.moodTrend} />
                  </Suspense>
                </section>
              </div>
            )}

            {activeTab === "insights" && (
              <div className="space-y-10">
<<<<<<< Updated upstream
=======
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-card-background border border-card-border p-6 rounded-3xl shadow-xl flex flex-col gap-3 relative overflow-hidden group hover:border-button-primary/50 transition-colors">
                    <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Zap size={100} /></div>
                    <h3 className="text-xl font-black flex items-center gap-2 tracking-tight"><Zap className="text-amber-500" size={22} /> Smart Suggestions</h3>
                    <div className="bg-background-secondary/50 rounded-xl p-4 mt-2 border border-border-secondary/50">
                      <p className="text-text-secondary font-medium text-sm">Best time for focus: <strong className="text-text-primary">10:00 AM</strong></p>
                    </div>
                    <div className="bg-background-secondary/50 rounded-xl p-4 border border-border-secondary/50">
                      <p className="text-text-secondary font-medium text-sm">You often get distracted by phone after 45 mins. Try taking a break at 30 mins.</p>
                    </div>
                  </div>

                  <div className="bg-card-background border border-card-border p-6 rounded-3xl shadow-xl flex flex-col gap-3 relative overflow-hidden group hover:border-button-primary/50 transition-colors">
                    <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Brain size={100} /></div>
                    <h3 className="text-xl font-black flex items-center gap-2 tracking-tight"><Brain className="text-button-primary" size={22} /> AI Insights</h3>
                    <div className="bg-background-secondary/50 rounded-xl p-4 mt-2 border border-border-secondary/50">
                      <p className="text-text-secondary font-medium text-sm">You are <strong className="text-button-primary">18% more productive</strong> on high priority tasks.</p>
                    </div>
                    <div className="bg-background-secondary/50 rounded-xl p-4 border border-border-secondary/50">
                      <p className="text-text-secondary font-medium text-sm">Your deep focus is significantly better when you tackle tasks early.</p>
                    </div>
                  </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-card-background border border-card-border p-6 rounded-3xl shadow-xl flex flex-col gap-5 relative overflow-hidden">
                    <h3 className="text-xl font-black flex items-center gap-2 tracking-tight"><CheckCircle className="text-emerald-500" size={22} /> Task Insights</h3>
                    <ul className="space-y-4">
                      <li className="flex justify-between items-center text-sm border-b border-border-secondary/50 pb-3"><span className="text-text-muted font-bold tracking-tight">Average Task Duration</span><span className="font-bold text-text-primary px-3 py-1 rounded-lg bg-background-secondary">45 mins</span></li>
                      <li className="flex justify-between items-center text-sm border-b border-border-secondary/50 pb-3"><span className="text-text-muted font-bold tracking-tight">Completion Rate</span><span className="font-bold text-emerald-500 px-3 py-1 rounded-lg bg-emerald-500/10">82%</span></li>
                      <li className="flex justify-between items-center text-sm"><span className="text-text-muted font-bold tracking-tight">Tasks Finished This Week</span><span className="font-bold text-text-primary px-3 py-1 rounded-lg bg-background-secondary">12</span></li>
                    </ul>
                  </div>

                  <div className="bg-card-background border border-card-border p-6 rounded-3xl shadow-xl flex flex-col gap-5 relative overflow-hidden">
                    <h3 className="text-xl font-black flex items-center gap-2 tracking-tight"><TrendingUp className="text-brand-500" size={22} /> Goal Analytics</h3>
                    <ul className="space-y-4">
                      <li className="flex justify-between items-center text-sm border-b border-border-secondary/50 pb-3"><span className="text-text-muted font-bold tracking-tight">Goals Reached This Month</span><span className="font-bold text-text-primary px-3 py-1 rounded-lg bg-background-secondary">3</span></li>
                      <li className="flex justify-between items-center text-sm border-b border-border-secondary/50 pb-3"><span className="text-text-muted font-bold tracking-tight">Current Progress Velocity</span><span className="font-bold text-brand-500 px-3 py-1 rounded-lg bg-brand-500/10">+15% / week</span></li>
                      <li className="flex justify-between items-center text-sm"><span className="text-text-muted font-bold tracking-tight">Avg Time per Goal</span><span className="font-bold text-text-primary px-3 py-1 rounded-lg bg-background-secondary">14 Days</span></li>
                    </ul>
                  </div>
                </section>

>>>>>>> Stashed changes
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Suspense fallback={<ChartSkeleton />}>
                    <FocusVsBreakChart data={dashboard.focusVsBreakData} />
                  </Suspense>

                  <Suspense fallback={<ChartSkeleton />}>
                    <CompletionRateChart data={dashboard.completionRate} />
                  </Suspense>

                  <Suspense fallback={<ChartSkeleton />}>
                    <FocusMoodRadarChart data={dashboard.focusMoodData} />
                  </Suspense>

                  <div className="md:col-span-2 lg:col-span-3">
                    <Suspense fallback={<ChartSkeleton />}>
                      <TopDistractionsChart data={dashboard.topDistractions} />
                    </Suspense>
                  </div>
                </section>
              </div>
            )}

          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Dashboard;