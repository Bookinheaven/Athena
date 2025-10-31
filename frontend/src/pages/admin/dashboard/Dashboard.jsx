import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';
import adminService from '../../../../services/adminService';
import { 
  Users, 
  UserPlus, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Home,
  Shield,
  Mail,
  Trash2,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  UserCheck,
  AlertCircle,
  Filter,
  Eye,
  ChevronRight,
  Zap,
  Edit,
  Timer,
  Coffee,
  Target,
  Calendar,
  BarChart3,
  ListTodo,
  FileText,
  Smile,
  Frown,
  Meh
} from 'lucide-react';

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [lastLoginUsers, setLastLoginUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [userSessions, setUserSessions] = useState([]);
  const [newUser, setNewUser] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    type: 'user',
  });
  const [editUser, setEditUser] = useState({
    _id: '',
    username: '',
    fullName: '',
    email: '',
    type: 'user',
  });
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Get user name from userId
  const getUserName = (userId) => {
    const foundUser = users.find(u => u._id === userId);
    return foundUser ? foundUser.fullName : 'Unknown User';
  };

  const fetchSessions = async () => {
    try {
      const data = await adminService.getSessions();
      if (data.success && Array.isArray(data.sessions)) {
        const transformedSessions = data.sessions.map(session => ({
          id: session._id,
          sessionId: session.sessionId,
          userId: session.userId,
          userName: getUserName(session.userId),
          title: session.title || 'Untitled Session',
          status: session.status,
          isDone: session.isDone,
          timestamp: session.timestamp,
          totalDuration: session.userSettings?.totalFocusDuration || 0,
          breakDuration: session.userSettings?.breakDuration || 0,
          breaksNumber: session.userSettings?.breaksNumber || 0,
          autoStartBreaks: session.userSettings?.autoStartBreaks || false,
          todos: session.userData?.todos || [],
          notes: session.userData?.notes || [],
          mood: session.sessionFeedback?.mood,
          focus: session.sessionFeedback?.focus,
          distractions: session.sessionFeedback?.distractions || '',
          history: session.history || []
        }));
        setUserSessions(transformedSessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await adminService.getUsers();
      if (data.success && Array.isArray(data.users)) {
        const filteredUsers = data.users.filter((u) => u._id !== user._id);
        
        const sortedUsers = filteredUsers.sort((a, b) => {
          const dateA = a?.lastLogin ? new Date(a.lastLogin).getTime() : 0;
          const dateB = b?.lastLogin ? new Date(b.lastLogin).getTime() : 0;
          return dateB - dateA;
        });
        const lastLoginUsers = sortedUsers.filter((u) => u?.lastLogin != null);
        setUsers(sortedUsers);
        setFilteredUsers(sortedUsers);
        // If you have a state for lastLoginUsers:
        setLastLoginUsers(lastLoginUsers);
      }
      console.log(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };



  useEffect(() => {
    if (!user || user.type !== 'admin') navigate('/login');
    else {
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
      alert('Please fill all required fields.');
      return;
    }

    try {
      const data = await adminService.addUsers(newUser);
      if (data.success) {
        alert('User added successfully');
        setNewUser({ username: '', fullName: '', email: '', password: '', type: 'user' });
        setShowAddUserModal(false);
        fetchUsers();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleEditUser = (u) => {
    setEditUser({
      _id: u._id,
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
      alert('Please fill all required fields.');
      return;
    }

    try {
      const data = await adminService.updateUser(editUser._id, {
        username: editUser.username,
        fullName: editUser.fullName,
        email: editUser.email,
        type: editUser.type,
      });
      
      if (data.success) {
        alert('User updated successfully');
        setShowEditUserModal(false);
        fetchUsers();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const data = await adminService.deleteUsers([id]);
      if (data.success) {
        alert('User deleted successfully');
        fetchUsers();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  const handleViewUser = (u) => {
    setSelectedUser(u);
    setShowUserDetails(true);
  };

  const handleViewSession = (session) => {
    setSelectedSession(session);
    setShowSessionDetails(true);
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMoodIcon = (mood) => {
    if (mood === 'happy') return <Smile className="text-green-500" size={20} />;
    if (mood === 'sad') return <Frown className="text-red-500" size={20} />;
    if (mood === 'neutral') return <Meh className="text-yellow-500" size={20} />;
    return null;
  };

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.isActive).length,
    verifiedEmails: users.filter((u) => u.isEmailVerified).length,
    totalFocusSessions: userSessions.length,
    activeFocusSessions: userSessions.filter((s) => s.status === 'active').length,
  };

  return (
    <div className="flex h-screen bg-background-color theme-transition overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-72' : 'w-20'
        } bg-card-background border-r border-card-border text-text-primary transition-all duration-500 ease-in-out flex flex-col shadow-lg theme-transition relative`}
      >
        {/* Sidebar Header */}
        <div className="p-6 flex items-center justify-between border-b border-card-border">
          <div className={`flex items-center gap-3 transition-all duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-button-primary to-text-accent rounded-xl flex items-center justify-center shadow-md">
              <Shield size={20} className="text-button-primary-text" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Admin Panel</h2>
              <p className="text-xs text-text-muted">Control Center</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-background-secondary rounded-lg transition-all duration-200 text-text-secondary hover:text-text-primary"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {[
            { id: 'dashboard', icon: Home, label: 'Dashboard', badge: null },
            { id: 'users', icon: Users, label: 'Users', badge: users.length },
            { id: 'user-sessions', icon: Timer, label: 'Focus Sessions', badge: stats.activeFocusSessions },
            { id: 'settings', icon: Settings, label: 'Settings', badge: null },
          ].map((item, index) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative ${
                activeTab === item.id
                  ? 'bg-background-secondary text-text-accent shadow-sm'
                  : 'hover:bg-background-secondary/50 text-text-secondary hover:text-text-primary'
              }`}
            >
              {activeTab === item.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-text-accent rounded-r-full"></div>
              )}
              <item.icon size={20} className={`${!sidebarOpen && 'mx-auto'}`} />
              {sidebarOpen && (
                <>
                  <span className="font-medium flex-1 text-left">{item.label}</span>
                  {item.badge !== null && (
                    <span className="bg-background-secondary text-text-muted px-2 py-0.5 rounded-md text-xs font-semibold">
                      {item.badge}
                    </span>
                  )}
                  {activeTab === item.id && (
                    <ChevronRight size={16} className="text-text-accent" />
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-card-border space-y-2">
          <div className={`flex items-center gap-3 p-3 bg-background-secondary/50 rounded-xl ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-text-accent to-button-primary rounded-xl flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-md">
              {user?.fullName?.charAt(0)}
            </div>
            {sidebarOpen && (
              <div className="flex-1 overflow-hidden">
                <p className="font-semibold text-sm text-text-primary truncate">{user?.fullName}</p>
                <p className="text-xs text-text-muted truncate">{user?.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 p-3 rounded-xl bg-button-danger/10 hover:bg-button-danger/20 text-button-danger transition-all duration-200 font-medium ${!sidebarOpen && 'justify-center'}`}
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <header className="bg-card-background border-b border-card-border p-6 theme-transition">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary mb-1">
                {activeTab === 'dashboard' && 'Dashboard Overview'}
                {activeTab === 'users' && 'User Management'}
                {activeTab === 'user-sessions' && 'Focus Sessions'}
                {activeTab === 'settings' && 'Settings'}
              </h1>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Clock size={14} />
                <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
            {activeTab === 'users' && (
              <button
                onClick={() => setShowAddUserModal(true)}
                className="flex items-center gap-2 bg-button-primary text-button-primary-text px-4 py-2.5 rounded-xl hover:bg-button-primary-hover transition-all duration-200 shadow-md hover:shadow-lg font-medium"
              >
                <UserPlus size={18} />
                <span>Add User</span>
              </button>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="h-full flex flex-col overflow-y-auto p-6 bg-background-color">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="h-full space-y-6 flex flex-col">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total Users', value: stats.totalUsers, icon: Users, gradient: 'from-blue-500 to-blue-600' },
                  { label: 'Active Users', value: stats.activeUsers, icon: UserCheck, gradient: 'from-green-500 to-green-600' },
                  { label: 'Focus Sessions', value: stats.totalFocusSessions, icon: Timer, gradient: 'from-purple-500 to-purple-600' },
                  { label: 'Active Sessions', value: stats.activeFocusSessions, icon: Target, gradient: 'from-orange-500 to-orange-600' },
                ].map((stat, index) => (
                  <div
                    key={stat.label}
                    className="bg-card-background p-6 rounded-2xl border border-card-border card-hover theme-transition group"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <stat.icon size={24} className="text-white" />
                      </div>
                      <TrendingUp className="text-button-success" size={18} />
                    </div>
                    <p className="text-text-secondary text-sm font-medium mb-1">{stat.label}</p>
                    <h3 className="text-3xl font-bold text-text-primary">{stat.value}</h3>
                  </div>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="h-full bg-card-background p-6 rounded-2xl border border-card-border theme-transition">
                <div className="flex items-center gap-2 mb-6">
                  <Zap size={22} className="text-text-accent" />
                  <h3 className="text-lg font-semibold text-text-primary">Recent Activity</h3>
                </div>
                <div className="space-y-3 overflow-y-auto">
                  {lastLoginUsers.map((u, index) => (
                    <div
                      key={u._id}
                      className="flex items-center gap-4 p-4 rounded-xl hover:bg-background-secondary/50 transition-all duration-200 border border-transparent hover:border-card-border"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-text-accent to-button-primary rounded-xl flex items-center justify-center text-white font-semibold shadow-md flex-shrink-0">
                        {u.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-text-primary">{u.fullName}</p>
                        <p className="text-xs text-text-muted">@{u.username}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          {u.isActive && (
                            <>
                              <span className="w-2 h-2 bg-button-success rounded-full animate-pulse"></span>
                              <span className="text-xs text-text-secondary font-medium">Online</span>
                            </>
                          )}
                        </div>
                        {u.lastLogin && (
                          <span className="text-xs text-text-muted">
                            {new Date(u.lastLogin).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Users Tab - Keep same as before */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="bg-card-background rounded-2xl border border-card-border theme-transition overflow-hidden">
                {/* Search and Filter Bar */}
                <div className="p-4 border-b border-card-border bg-background-secondary/30">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted" size={18} />
                      <input
                        type="text"
                        placeholder="Search by name, username, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-input-background border border-input-border text-text-primary rounded-xl focus:border-input-focus focus-ring-primary theme-transition text-sm"
                      />
                    </div>
                    <button className="flex items-center gap-2 bg-button-secondary text-button-secondary-text px-4 py-2.5 rounded-xl hover:bg-button-secondary-hover transition-all duration-200 text-sm font-medium">
                      <Filter size={18} />
                      <span>Filter</span>
                    </button>
                  </div>
                </div>

                {/* User Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-background-secondary/50 border-b border-card-border">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">User</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Type</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-card-border">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((u) => (
                          <tr key={u._id} className="hover:bg-background-secondary/30 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <div className="w-10 h-10 bg-gradient-to-br from-text-accent to-button-primary rounded-xl flex items-center justify-center text-white font-semibold shadow-md">
                                    {u.fullName.charAt(0).toUpperCase()}
                                  </div>
                                  {u.isActive && (
                                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-button-success border-2 border-card-background rounded-full"></span>
                                  )}
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-text-primary">{u.fullName}</div>
                                  <div className="text-xs text-text-muted">@{u.username}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Mail size={14} className="text-text-muted" />
                                <span className="text-sm text-text-primary">{u.email}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-3 py-1 inline-flex text-xs font-semibold rounded-lg ${
                                  u.type === 'admin'
                                    ? 'bg-text-athena/10 text-text-athena'
                                    : 'bg-text-accent/10 text-text-accent'
                                }`}
                              >
                                {u.type.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-2">
                                {u.isEmailVerified ? (
                                  <CheckCircle size={18} className="text-button-success" />
                                ) : (
                                  <XCircle size={18} className="text-button-danger" />
                                )}
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    u.isActive ? 'bg-button-success' : 'bg-text-muted'
                                  }`}
                                />
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleViewUser(u)}
                                  className="p-2 bg-text-accent/10 text-text-accent rounded-lg hover:bg-text-accent/20 transition-all duration-150"
                                  title="View Details"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => handleEditUser(u)}
                                  className="p-2 bg-blue-500/10 text-blue-600 rounded-lg hover:bg-blue-500/20 transition-all duration-150"
                                  title="Edit User"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u._id)}
                                  className="p-2 bg-button-danger/10 text-button-danger rounded-lg hover:bg-button-danger/20 transition-all duration-150"
                                  title="Delete User"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center py-12">
                            <AlertCircle size={40} className="text-text-muted mx-auto mb-2" />
                            <p className="text-text-muted font-medium">No users found</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* User Focus Sessions Tab */}
          {activeTab === 'user-sessions' && (
            <div className="space-y-6">
              <div className="bg-card-background p-6 rounded-2xl border border-card-border theme-transition">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Timer size={22} className="text-text-accent" />
                    <h3 className="text-lg font-semibold text-text-primary">Focus Sessions</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 bg-button-success/10 text-button-success rounded-lg text-sm font-semibold">
                      {userSessions.filter(s => s.status === 'active').length} Active
                    </span>
                    <span className="px-3 py-1.5 bg-text-muted/10 text-text-muted rounded-lg text-sm font-semibold">
                      {userSessions.filter(s => s.isDone).length} Completed
                    </span>
                  </div>
                </div>

                {userSessions.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {userSessions.map((session) => (
                      <div
                        key={session.id}
                        className="p-5 rounded-xl border border-card-border hover:bg-background-secondary/30 transition-all duration-200 cursor-pointer group"
                        onClick={() => handleViewSession(session)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-text-accent to-button-primary rounded-xl flex items-center justify-center text-white font-semibold shadow-md">
                              {session.userName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-text-primary">{session.userName}</p>
                              <p className="text-xs text-text-muted">{session.title}</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            session.status === 'active' ? 'bg-button-success/20 text-button-success' :
                            session.isDone ? 'bg-text-muted/20 text-text-muted' :
                            'bg-orange-500/20 text-orange-600'
                          }`}>
                            {session.status}
                          </span>
                        </div>

                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-3">
                            <div className="text-center p-2 bg-background-secondary/50 rounded-lg">
                              <p className="text-xs text-text-muted mb-1">Duration</p>
                              <p className="text-sm font-semibold text-text-primary">{formatDuration(session.totalDuration)}</p>
                            </div>
                            <div className="text-center p-2 bg-background-secondary/50 rounded-lg">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <Coffee size={12} className="text-text-muted" />
                                <p className="text-xs text-text-muted">Breaks</p>
                              </div>
                              <p className="text-sm font-semibold text-text-primary">{session.breaksNumber}</p>
                            </div>
                            <div className="text-center p-2 bg-background-secondary/50 rounded-lg">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <ListTodo size={12} className="text-text-muted" />
                                <p className="text-xs text-text-muted">Todos</p>
                              </div>
                              <p className="text-sm font-semibold text-text-primary">{session.todos.length}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-text-secondary">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {formatTimestamp(session.timestamp)}
                            </span>
                            {session.mood && getMoodIcon(session.mood)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Timer size={48} className="text-text-muted mx-auto mb-3" />
                    <p className="text-text-muted font-medium">No focus sessions found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-card-background p-6 rounded-2xl border border-card-border theme-transition">
              <div className="flex items-center gap-2 mb-4">
                <Settings size={22} className="text-text-accent" />
                <h3 className="text-lg font-semibold text-text-primary">System Settings</h3>
              </div>
              <p className="text-text-secondary">Settings panel coming soon...</p>
            </div>
          )}
        </div>
      </main>

      {/* Session Details Modal */}
      {showSessionDetails && selectedSession && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card-background rounded-2xl shadow-2xl w-full max-w-3xl theme-transition slide-up max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-card-border flex items-center justify-between sticky top-0 bg-card-background z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-text-accent/10 rounded-xl flex items-center justify-center">
                  <BarChart3 size={20} className="text-text-accent" />
                </div>
                <h2 className="text-xl font-semibold text-text-primary">Session Details</h2>
              </div>
              <button
                onClick={() => setShowSessionDetails(false)}
                className="p-2 hover:bg-background-secondary rounded-lg transition-all duration-150"
              >
                <X size={20} className="text-text-muted" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-text-accent to-button-primary rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {selectedSession.userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-text-primary">{selectedSession.userName}</h3>
                  <p className="text-text-muted">{selectedSession.title}</p>
                </div>
                <span className={`px-4 py-2 text-sm font-medium rounded-xl ${
                  selectedSession.status === 'active' ? 'bg-button-success/20 text-button-success' :
                  selectedSession.isDone ? 'bg-text-muted/20 text-text-muted' :
                  'bg-orange-500/20 text-orange-600'
                }`}>
                  {selectedSession.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-background-secondary/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Timer size={16} className="text-text-accent" />
                    <p className="text-xs text-text-muted font-medium">Total Duration</p>
                  </div>
                  <p className="text-lg font-bold text-text-primary">{formatDuration(selectedSession.totalDuration)}</p>
                </div>
                <div className="p-4 bg-background-secondary/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Coffee size={16} className="text-text-accent" />
                    <p className="text-xs text-text-muted font-medium">Break Duration</p>
                  </div>
                  <p className="text-lg font-bold text-text-primary">{formatDuration(selectedSession.breakDuration)}</p>
                </div>
                <div className="p-4 bg-background-secondary/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={16} className="text-text-accent" />
                    <p className="text-xs text-text-muted font-medium">Number of Breaks</p>
                  </div>
                  <p className="text-lg font-bold text-text-primary">{selectedSession.breaksNumber}</p>
                </div>
                <div className="p-4 bg-background-secondary/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={16} className="text-text-accent" />
                    <p className="text-xs text-text-muted font-medium">Started At</p>
                  </div>
                  <p className="text-sm font-bold text-text-primary">{formatTimestamp(selectedSession.timestamp)}</p>
                </div>
              </div>

              {/* Todos Section */}
              {selectedSession.todos && selectedSession.todos.length > 0 && (
                <div className="p-4 bg-background-secondary/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <ListTodo size={18} className="text-text-accent" />
                    <h4 className="text-sm font-semibold text-text-primary">Todos ({selectedSession.todos.length})</h4>
                  </div>
                  <div className="space-y-2">
                    {selectedSession.todos.map((todo, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-card-background rounded-lg">
                        <CheckCircle size={14} className={todo.completed ? 'text-button-success' : 'text-text-muted'} />
                        <span className={`text-sm ${todo.completed ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                          {todo.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes Section */}
              {selectedSession.notes && selectedSession.notes.length > 0 && (
                <div className="p-4 bg-background-secondary/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={18} className="text-text-accent" />
                    <h4 className="text-sm font-semibold text-text-primary">Notes ({selectedSession.notes.length})</h4>
                  </div>
                  <div className="space-y-2">
                    {selectedSession.notes.map((note, index) => (
                      <div key={index} className="p-3 bg-card-background rounded-lg">
                        <p className="text-sm text-text-primary whitespace-pre-wrap">{note.content || note.text || note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback Section */}
              {(selectedSession.mood || selectedSession.focus || selectedSession.distractions) && (
                <div className="p-4 bg-background-secondary/50 rounded-xl">
                  <h4 className="text-sm font-semibold text-text-primary mb-3">Session Feedback</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedSession.mood && (
                      <div className="flex items-center gap-2">
                        {getMoodIcon(selectedSession.mood)}
                        <span className="text-sm text-text-primary capitalize">{selectedSession.mood}</span>
                      </div>
                    )}
                    {selectedSession.focus && (
                      <div className="flex items-center gap-2">
                        <Target size={16} className="text-text-accent" />
                        <span className="text-sm text-text-primary">Focus: {selectedSession.focus}/5</span>
                      </div>
                    )}
                    {selectedSession.distractions && (
                      <div className="col-span-3 mt-2">
                        <p className="text-xs text-text-muted mb-1">Distractions:</p>
                        <p className="text-sm text-text-primary">{selectedSession.distractions}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowSessionDetails(false)}
                className="w-full bg-button-primary text-button-primary-text px-4 py-2.5 rounded-xl hover:bg-button-primary-hover transition-all duration-150 font-medium shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card-background rounded-2xl shadow-2xl w-full max-w-md theme-transition slide-up">
            <div className="p-6 border-b border-card-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-text-accent/10 rounded-xl flex items-center justify-center">
                  <UserPlus size={20} className="text-text-accent" />
                </div>
                <h2 className="text-xl font-semibold text-text-primary">Add New User</h2>
              </div>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="p-2 hover:bg-background-secondary rounded-lg transition-all duration-150"
              >
                <X size={20} className="text-text-muted" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Username</label>
                <input
                  type="text"
                  placeholder="Enter username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full bg-input-background border border-input-border text-text-primary rounded-xl px-4 py-2.5 focus:border-input-focus focus-ring-primary theme-transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Full Name</label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  className="w-full bg-input-background border border-input-border text-text-primary rounded-xl px-4 py-2.5 focus:border-input-focus focus-ring-primary theme-transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Email</label>
                <input
                  type="email"
                  placeholder="Enter email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-input-background border border-input-border text-text-primary rounded-xl px-4 py-2.5 focus:border-input-focus focus-ring-primary theme-transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Password</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full bg-input-background border border-input-border text-text-primary rounded-xl px-4 py-2.5 focus:border-input-focus focus-ring-primary theme-transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">User Type</label>
                <select
                  value={newUser.type}
                  onChange={(e) => setNewUser({ ...newUser, type: e.target.value })}
                  className="w-full bg-input-background border border-input-border text-text-primary rounded-xl px-4 py-2.5 focus:border-input-focus focus-ring-primary theme-transition"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 bg-button-secondary text-button-secondary-text px-4 py-2.5 rounded-xl hover:bg-button-secondary-hover transition-all duration-150 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-button-primary text-button-primary-text px-4 py-2.5 rounded-xl hover:bg-button-primary-hover transition-all duration-150 font-medium shadow-md"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card-background rounded-2xl shadow-2xl w-full max-w-md theme-transition slide-up">
            <div className="p-6 border-b border-card-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Edit size={20} className="text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-text-primary">Edit User</h2>
              </div>
              <button
                onClick={() => setShowEditUserModal(false)}
                className="p-2 hover:bg-background-secondary rounded-lg transition-all duration-150"
              >
                <X size={20} className="text-text-muted" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Username</label>
                <input
                  type="text"
                  placeholder="Enter username"
                  value={editUser.username}
                  onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
                  className="w-full bg-input-background border border-input-border text-text-primary rounded-xl px-4 py-2.5 focus:border-input-focus focus-ring-primary theme-transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Full Name</label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={editUser.fullName}
                  onChange={(e) => setEditUser({ ...editUser, fullName: e.target.value })}
                  className="w-full bg-input-background border border-input-border text-text-primary rounded-xl px-4 py-2.5 focus:border-input-focus focus-ring-primary theme-transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Email</label>
                <input
                  type="email"
                  placeholder="Enter email"
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  className="w-full bg-input-background border border-input-border text-text-primary rounded-xl px-4 py-2.5 focus:border-input-focus focus-ring-primary theme-transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">User Type</label>
                <select
                  value={editUser.type}
                  onChange={(e) => setEditUser({ ...editUser, type: e.target.value })}
                  className="w-full bg-input-background border border-input-border text-text-primary rounded-xl px-4 py-2.5 focus:border-input-focus focus-ring-primary theme-transition"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="bg-background-secondary/50 p-3 rounded-lg">
                <p className="text-xs text-text-muted">
                  <strong>Note:</strong> Password cannot be changed through this form. User must reset it separately.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditUserModal(false)}
                  className="flex-1 bg-button-secondary text-button-secondary-text px-4 py-2.5 rounded-xl hover:bg-button-secondary-hover transition-all duration-150 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-button-primary text-button-primary-text px-4 py-2.5 rounded-xl hover:bg-button-primary-hover transition-all duration-150 font-medium shadow-md"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card-background rounded-2xl shadow-2xl w-full max-w-lg theme-transition slide-up">
            <div className="p-6 border-b border-card-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-text-accent/10 rounded-xl flex items-center justify-center">
                  <Eye size={20} className="text-text-accent" />
                </div>
                <h2 className="text-xl font-semibold text-text-primary">User Details</h2>
              </div>
              <button
                onClick={() => setShowUserDetails(false)}
                className="p-2 hover:bg-background-secondary rounded-lg transition-all duration-150"
              >
                <X size={20} className="text-text-muted" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-text-accent to-button-primary rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {selectedUser.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text-primary">{selectedUser.fullName}</h3>
                  <p className="text-text-muted">@{selectedUser.username}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-background-secondary/50 rounded-xl">
                  <p className="text-xs text-text-muted mb-1 font-medium">Email</p>
                  <p className="text-sm font-semibold text-text-primary">{selectedUser.email}</p>
                </div>
                <div className="p-4 bg-background-secondary/50 rounded-xl">
                  <p className="text-xs text-text-muted mb-1 font-medium">User Type</p>
                  <p className="text-sm font-semibold text-text-primary capitalize">{selectedUser.type}</p>
                </div>
                <div className="p-4 bg-background-secondary/50 rounded-xl">
                  <p className="text-xs text-text-muted mb-1 font-medium">Email Status</p>
                  <p className={`text-sm font-semibold ${selectedUser.isEmailVerified ? 'text-button-success' : 'text-button-danger'}`}>
                    {selectedUser.isEmailVerified ? 'Verified' : 'Not Verified'}
                  </p>
                </div>
                <div className="p-4 bg-background-secondary/50 rounded-xl">
                  <p className="text-xs text-text-muted mb-1 font-medium">Account Status</p>
                  <p className={`text-sm font-semibold ${selectedUser.isActive ? 'text-button-success' : 'text-button-danger'}`}>
                    {selectedUser.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowUserDetails(false);
                    handleEditUser(selectedUser);
                  }}
                  className="flex-1 bg-button-secondary text-button-secondary-text px-4 py-2.5 rounded-xl hover:bg-button-secondary-hover transition-all duration-150 font-medium flex items-center justify-center gap-2"
                >
                  <Edit size={18} />
                  Edit User
                </button>
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="flex-1 bg-button-primary text-button-primary-text px-4 py-2.5 rounded-xl hover:bg-button-primary-hover transition-all duration-150 font-medium shadow-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

