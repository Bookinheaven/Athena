import React, { useState, useEffect } from 'react';
import {
  Database,
  UserPlus,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Terminal,
  Zap,
  Calendar,
  Clock,
  Sparkles,
  Flame,
  CheckSquare,
  Users,
  Trash2,
  RefreshCw,
  ChevronRight,
  UserCheck,
  Search,
  X,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import toast from 'react-hot-toast';
import adminService from '../../../../services/adminService';
import { cn } from '@/lib/utils';

const GENERATION_PROFILES = [
  {
    id: 'realistic',
    title: 'Realistic history',
    desc: 'Balanced study pattern (~70% completion, 1-3 daily sessions, steady progress)',
    badgeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
  },
  {
    id: 'focus_heavy',
    title: 'Focus-heavy history',
    desc: 'High concentration of deep work sessions (3-5 sessions/day, 45-60 min blocks)',
    badgeColor: 'text-violet-400 border-violet-500/30 bg-violet-500/10'
  },
  {
    id: 'planner_heavy',
    title: 'Planner-heavy history',
    desc: 'Extensive task occurrences & scheduled calendar time blocks with lower session time',
    badgeColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10'
  },
  {
    id: 'inconsistent',
    title: 'Inconsistent history',
    desc: 'Sporadic activity clusters, frequent abandoned sessions (~30%), broken streaks',
    badgeColor: 'text-rose-400 border-rose-500/30 bg-rose-500/10'
  },
  {
    id: 'overloaded',
    title: 'Overloaded period',
    desc: 'Packed schedule, high task density (6+ daily tasks), elevated stress and reschedule rate',
    badgeColor: 'text-orange-400 border-orange-500/30 bg-orange-500/10'
  },
  {
    id: 'custom',
    title: 'Custom',
    desc: 'Manually specify multipliers, target dates, and custom behavioral parameters',
    badgeColor: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10'
  }
];

const DATE_RANGE_OPTIONS = [
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
  { value: '60', label: '60 days' },
  { value: '90', label: '90 days' }
];

const ACTIVITY_LEVELS = [
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
  { value: 'intense', label: 'Intense' }
];

const BEHAVIORS = [
  { value: 'consistent_student', label: 'Consistent student' },
  { value: 'crammer', label: 'Crammer / Last-minute' },
  { value: 'night_owl', label: 'Night owl' },
  { value: 'early_bird', label: 'Early bird' },
  { value: 'procrastinator', label: 'Procrastinator' },
  { value: 'deep_worker', label: 'Deep work specialist' }
];

const FormLabel = ({ children, required }) => (
  <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1">
    {children}
    {required && <span className="text-primary">*</span>}
  </label>
);

export function DeveloperDataTab({ targetUserId }) {
  const [activeTab, setActiveTab] = useState('add_to_user'); // 'add_to_user' | 'create_test_user'

  // User list state
  const [usersList, setUsersList] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Datasets state (for 'create_test_user' mode)
  const [datasets, setDatasets] = useState([]);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(false);

  // Form states for "Add Data to User"
  const [selectedUserId, setSelectedUserId] = useState(targetUserId || '');
  const [selectedProfile, setSelectedProfile] = useState('realistic');
  const [dateRange, setDateRange] = useState('30');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [behavior, setBehavior] = useState('consistent_student');
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 100000).toString());

  // Form states for "Create New Test User"
  const [newUserData, setNewUserData] = useState({
    profile: 'realistic',
    numUsers: 1,
    historyDays: 30,
    activityLevel: 'moderate',
    behavior: 'consistent_student',
    seed: Math.floor(Math.random() * 100000).toString()
  });

  // Action / Preview states
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isInjecting, setIsInjecting] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [isCleaning, setIsCleaning] = useState(false);

  useEffect(() => {
    if (targetUserId) {
      setSelectedUserId(targetUserId);
      setActiveTab('add_to_user');
    }
  }, [targetUserId]);

  useEffect(() => {
    fetchUsers();
    fetchDatasets();
  }, []);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await adminService.getUsers();
      if (res?.success && Array.isArray(res.users)) {
        setUsersList(res.users);
        if (res.users.length > 0 && !selectedUserId) {
          // Default to Tanvik if present, or first user
          const tanvikUser = res.users.find(u => 
            (u.fullName && u.fullName.toLowerCase().includes('tanvik')) ||
            (u.username && u.username.toLowerCase().includes('tanvik'))
          );
          setSelectedUserId(tanvikUser ? tanvikUser.id : res.users[0].id);
        }
      }
    } catch (e) {
      console.error("Error fetching users:", e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchDatasets = async () => {
    setIsLoadingDatasets(true);
    try {
      const res = await adminService.getDeveloperDatasets();
      if (res?.success) {
        setDatasets(res.datasets || []);
      }
    } catch (e) {
      console.error("Error fetching datasets:", e);
    } finally {
      setIsLoadingDatasets(false);
    }
  };

  const selectedUserObj = usersList.find(u => u.id === selectedUserId);

  const filteredUsers = usersList.filter((u) => {
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.toLowerCase();
    return (
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.id && u.id.toLowerCase().includes(q))
    );
  });

  const handlePreview = async () => {
    setIsPreviewing(true);
    setPreviewResult(null);

    const payload = activeTab === 'add_to_user'
      ? {
          userId: selectedUserId,
          profile: selectedProfile,
          historyDays: parseInt(dateRange, 10),
          activityLevel,
          behavior,
          seed
        }
      : {
          profile: newUserData.profile,
          numUsers: parseInt(newUserData.numUsers, 10),
          historyDays: parseInt(newUserData.historyDays, 10),
          activityLevel: newUserData.activityLevel,
          behavior: newUserData.behavior,
          seed: newUserData.seed
        };

    try {
      const result = await adminService.previewDeveloperData(payload);
      if (result?.success) {
        setPreviewResult(result.preview);
      } else {
        toast.error(result.message || 'Preview generation failed.');
      }
    } catch (e) {
      toast.error('Error fetching preview data.');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleApplyToUser = async () => {
    if (!selectedUserId) {
      toast.error('Please select a target user.');
      return;
    }

    setIsInjecting(true);
    try {
      const payload = {
        userId: selectedUserId,
        profile: selectedProfile,
        historyDays: parseInt(dateRange, 10),
        activityLevel,
        behavior,
        seed
      };

      const result = await adminService.addDataToUser(payload);
      if (result?.success) {
        toast.success(result.message || 'Developer data generated successfully!');
        setPreviewResult(null);
        setValidationResult(null);
        // refresh seed
        setSeed(Math.floor(Math.random() * 100000).toString());
      } else {
        toast.error(result.message || 'Data injection failed.');
      }
    } catch (e) {
      toast.error('Error adding data to user.');
    } finally {
      setIsInjecting(false);
    }
  };

  const handleValidateUser = async () => {
    if (!selectedUserId) {
      toast.error('Please select a target user.');
      return;
    }
    setIsValidating(true);
    setValidationResult(null);
    try {
      const res = await adminService.validateDeveloperData(selectedUserId);
      setValidationResult(res);
      if (res?.valid) {
        toast.success('Validation passed: Dataset integrity verified.');
      } else {
        toast.error(res?.message || 'Validation failed: Issues detected.');
      }
    } catch (err) {
      toast.error('Error running validator.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleCleanupUser = async () => {
    if (!selectedUserId) {
      toast.error('Please select a target user.');
      return;
    }
    if (!window.confirm('Delete all developer-generated records for this user? Real user data will be preserved.')) {
      return;
    }
    setIsCleaning(true);
    try {
      const res = await adminService.cleanupDeveloperData(selectedUserId);
      if (res?.success) {
        toast.success(res.message);
        setValidationResult(null);
        setPreviewResult(null);
      } else {
        toast.error(res.message || 'Cleanup failed.');
      }
    } catch (err) {
      toast.error('Error during cleanup.');
    } finally {
      setIsCleaning(false);
    }
  };

  const handleCreateTestUser = async () => {
    setIsInjecting(true);
    try {
      const payload = {
        profile: newUserData.profile,
        numUsers: parseInt(newUserData.numUsers, 10),
        historyDays: parseInt(newUserData.historyDays, 10),
        activityLevel: newUserData.activityLevel,
        behavior: newUserData.behavior,
        seed: newUserData.seed
      };

      const result = await adminService.generateDeveloperData(payload);
      if (result?.success) {
        toast.success(result.message || 'New test user(s) created.');
        setPreviewResult(null);
        fetchDatasets();
        fetchUsers();
        setNewUserData(prev => ({
          ...prev,
          seed: Math.floor(Math.random() * 100000).toString()
        }));
      } else {
        toast.error(result.message || 'Generation failed.');
      }
    } catch (e) {
      toast.error('Error generating test user.');
    } finally {
      setIsInjecting(false);
    }
  };

  const handleDeleteDataset = async (datasetId) => {
    if (!window.confirm(`Delete dataset '${datasetId}' and associated test accounts?`)) return;
    try {
      const result = await adminService.deleteDeveloperDataset(datasetId);
      if (result?.success) {
        toast.success('Test dataset removed.');
        fetchDatasets();
        fetchUsers();
      } else {
        toast.error(result.message || 'Delete failed.');
      }
    } catch (e) {
      toast.error('Error deleting dataset.');
    }
  };

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      {/* ── Page Header & Top Tabs ── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Developer Data
            <span className="font-mono text-[10px] font-normal uppercase tracking-widest px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/40">
              dev-fixtures
            </span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Simulate realistic activity, test timeline flows, and seed database accounts with synthetic sessions.
          </p>
        </div>

        {/* Segmented Top Buttons / Tabs */}
        <div className="inline-flex rounded-lg border border-border/50 bg-muted/20 p-1 gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('add_to_user');
              setPreviewResult(null);
            }}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-md font-mono text-xs font-semibold transition-all",
              activeTab === 'add_to_user'
                ? "bg-card text-foreground shadow-sm border border-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            )}
          >
            <UserCheck className="size-3.5 text-primary" />
            Add Data to User
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('create_test_user');
              setPreviewResult(null);
            }}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-md font-mono text-xs font-semibold transition-all",
              activeTab === 'create_test_user'
                ? "bg-card text-foreground shadow-sm border border-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            )}
          >
            <UserPlus className="size-3.5 text-blue-400" />
            Create New Test User
          </button>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-border/40" />
      </div>

      {/* ══════════════════════════════════════════════════════
          MODE 1: ADD DATA TO USER
         ══════════════════════════════════════════════════════ */}
      {activeTab === 'add_to_user' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-foreground">
              Add Data to User
            </h3>
            <p className="font-mono text-[11px] text-muted-foreground">
              Inject synthetic focus history, goals, tasks, and streaks into an existing user profile.
            </p>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 space-y-6 shadow-sm">
            {/* User Search & Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel required>User</FormLabel>
                <span className="font-mono text-[9px] text-muted-foreground/70">
                  {filteredUsers.length} of {usersList.length} users
                </span>
              </div>

              {/* User Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search users by name, username, email, or ID..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="h-8 pl-8.5 pr-8 font-mono text-xs bg-background/80 border-border/60 focus:border-primary/50 rounded-lg placeholder:text-muted-foreground/50"
                />
                {userSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setUserSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                    title="Clear search"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* User Dropdown Selector */}
              <div className="relative">
                <Select
                  value={selectedUserId}
                  onValueChange={(val) => {
                    setSelectedUserId(val);
                    setPreviewResult(null);
                  }}
                >
                  <SelectTrigger className="h-9.5 font-mono text-xs bg-background/80 border-border/60 focus:ring-1 focus:ring-primary">
                    <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "Select user"}>
                      {selectedUserObj ? (
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-semibold text-foreground">
                            {selectedUserObj.fullName || selectedUserObj.username}
                          </span>
                          <span className="text-muted-foreground text-[10px]">
                            ({selectedUserObj.email})
                          </span>
                        </div>
                      ) : "Select user"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-60 font-mono text-xs">
                    {filteredUsers.length === 0 ? (
                      <div className="p-3 text-center text-xs text-muted-foreground">
                        No users matching "{userSearchQuery}"
                      </div>
                    ) : (
                      filteredUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id} className="py-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {user.fullName || user.username}
                            </span>
                            <span className="text-muted-foreground text-[10px]">
                              ({user.email})
                            </span>
                            {user.accountType === 'admin' && (
                              <span className="text-[9px] px-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                admin
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedUserObj && (
                <div className="rounded-lg border border-border/40 bg-muted/15 p-2.5 flex items-center justify-between font-mono text-[11px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="size-6 rounded bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                      {selectedUserObj.fullName?.charAt(0) || selectedUserObj.username?.charAt(0) || 'U'}
                    </div>
                    <div className="truncate">
                      <span className="font-semibold text-foreground">
                        {selectedUserObj.fullName || selectedUserObj.username}
                      </span>
                      <span className="text-muted-foreground text-[10px] ml-1.5">
                        ({selectedUserObj.id.substring(0, 8)}...)
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded border border-border/40 bg-muted text-muted-foreground shrink-0 font-bold">
                    {selectedUserObj.accountType || 'user'}
                  </span>
                </div>
              )}
            </div>

            {/* What do you want to generate? */}
            <div className="space-y-3">
              <FormLabel required>What do you want to generate?</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {GENERATION_PROFILES.map((p) => {
                  const isSelected = selectedProfile === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedProfile(p.id);
                        setPreviewResult(null);
                      }}
                      className={cn(
                        "cursor-pointer rounded-lg border p-3 transition-all flex items-start gap-3 select-none",
                        isSelected
                          ? "border-primary/60 bg-primary/5 shadow-xs"
                          : "border-border/40 bg-background/40 hover:bg-muted/20 hover:border-border/70"
                      )}
                    >
                      <div className="pt-0.5">
                        <div
                          className={cn(
                            "size-4 rounded-full border flex items-center justify-center transition-all",
                            isSelected
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/40 bg-transparent"
                          )}
                        >
                          {isSelected && <div className="size-1.5 rounded-full bg-primary-foreground" />}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className={cn("text-xs font-semibold", isSelected ? "text-primary" : "text-foreground")}>
                          {p.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {p.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Date range, Activity level, Behavior Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {/* Date range */}
              <div className="space-y-1.5">
                <FormLabel>Date range</FormLabel>
                <Select
                  value={dateRange}
                  onValueChange={(val) => {
                    setDateRange(val);
                    setPreviewResult(null);
                  }}
                >
                  <SelectTrigger className="h-9 font-mono text-xs bg-background/80 border-border/60">
                    <SelectValue placeholder="Select days" />
                  </SelectTrigger>
                  <SelectContent className="font-mono text-xs">
                    {DATE_RANGE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Activity level */}
              <div className="space-y-1.5">
                <FormLabel>Activity level</FormLabel>
                <Select
                  value={activityLevel}
                  onValueChange={(val) => {
                    setActivityLevel(val);
                    setPreviewResult(null);
                  }}
                >
                  <SelectTrigger className="h-9 font-mono text-xs bg-background/80 border-border/60">
                    <SelectValue placeholder="Select activity" />
                  </SelectTrigger>
                  <SelectContent className="font-mono text-xs">
                    {ACTIVITY_LEVELS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Behavior */}
              <div className="space-y-1.5">
                <FormLabel>Behavior</FormLabel>
                <Select
                  value={behavior}
                  onValueChange={(val) => {
                    setBehavior(val);
                    setPreviewResult(null);
                  }}
                >
                  <SelectTrigger className="h-9 font-mono text-xs bg-background/80 border-border/60">
                    <SelectValue placeholder="Select behavior" />
                  </SelectTrigger>
                  <SelectContent className="font-mono text-xs">
                    {BEHAVIORS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Actions: [ Preview ] [ Validate Data ] [ Clear Dev Data ] */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <Button
                type="button"
                onClick={handlePreview}
                disabled={isPreviewing || isInjecting || !selectedUserId}
                className="h-9 font-mono text-xs font-semibold px-4"
              >
                {isPreviewing ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-1.5" />
                    Simulating...
                  </>
                ) : (
                  <>
                    <Play className="size-3.5 mr-1.5 fill-current" />
                    Preview
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleValidateUser}
                disabled={isValidating || !selectedUserId}
                className="h-9 font-mono text-xs font-semibold px-3.5 border-border/60 hover:bg-muted/30"
              >
                {isValidating ? (
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                ) : (
                  <ShieldCheck className="size-3.5 mr-1.5 text-primary" />
                )}
                Validate
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={handleCleanupUser}
                disabled={isCleaning || !selectedUserId}
                className="h-9 font-mono text-xs font-semibold px-3 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
              >
                {isCleaning ? (
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                ) : (
                  <Trash2 className="size-3.5 mr-1.5" />
                )}
                Clear Dev Data
              </Button>

              <button
                type="button"
                onClick={() => setSeed(Math.floor(Math.random() * 100000).toString())}
                className="ml-auto font-mono text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors flex items-center gap-1"
                title="Randomize seed"
              >
                <RefreshCw className="size-3" />
                Seed: #{seed}
              </button>
            </div>
          </div>

          {/* ── Validation Results Display ── */}
          {validationResult && (
            <div className="rounded-xl border border-border/50 bg-card/90 backdrop-blur-sm overflow-hidden p-5 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between border-b border-border/30 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className={cn("size-4", validationResult.valid ? "text-emerald-400" : "text-destructive")} />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider">
                    Developer Dataset Validation
                  </span>
                </div>
                <span
                  className={cn(
                    "font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded border",
                    validationResult.valid
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-destructive/30 bg-destructive/10 text-destructive"
                  )}
                >
                  {validationResult.summary}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                {Object.entries(validationResult.checks || {}).map(([key, check]) => (
                  <div key={key} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/10 border border-border/20">
                    {check.passed ? (
                      <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="size-3.5 text-destructive shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground capitalize">
                        {key.replace(/([A-Z])/g, " $1")}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">{check.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Preview Result Display ── */}
          {previewResult && (
            <div className="rounded-xl border border-primary/30 bg-card/90 backdrop-blur-sm overflow-hidden shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/40 bg-primary/5 px-5 py-3">
                <div className="flex items-center gap-2">
                  <Terminal className="size-4 text-primary" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
                    Preview Projection
                  </span>
                </div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  Target: <span className="text-foreground font-semibold">{previewResult.targetUser?.fullName || selectedUserObj?.fullName || 'Selected User'}</span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-lg border border-border/40 bg-muted/10 p-3 text-center">
                    <p className="font-mono text-xl font-black text-foreground">
                      {previewResult.estimatedSessions}
                    </p>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70 mt-0.5">
                      Sessions
                    </p>
                  </div>

                  <div className="rounded-lg border border-border/40 bg-muted/10 p-3 text-center">
                    <p className="font-mono text-xl font-black text-primary">
                      {previewResult.estimatedFocusHours}h
                    </p>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70 mt-0.5">
                      Focus Time
                    </p>
                  </div>

                  <div className="rounded-lg border border-border/40 bg-muted/10 p-3 text-center">
                    <p className="font-mono text-xl font-black text-foreground">
                      {previewResult.estimatedTasks}
                    </p>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70 mt-0.5">
                      Tasks / Goals
                    </p>
                  </div>

                  <div className="rounded-lg border border-border/40 bg-muted/10 p-3 text-center">
                    <p className="font-mono text-xl font-black text-amber-400">
                      {previewResult.estimatedStreak}d
                    </p>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70 mt-0.5">
                      Projected Streak
                    </p>
                  </div>
                </div>

                {/* Behavioral Notes */}
                {previewResult.behavioralNotes && previewResult.behavioralNotes.length > 0 && (
                  <div className="rounded-lg border border-border/30 bg-muted/15 p-3.5 space-y-1.5 font-mono text-[11px]">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1.5">
                      <Sparkles className="size-3 text-primary" />
                      Behavior Characteristics
                    </div>
                    <ul className="space-y-1 text-muted-foreground pl-1">
                      {previewResult.behavioralNotes.map((note, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-primary font-bold">›</span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Commit Action */}
                <div className="pt-2 flex items-center justify-between border-t border-border/30">
                  <span className="font-mono text-[11px] text-muted-foreground">
                    Ready to populate data into database?
                  </span>
                  <Button
                    type="button"
                    onClick={handleApplyToUser}
                    disabled={isInjecting}
                    className="h-9 font-mono text-xs font-bold px-5 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isInjecting ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin mr-1.5" />
                        Injecting Records...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-3.5 mr-1.5" />
                        Apply Data to User
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODE 2: CREATE NEW TEST USER
         ══════════════════════════════════════════════════════ */}
      {activeTab === 'create_test_user' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-foreground">
              Create New Test User
            </h3>
            <p className="font-mono text-[11px] text-muted-foreground">
              Generate isolated synthetic test accounts (`*@athena.test`) with pre-seeded timelines for regression testing.
            </p>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 space-y-6 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Profile */}
              <div className="space-y-1.5">
                <FormLabel>Generation Profile</FormLabel>
                <Select
                  value={newUserData.profile}
                  onValueChange={(val) => setNewUserData({ ...newUserData, profile: val })}
                >
                  <SelectTrigger className="h-9 font-mono text-xs bg-background/80 border-border/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="font-mono text-xs">
                    {GENERATION_PROFILES.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Number of users */}
              <div className="space-y-1.5">
                <FormLabel>Number of Test Users</FormLabel>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={newUserData.numUsers}
                  onChange={(e) => setNewUserData({ ...newUserData, numUsers: e.target.value })}
                  className="h-9 font-mono text-xs bg-background/80 border-border/60"
                />
              </div>

              {/* Date range */}
              <div className="space-y-1.5">
                <FormLabel>Date range</FormLabel>
                <Select
                  value={newUserData.historyDays.toString()}
                  onValueChange={(val) => setNewUserData({ ...newUserData, historyDays: parseInt(val, 10) })}
                >
                  <SelectTrigger className="h-9 font-mono text-xs bg-background/80 border-border/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="font-mono text-xs">
                    {DATE_RANGE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Behavior */}
              <div className="space-y-1.5">
                <FormLabel>Behavior</FormLabel>
                <Select
                  value={newUserData.behavior}
                  onValueChange={(val) => setNewUserData({ ...newUserData, behavior: val })}
                >
                  <SelectTrigger className="h-9 font-mono text-xs bg-background/80 border-border/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="font-mono text-xs">
                    {BEHAVIORS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button
                type="button"
                onClick={handlePreview}
                disabled={isPreviewing || isInjecting}
                variant="outline"
                className="h-9 font-mono text-xs font-semibold px-4"
              >
                {isPreviewing ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Play className="size-3.5 mr-1.5" />}
                Preview
              </Button>

              <Button
                type="button"
                onClick={handleCreateTestUser}
                disabled={isInjecting}
                className="h-9 font-mono text-xs font-semibold px-5"
              >
                {isInjecting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-1.5" />
                    Generating...
                  </>
                ) : (
                  <>
                    <UserPlus className="size-3.5 mr-1.5" />
                    Generate Test User(s)
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Test Datasets Manager */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <FormLabel>Active Test Datasets ({datasets.length})</FormLabel>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={fetchDatasets}
                className="h-7 font-mono text-[10px] text-muted-foreground"
              >
                <RefreshCw className="size-3 mr-1" />
                Refresh
              </Button>
            </div>

            {isLoadingDatasets ? (
              <div className="p-8 text-center text-xs font-mono text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="size-3.5 animate-spin" /> Loading datasets...
              </div>
            ) : datasets.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/50 p-6 text-center text-xs font-mono text-muted-foreground">
                No synthetic test datasets found. Click 'Generate Test User(s)' above to seed.
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 divide-y divide-border/40 overflow-hidden bg-card/40">
                {datasets.map((ds) => (
                  <div key={ds.id} className="p-3.5 flex items-center justify-between text-xs font-mono">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{ds.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border/40">
                          {ds.userCount} {ds.userCount === 1 ? 'user' : 'users'}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Profile: {ds.profile} • {ds.days}d history • Seed #{ds.seed}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDataset(ds.id)}
                      className="h-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 font-mono text-xs"
                    >
                      <Trash2 className="size-3.5 mr-1" />
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
