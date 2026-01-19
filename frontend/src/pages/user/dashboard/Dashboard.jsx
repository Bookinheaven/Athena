import { lazy, Suspense, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import sessionService from "../../../../services/sessionService";
import { useAuth } from "../../../../contexts/AuthContext";
import Header from "./components/Header.jsx";
import { Award, Brain, Calendar, CheckCircle, Clock, Gauge, Loader2, Smile, Target, TrendingUp, Zap } from "lucide-react";

import MetricCard from "./components/cards/MetricCard.jsx";
import KpiSkeleton from "./components/skeletons/KpiSkeleton.jsx";
import StatCard from "./components/cards/StatCard.jsx";
import ChartSkeleton from "./components/skeletons/ChartSkeleton.jsx";

const WeeklyFocusAreaChart = lazy(() =>
  import("./components/charts/WeeklyFocusAreaChart.jsx")
);
const DailyComparisonChart = lazy(() =>
  import("./components/charts/DailyComparisonChart.jsx")
);
const SessionsByDayChart = lazy(() =>
  import("./components/charts/SessionsByDayChart.jsx")
);
const MoodFocusTrendChart = lazy(() =>
  import("./components/charts/MoodFocusTrendChart.jsx")
);
const CompletionRateChart = lazy(() =>
  import("./components/charts/CompletionRateChart.jsx")
);
const FocusMoodRadarChart = lazy(() =>
  import("./components/charts/FocusMoodRadarChart.jsx")
);
const FocusVsBreakChart = lazy(() =>
  import("./components/charts/FocusVsBreakChart.jsx")
);
const TopDistractionsChart = lazy(() =>
  import("./components/charts/TopDistractionsChart.jsx")
);
const RecentSessions = lazy(() =>
  import("./components/charts/RecentSessions.jsx")
);

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
        const dataInsights = data?.insights || {};
        setKpis(dataInsights.kpis || null);
        setFocusMoodData(dataInsights.focusMoodData || []);
        setFocusTrends(dataInsights.focusTrends || []);
        setFocusVsBreakData(dataInsights.focusVsBreakData || []);
        setTopDistractions(dataInsights.topDistractions || []);
        setRecentSessions(data?.recentSessions || []);
        setProductivityScore(dataInsights.productivityScore || 0);
        setDailyComparison(dataInsights.dailyComparison || []);
        setMoodTrend(dataInsights.moodTrend || []);
        setSessionsByDay(dataInsights.sessionsByDay || []);
        setCompletionRate(dataInsights.completionRate || []);
      } catch (e) {
        console.error("Failed to load dashboard insights:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (!user && !isLoading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center bg-background-color">
        <div className="text-center p-8 rounded-2xl bg-card-background border border-card-border">
          <p className="text-text-secondary mb-4">
            Could not load user data. Please log in again.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-2 rounded-lg font-semibold bg-button-primary text-button-primary-text hover:opacity-90 transition"
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
          <Loader2 size={48} className="animate-spin mx-auto text-button-primary mb-4" />
          <p className="text-text-secondary">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const displayName = user.fullName;
  const username = user.username;

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) seconds = 0;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <div className="min-h-screen bg-background-color text-text-primary pt-20 md:pt-10 pb-12 lg:pt-5">
      <div className="px-4 sm:px-6 lg:px-9 mx-auto">
        <Header displayName={displayName} username={username} />

        <motion.main
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          <motion.section variants={itemVariants} className="w-full">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-button-primary/10">
                <Gauge size={20} className="text-button-primary" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">Performance Metrics</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4">
              {!kpis ? (
                <>
                  <KpiSkeleton /><KpiSkeleton /><KpiSkeleton /><KpiSkeleton /><KpiSkeleton />
                </>
              ) : (
                <>
                  <MetricCard icon={<Clock size={18} />} title="Focus Time" value={formatTime(kpis.totalFocusTime)} color="#3b82f6" />
                  <MetricCard icon={<CheckCircle size={18} />} title="Avg. Completion" value={`${kpis.avgSessions}%`} color="#22c55e" />
                  <MetricCard icon={<Brain size={18} />} title="Avg. Focus" value={`${kpis.avgFocus} / 5`} color="#a855f7" />
                  <MetricCard icon={<Smile size={18} />} title="Avg. Mood" value={`${kpis.avgMood} / 5`} color="#f59e0b" />
                  <MetricCard icon={<Award size={18} />} title="Productivity" value={`${productivityScore || 0}%`} color="#ec4899" />
                </>
              )}
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className="w-full">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-button-primary/10">
                <Target size={20} className="text-button-primary" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">Session Summary</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-4">
              <StatCard icon={<Target size={18} />} title="Total Sessions" value={`${kpis?.sessionsStarted || 0}`} subtitle="All time" color="#22c55e" />
              <StatCard icon={<Zap size={18} />} title="Completed Sessions" value={kpis?.sessionsCompleted || 0} subtitle="All time" color="#f59e0b" />
              <StatCard icon={<Calendar size={18} />} title="Avg. Session Length" value={formatTime(kpis?.avgSessionLength || 0)} subtitle="Per session" color="#3b82f6" />
              <StatCard icon={<Target size={18} />} title="Avg. Tasks Completed" value={`${kpis?.avgTodosCompleted || 0} tasks`} subtitle="Per session" color="#22c55e" />
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Suspense fallback={<ChartSkeleton />}>
                <WeeklyFocusAreaChart
                  data={focusTrends}
                  isLoading={!focusTrends || focusTrends.length === 0}
                />
              </Suspense>
              <Suspense fallback={<ChartSkeleton />}>
                <DailyComparisonChart
                  data={dailyComparison}
                  isLoading={!dailyComparison || dailyComparison.length === 0}
                />
              </Suspense>
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Suspense fallback={<ChartSkeleton />}>
                <SessionsByDayChart
                  data={sessionsByDay}
                  isLoading={!sessionsByDay || sessionsByDay.length === 0}
                />
                <RecentSessions recentSessions={recentSessions} navigate={navigate} />

              </Suspense>
            </div>

          </motion.section>

          <motion.section variants={itemVariants} className="w-full space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-button-primary/10">
                <TrendingUp size={20} className="text-button-primary" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">Insights & Analysis</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Suspense fallback={<ChartSkeleton />}>
                <FocusVsBreakChart
                  data={focusVsBreakData}
                  isLoading={!focusVsBreakData || focusVsBreakData.length === 0}
                />
              </Suspense>
              <Suspense fallback={<ChartSkeleton />}>
                <CompletionRateChart
                  data={completionRate}
                  isLoading={!completionRate || completionRate.length === 0}
                />
              </Suspense>
              <Suspense fallback={<ChartSkeleton />}>
                <FocusMoodRadarChart
                  data={focusMoodData}
                  isLoading={!focusMoodData || focusMoodData.length === 0}
                />
              </Suspense>
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Suspense fallback={<ChartSkeleton />}>
                  <MoodFocusTrendChart
                    data={moodTrend}
                    isLoading={!moodTrend || moodTrend.length === 0}
                  />
                </Suspense>
              </div>
              <Suspense fallback={<ChartSkeleton />}>
                <TopDistractionsChart
                  data={topDistractions}
                  isLoading={!topDistractions}
                />
              </Suspense>
            </div>
          </motion.section>
        </motion.main>
      </div>
    </div>
  );
};

export default Dashboard;
