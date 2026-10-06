import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';
import adminService from '../../../../services/adminService';
import toast from 'react-hot-toast';
import { Clock, UserPlus, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Extracted Components
import { SessionDetailModal } from '../../../features/admin/components/SessionDetailModal';
import { UserDetailModal } from '../../../features/admin/components/UserDetailModal';
import { UserFormModal } from '../../../features/admin/components/UserFormModal';
import { AdminSidebar } from '../../../features/admin/components/AdminSidebar';

// Tabs
import { OverviewTab } from '../../../features/admin/tabs/OverviewTab';
import { UsersTab } from '../../../features/admin/tabs/UsersTab';
import { SessionsTab } from '../../../features/admin/tabs/SessionsTab';
import { SettingsTab } from '../../../features/admin/tabs/SettingsTab';
import { DeveloperDataTab } from '../../../features/admin/tabs/DeveloperDataTab';

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [lastLoginUsers, setLastLoginUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Modals state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [devDataTargetUserId, setDevDataTargetUserId] = useState(null);
  
  // Data state
  const [userSessions, setUserSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newUser, setNewUser] = useState({
    username: '', fullName: '', email: '', password: '', type: 'user',
  });
  const [editUser, setEditUser] = useState({
    id: '', username: '', fullName: '', email: '', type: 'user',
  });

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [rawUsers, setRawUsers] = useState([]);
  const [addUserError, setAddUserError] = useState('');

  const getUserName = (userId, apiProvidedName) => {
    if (apiProvidedName && apiProvidedName !== 'Unknown User') return apiProvidedName;
    const foundUser = rawUsers.find((u) => (u.id || u._id) === userId) || users.find((u) => (u.id || u._id) === userId);
    if (foundUser) return foundUser.fullName || foundUser.username;
    if (user && (user.id === userId || user._id === userId)) return user.fullName || user.username;
    return apiProvidedName || 'Unknown User';
  };

  const fetchSessions = async (fallbackPool = []) => {
    try {
      const data = await adminService.getSessions();
      if (data.success && Array.isArray(data.sessions)) {
        const pool = fallbackPool.length > 0 ? fallbackPool : rawUsers;
        const transformedSessions = data.sessions.map((session) => {
          let resolvedName = session.userName;
          if (!resolvedName || resolvedName === 'Unknown User') {
            const found = pool.find((u) => (u.id || u._id) === session.userId);
            if (found) resolvedName = found.fullName || found.username;
            else if (user && (user.id === session.userId || user._id === session.userId)) {
              resolvedName = user.fullName || user.username;
            }
          }

          const duration = session.durationSeconds || (session.totalFocusMinutes ? session.totalFocusMinutes * 60 : 0) || session.plannedDurationSeconds || session.userSettings?.totalFocusDuration || session.totalDuration || 0;
          const breakDuration = (session.totalBreakMinutes ? session.totalBreakMinutes * 60 : 0) || session.userSettings?.breakDuration || session.breakDuration || 0;
          const breaksNumber = session.breakSegmentsCompleted || session.breaksNumber || session.userSettings?.breaksNumber || 0;
          const isDone = session.status === 'completed' || session.completionType === 'completed' || session.isDone;
          const timestamp = session.startedAt || session.createdAt || session.timestamp;

          let todos = [];
          if (Array.isArray(session.todos)) {
            todos = session.todos;
          } else if (typeof session.todos === 'string') {
            try { todos = JSON.parse(session.todos); } catch (e) { todos = []; }
          } else if (Array.isArray(session.userData?.todos)) {
            todos = session.userData.todos;
          }

          return {
            id: session.id || session._id,
            sessionId: session.clientSessionId || session.sessionId,
            userId: session.userId,
            userName: resolvedName || 'Unknown User',
            userEmail: session.userEmail || '',
            title: session.title || 'Focus Session',
            status: session.status || 'completed',
            completionType: session.completionType,
            isDone,
            timestamp,
            totalDuration: duration,
            breakDuration,
            breaksNumber,
            autoStartBreaks: session.userSettings?.autoStartBreaks || false,
            todos,
            notes: session.notes || session.userData?.notes || '',
            mood: session.mood || session.sessionFeedback?.mood || 'neutral',
            focus: session.focus || session.sessionFeedback?.focus || 4,
            distractions: session.distractions || session.sessionFeedback?.distractions || '',
            history: session.history || [],
          };
        });
        setUserSessions(transformedSessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getUsers();
      if (data.success && Array.isArray(data.users)) {
        setRawUsers(data.users);
        const fUsers = data.users.filter((u) => (u.id || u._id) !== user.id);
        const sortedUsers = fUsers.sort((a, b) => {
          const dateA = a?.lastLogin ? new Date(a.lastLogin).getTime() : 0;
          const dateB = b?.lastLogin ? new Date(b.lastLogin).getTime() : 0;
          return dateB - dateA;
        });
        const lastLogin = sortedUsers.filter((u) => u?.lastLogin != null);
        setUsers(sortedUsers);
        setFilteredUsers(sortedUsers);
        setLastLoginUsers(lastLogin);
        fetchSessions(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const role = user?.accountType || user?.type;
    if (user && role !== 'admin') {
      navigate('/dashboard');
    } else if (user && role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  useEffect(() => {
    if (users.length > 0) {
      fetchSessions();
    }
  }, [users]);

  useEffect(() => {
    const filtered = users.filter(
      (u) =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.fullName || !newUser.email || !newUser.password) {
      toast.error('Please fill all required fields.');
      return;
    }

    try {
      setAddUserError('');
      const data = await adminService.addUsers(newUser);
      if (data.success) {
        toast.success('User added successfully');
        setNewUser({ username: '', fullName: '', email: '', password: '', type: 'user' });
        setShowAddUserModal(false);
        fetchUsers();
      } else {
        const msg = data.message || 'Failed to add user';
        toast.error(msg);
        setAddUserError(msg);
      }
    } catch (error) {
      console.error('Error adding user:', error);
      const msg = error.message || 'Failed to add user';
      toast.error(msg);
      setAddUserError(msg);
    }
  };

  const handleEditUser = (u) => {
    setEditUser({
      id: u.id || u._id,
      username: u.username,
      fullName: u.fullName,
      email: u.email,
      type: u.type,
    });
    setShowEditUserModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editUser.username || !editUser.fullName || !editUser.email) {
      toast.error('Please fill all required fields.');
      return;
    }

    try {
      const data = await adminService.updateUser(editUser.id, {
        username: editUser.username,
        fullName: editUser.fullName,
        email: editUser.email,
        type: editUser.type,
      });

      if (data.success) {
        toast.success('User updated successfully');
        setShowEditUserModal(false);
        fetchUsers();
      } else {
        toast.error(data.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    try {
      const data = await adminService.deleteUsers([id]);
      if (data.success) {
        toast.success('User deleted');
        fetchUsers();
      } else {
        toast.error(data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const stats = useMemo(() => ({
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.isActive).length,
    verifiedEmails: users.filter((u) => u.isEmailVerified).length,
    totalFocusSessions: userSessions.length,
    activeFocusSessions: userSessions.filter((s) => s.status === 'active').length,
  }), [users, userSessions]);

  const tabTitles = {
    dashboard: 'Overview',
    users: 'User Management',
    'user-sessions': 'Focus Sessions',
    settings: 'Settings',
    'developer-data': 'Developer Data',
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-background text-foreground">
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        usersCount={users.length}
      />

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-hidden relative">
        {/* Header */}
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/30 bg-card/50 backdrop-blur-xl px-6 z-10">
          {/* breadcrumb */}
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <Terminal className="size-3.5 text-muted-foreground/50" />
            <span className="text-muted-foreground/50">admin</span>
            <span className="text-muted-foreground/30">/</span>
            <span className="text-foreground font-bold">{tabTitles[activeTab]?.toLowerCase()}</span>
          </div>

          {/* right actions */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 font-mono text-[9px] text-muted-foreground/40 uppercase tracking-widest">
              <Clock className="size-3" />
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
            {activeTab === 'users' && (
              <Button size="sm" onClick={() => setShowAddUserModal(true)}
                className="h-7 gap-1.5 px-3 font-mono text-[11px] rounded-lg shadow-primary/20 hover:shadow-primary/30">
                <UserPlus className="size-3.5" />
                new user
              </Button>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {activeTab === 'dashboard' && (
            <OverviewTab
              stats={stats}
              lastLoginUsers={lastLoginUsers}
              fetchUsers={fetchUsers}
            />
          )}

          {activeTab === 'users' && (
            <UsersTab
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filteredUsers={filteredUsers}
              setSelectedUser={setSelectedUser}
              setShowUserDetails={setShowUserDetails}
              handleEditUser={handleEditUser}
              handleDeleteUser={handleDeleteUser}
            />
          )}

          {activeTab === 'user-sessions' && (
            <SessionsTab
              userSessions={userSessions}
              setSelectedSession={setSelectedSession}
              setShowSessionDetails={setShowSessionDetails}
            />
          )}

          {activeTab === 'settings' && <SettingsTab />}
          {activeTab === 'developer-data' && <DeveloperDataTab targetUserId={devDataTargetUserId} />}
        </div>
      </main>

      {/* ── Modals ─────────────────────────────────────────── */}
      <SessionDetailModal
        session={selectedSession}
        open={showSessionDetails}
        onClose={() => setShowSessionDetails(false)}
      />
      <UserDetailModal
        user={selectedUser}
        open={showUserDetails}
        onClose={() => setShowUserDetails(false)}
        onEdit={handleEditUser}
        onNavigateToDevData={(uid) => {
          setDevDataTargetUserId(uid);
          setActiveTab('developer-data');
        }}
      />
      <UserFormModal
        open={showAddUserModal}
        onClose={() => {
          setShowAddUserModal(false);
          setAddUserError('');
        }}
        onSubmit={handleAddUser}
        formData={newUser}
        setFormData={setNewUser}
        isEdit={false}
        formError={addUserError}
        setFormError={setAddUserError}
      />
      <UserFormModal
        open={showEditUserModal}
        onClose={() => setShowEditUserModal(false)}
        onSubmit={handleUpdateUser}
        formData={editUser}
        setFormData={setEditUser}
        isEdit={true}
      />
    </div>
  );
};

export default Dashboard;
