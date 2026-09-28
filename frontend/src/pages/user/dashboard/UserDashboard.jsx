import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../contexts/AuthContext.jsx";
import sessionService from "../../../../services/sessionService.js";
import StreakService from "../../../../services/streakService.js";
import taskService from "../../../../services/taskService.js";
import goalService from "../../../../services/goalService.js";
import { Play, CheckCircle2, Circle, Flame, Brain, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { Separator } from "@/components/ui/separator.jsx";

const formatTime = (seconds = 0) => {
  if (isNaN(seconds) || seconds < 0) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [data, setData] = useState({
    tasks: [],
    goals: [],
    streak: null,
    insights: null,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [tasksData, goalsData, streakData, todaysInsights] = await Promise.all([
          taskService.getTasks(),
          goalService.getGoals(),
          StreakService.fetchStreak(),
          sessionService.getTodaysInsights()
        ]);

        setData({
          tasks: tasksData || [],
          goals: goalsData || [],
          streak: streakData || null,
          insights: todaysInsights?.insights || null
        });
      } catch (err) {
        console.error("Failed to load Today data", err);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const todayTasks = useMemo(() => {
    return data.tasks.filter((t) => {
      if (!t.plannedDate) return false;
      return new Date(t.plannedDate).toDateString() === new Date().toDateString();
    }).sort((a, b) => a.order - b.order);
  }, [data.tasks]);

  const nextTask = useMemo(() => {
    return todayTasks.find((t) => t.status !== "completed" && t.status !== "cancelled");
  }, [todayTasks]);

  const handleStartFocus = async (task) => {
    if (!task) return;
    const durationSeconds = 25 * 60; // 25 mins by default
    const payload = {
      sessionId: Date.now().toString(),
      title: task.title,
      taskIds: [task._id],
      sessionSegments: [
        { type: "focus", duration: 0, totalDuration: durationSeconds },
      ],
      plannedDuration: durationSeconds,
      totalBreakMinutes: 0,
      totalFocusMinutes: 0,
    };
    try {
      await sessionService.startSession(payload);
      navigate("/focus-page", {
        state: {
          taskIds: [task._id],
          title: task.title,
          source: "today",
          plannedDuration: durationSeconds,
        },
      });
    } catch (error) {
      console.error(error);
    }
  };

  const currentDate = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };
  
  const greeting = `${getGreeting()}, ${user?.firstName || user?.fullName?.split(" ")[0] || "User"}`;

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Couldn't load today's work.</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background text-foreground h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 sm:p-8 md:p-10 lg:p-12 space-y-12 pb-24">
        
        {/* Header */}
        <header className="space-y-1.5 mt-4">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">{greeting}</h1>
          <p className="text-sm text-muted-foreground">{currentDate}</p>
        </header>

        {/* Today's Progress */}
        <section className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-16 w-full rounded-xl" />
          ) : (
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Daily Progress</span>
                <span className="text-sm font-medium">
                   {formatTime((data.streak?.focusMinutes || 0) * 60)} / {formatTime((data.streak?.dailyTargetMinutes || 25) * 60)}
                </span>
              </div>
              <div className="h-2.5 w-full bg-secondary/50 rounded-full overflow-hidden border border-border/50">
                <div 
                  className="h-full bg-primary transition-all duration-500 ease-out" 
                  style={{ width: `${Math.min(100, ((data.streak?.focusMinutes || 0) / (data.streak?.dailyTargetMinutes || 25)) * 100)}%` }} 
                />
              </div>
            </div>
          )}
        </section>

        {/* Next Up */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Next Up</h2>
          {isLoading ? (
            <Skeleton className="h-40 w-full rounded-2xl" />
          ) : nextTask ? (
            <Card className="border-border bg-card hover:border-primary/50 transition-colors shadow-sm rounded-2xl">
              <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-3">
                  {nextTask.goal && (
                    <Badge variant="secondary" className="mb-1 rounded-md px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider">
                      {data.goals.find(g => g._id === nextTask.goal)?.title || "Project Task"}
                    </Badge>
                  )}
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-card-foreground">{nextTask.title}</h3>
                  <p className="text-sm text-muted-foreground">Ready to focus</p>
                </div>
                <Button size="lg" className="shrink-0 gap-2 font-bold px-8 h-12 rounded-xl" onClick={() => handleStartFocus(nextTask)}>
                  <Play className="w-4 h-4 fill-current" />
                  Start Focus
                </Button>
              </CardContent>
            </Card>
          ) : (
             <Card className="border-border bg-card border-dashed shadow-sm rounded-2xl">
                <CardContent className="p-10 flex flex-col items-center justify-center text-center space-y-4">
                  <p className="text-muted-foreground font-medium">Nothing planned yet</p>
                  <Button variant="outline" className="rounded-xl font-bold border-border hover:bg-secondary" onClick={() => navigate("/planner")}>
                     Plan your day
                  </Button>
                </CardContent>
             </Card>
          )}
        </section>

        {/* Today's Work & Supporting info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Today's Work */}
          <section className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Today's Work</h2>
              <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground font-bold rounded-lg" onClick={() => navigate("/planner")}>
                 <Plus className="w-3.5 h-3.5 mr-1.5" /> Add task
              </Button>
            </div>
            
            <div className="space-y-3">
               {isLoading ? (
                 <>
                   <Skeleton className="h-14 w-full rounded-xl" />
                   <Skeleton className="h-14 w-full rounded-xl" />
                 </>
               ) : todayTasks.length > 0 ? (
                 <div className="flex flex-col gap-2.5">
                    {todayTasks.map(task => {
                       const isCompleted = task.status === "completed";
                       return (
                        <div key={task._id} className={`flex items-center gap-3 p-4 rounded-xl border transition-colors ${isCompleted ? 'bg-secondary/20 border-transparent grayscale-[0.5] opacity-70' : 'bg-card border-border hover:border-primary/30 shadow-sm'}`}>
                           {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                           ) : (
                              <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                           )}
                           <span className={`text-sm font-medium ${isCompleted ? "line-through text-muted-foreground" : "text-card-foreground"}`}>
                              {task.title}
                           </span>
                        </div>
                       );
                    })}
                 </div>
               ) : (
                  <div className="p-6 rounded-xl border border-dashed border-border bg-card/30 text-center">
                     <p className="text-sm text-muted-foreground">No tasks scheduled for today.</p>
                  </div>
               )}
            </div>
          </section>

          {/* Sidebar / Context */}
          <div className="lg:col-span-5 space-y-8">
             {/* Streak */}
             <section className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Streak</h2>
                {isLoading ? (
                  <Skeleton className="h-24 w-full rounded-2xl" />
                ) : (
                  <Card className="border-border bg-card shadow-sm rounded-2xl">
                     <CardContent className="p-6 flex items-center justify-between">
                        <div>
                           <div className="flex items-center gap-2.5">
                              <Flame className="w-6 h-6 text-orange-500 fill-orange-500/20" />
                              <h3 className="text-2xl font-bold tracking-tight text-card-foreground">
                                 {data.streak?.currentStreak || 0} days
                              </h3>
                           </div>
                           <p className="text-sm text-muted-foreground mt-1.5 ml-8 font-medium">Small consistent wins</p>
                        </div>
                     </CardContent>
                  </Card>
                )}
             </section>

             {/* Insight */}
             <section className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Insight</h2>
                {isLoading ? (
                  <Skeleton className="h-24 w-full rounded-2xl" />
                ) : (
                  <Card className="border-primary/20 bg-primary/5 shadow-sm rounded-2xl">
                     <CardContent className="p-6">
                        <div className="flex gap-4">
                          <div className="p-2.5 bg-primary/10 rounded-xl shrink-0 h-fit">
                            <Brain className="w-4 h-4 text-primary" />
                          </div>
                          <p className="text-sm font-medium text-foreground leading-relaxed mt-1">
                             {data.insights?.longest_focus && data.insights.longest_focus > 0 ? 
                              `Your longest focus session today was ${Math.round(data.insights.longest_focus / 60)} minutes. Great sustained effort!` : 
                              "Complete a focus session today to generate productivity insights."}
                          </p>
                        </div>
                     </CardContent>
                  </Card>
                )}
             </section>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;