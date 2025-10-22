import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'recharts';
import {
  ArrowRight,
  LogOut,
  Clock,
  Target,
  CheckCircle,
  Smile,
  Brain,
  PieChart as PieChartIcon,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import sessionService from '../../../../services/sessionService';

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [kpis, setKpis] = useState(null);
  const [focusTrends, setFocusTrends] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [focusVsBreakData, setFocusVsBreakData] = useState([]);
  const [focusMoodData, setFocusMoodData] = useState([]);
  const [topDistractions, setTopDistractions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeBar, setActiveBar] = useState(null);

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
        setIsLoading(false);
      } catch (e) {
        console.error(e);
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900 text-white min-h-screen p-8 font-sans flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-purple-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-gray-900 text-white min-h-screen p-8 font-sans flex items-center justify-center">
        <p className="text-gray-400">Could not load user data. Please log in again.</p>
      </div>
    );
  }

  const displayName = user.fullName;
  const username = user.username;
  const photoURL =
    `https://ui-avatars.com/api/?name=${user.fullName.replace(' ', '+')}` ||
    `https://api.dicebear.com/9.x/adventurer/svg?seed=Luis`;

  return (
    <div className="bg-gray-900 text-white min-h-screen p-4 sm:p-6 lg:p-8 pt-30 lg:pt-25 md:pt-25 sm:pt-25 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {displayName?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-gray-400">Here's your productivity and wellness dashboard.</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {!kpis ? (
                <>
                  <KpiSkeleton />
                  <KpiSkeleton />
                  <KpiSkeleton />
                  <KpiSkeleton />
                </>
              ) : (
                <>
                  <KpiCard icon={<Clock size={24} />} title="Total Focus Time" value={formatTime(kpis.totalFocusTime)} />
                  <KpiCard icon={<CheckCircle size={24} />} title="Sessions Completed" value={kpis.sessionsCompleted} />
                  <KpiCard icon={<Brain size={24} />} title="Avg. Focus" value={`${kpis.avgFocus} / 5`} />
                  <KpiCard icon={<Smile size={24} />} title="Avg. Mood" value={`${kpis.avgMood} / 5`} />
                </>
              )}
            </div>

            <div className="bg-gray-800 rounded-2xl p-6 shadow-lg min-h-[300px]">
              <h3 className="text-lg font-semibold mb-4 text-white">Weekly Focus Trends (hours)</h3>
              {!focusTrends || focusTrends.length === 0 ? (
                <div className="h-64 w-full flex items-center justify-center text-gray-500">
                  No focus trend data yet.
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={focusTrends}
                      margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                      onMouseMove={(state) =>
                        setActiveBar(state.isTooltipActive ? state.activeTooltipIndex : null)
                      }
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                      <XAxis dataKey="day" tick={{ fill: '#A0AEC0' }} />
                      <YAxis tickFormatter={(value) => (value / 60).toFixed(1)} tick={{ fill: '#A0AEC0' }} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(128, 90, 213, 0.1)' }} />
                      <Bar dataKey="focusTime" name="Focus Time" unit=" min">
                        {focusTrends.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={activeBar === index ? '#805AD5' : '#6B46C1'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <h2 className="text-2xl font-bold text-white mt-4">Personalized Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FocusVsBreakChart
                data={focusVsBreakData}
                isLoading={!focusVsBreakData || focusVsBreakData.length === 0}
              />
              <FocusMoodRadarChart
                data={focusMoodData}
                isLoading={!focusMoodData || focusMoodData.length === 0}
              />
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-4 mb-4">
                <img src={photoURL} alt="Profile" className="w-16 h-16 rounded-full bg-gray-700" />
                <div>
                  <h3 className="font-bold text-lg text-white">{displayName}</h3>
                  <p className="text-sm text-gray-400">@{username}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
              >
                <LogOut size={16} className="mr-2" />
                <span>Logout</span>
              </button>
            </div>

            <div className="bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-white mb-4">At a Glance</h3>
              {!kpis ? (
                <div className="space-y-4">
                  <div className="h-8 w-3/4 rounded bg-gray-700 animate-pulse"></div>
                  <div className="h-8 w-1/2 rounded bg-gray-700 animate-pulse"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Avg. Session Length</span>
                    <span className="font-bold text-white text-lg">{formatTime(kpis.avgSessionLength)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Avg. Tasks Completed</span>
                    <span className="font-bold text-white text-lg">{kpis.avgTodosCompleted} tasks</span>
                  </div>
                </div>
              )}
            </div>

            <TopDistractionsCard distractions={topDistractions} isLoading={!topDistractions} />

            <div className="bg-gray-800 rounded-2xl p-6 shadow-lg min-h-[200px]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Recent Sessions</h3>
                <button
                  onClick={() => navigate('/sessions')}
                  className="text-sm text-purple-400 hover:text-purple-300 flex items-center"
                >
                  View All <ArrowRight size={14} className="ml-1" />
                </button>
              </div>
              <div className="space-y-4">
                {!recentSessions ? (
                  <>
                    <SessionItemSkeleton />
                    <SessionItemSkeleton />
                    <SessionItemSkeleton />
                  </>
                ) : recentSessions.length > 0 ? (
                  recentSessions.map((session) => <SessionItem key={session.id} session={session} />)
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">You have no recent sessions.</p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const KpiCard = ({ icon, title, value }) => (
  <div className="bg-gray-800 rounded-2xl p-4 shadow-md flex flex-col justify-between hover:bg-gray-700/50 transition-colors duration-300">
    <div className="text-purple-400 mb-2">{icon}</div>
    <p className="text-sm text-gray-400 mb-1">{title}</p>
    <p className="text-2xl font-bold text-white">{value}</p>
  </div>
);

const SessionItem = ({ session }) => {
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  const isCompleted = session.status === 'completed';

  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-700/50 transition-colors duration-300">
      <div className="flex items-center space-x-3 overflow-hidden">
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
            isCompleted ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
          }`}
        >
          {isCompleted ? <CheckCircle size={20} /> : <Target size={20} />}
        </div>
        <div className="overflow-hidden">
          <p className="font-semibold text-white text-sm truncate" title={session.title}>
            {session.title}
          </p>
          <p className="text-xs text-gray-400">{formatTime(session.actualFocusDuration || 0)}</p>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-2">
        <p className="text-sm font-medium text-gray-300">{formatDate(session.createdAt)}</p>
        <p className="text-xs text-gray-500">{`${session.completedSegments || 0}/${session.totalSegments || 0} Segments`}</p>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-700 p-2 rounded-md shadow-lg border border-gray-600">
        <p className="font-bold text-white">{label}</p>
        <p className="text-sm text-purple-300">{`Focus: ${payload[0].value} min`}</p>
      </div>
    );
  }
  return null;
};

const FocusVsBreakChart = ({ data, isLoading }) => (
  <div className="bg-gray-800 rounded-2xl p-6 shadow-lg min-h-[250px]">
    <h3 className="text-lg font-semibold text-white mb-4">Focus vs. Break Ratio</h3>
    {isLoading ? (
      <div className="h-48 w-full flex items-center justify-center text-gray-500">No data available.</div>
    ) : (
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            labelLine={false}
            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
              const radius = innerRadius + (outerRadius - innerRadius) * 1.2;
              const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
              const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
              return (
                <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                  {`${(percent * 100).toFixed(0)}%`}
                </text>
              );
            }}
          />
          <Legend iconType="circle" />
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    )}
  </div>
);

const FocusMoodRadarChart = ({ data, isLoading }) => (
  <div className="bg-gray-800 rounded-2xl p-6 shadow-lg min-h-[250px]">
    <h3 className="text-lg font-semibold text-white mb-4">Average Focus & Mood</h3>
    {isLoading ? (
      <div className="h-48 w-full flex items-center justify-center text-gray-500">No data available.</div>
    ) : (
      <ResponsiveContainer width="100%" height={200}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#4A5568" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#A0AEC0' }} />
          <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} />
          <Radar name="Rating" dataKey="value" stroke="#805AD5" fill="#805AD5" fillOpacity={0.6} />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    )}
  </div>
);

const TopDistractionsCard = ({ distractions, isLoading }) => (
  <div className="bg-gray-800 rounded-2xl p-6 shadow-lg">
    <h3 className="text-lg font-semibold text-white mb-4">Top Distractions</h3>
    {isLoading ? (
      <div className="space-y-3">
        <div className="h-5 w-3/4 rounded bg-gray-700 animate-pulse"></div>
        <div className="h-5 w-1/2 rounded bg-gray-700 animate-pulse"></div>
        <div className="h-5 w-2/3 rounded bg-gray-700 animate-pulse"></div>
      </div>
    ) : distractions.length > 0 ? (
      <ol className="list-decimal list-inside space-y-2">
        {distractions.map(([distraction, count]) => (
          <li key={distraction} className="text-gray-300">
            <span className="capitalize">{distraction}</span>
            <span className="text-xs text-gray-500 ml-2">({count} times)</span>
          </li>
        ))}
      </ol>
    ) : (
      <p className="text-sm text-gray-400 text-center py-2">No distractions reported!</p>
    )}
  </div>
);

const KpiSkeleton = () => (
  <div className="bg-gray-800 rounded-2xl p-4 shadow-md animate-pulse">
    <div className="h-6 w-6 rounded bg-gray-700 mb-2"></div>
    <div className="h-4 w-3/4 rounded bg-gray-700 mb-1"></div>
    <div className="h-8 w-1/2 rounded bg-gray-700"></div>
  </div>
);

const SessionItemSkeleton = () => (
  <div className="flex items-center justify-between p-3 rounded-lg animate-pulse">
    <div className="flex items-center space-x-3 w-full">
      <div className="w-10 h-10 rounded-lg bg-gray-700 flex-shrink-0"></div>
      <div className="flex-grow">
        <div className="h-4 w-3/4 rounded bg-gray-700 mb-1"></div>
        <div className="h-3 w-1/2 rounded bg-gray-700"></div>
      </div>
    </div>
    <div className="text-right w-1/4 flex-shrink-0">
      <div className="h-4 w-full rounded bg-gray-700 mb-1"></div>
      <div className="h-3 w-3/4 ml-auto rounded bg-gray-700"></div>
    </div>
  </div>
);

export default Dashboard;
