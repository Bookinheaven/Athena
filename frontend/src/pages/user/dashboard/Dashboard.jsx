import { useAuth } from '../../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            🧠 Athena Dashboard
          </h1>
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
            Welcome to your intelligent study tracking center
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* User Profile Card */}
          <div className="rounded-lg p-6 shadow-lg" style={{
            backgroundColor: 'var(--color-card-background)',
            border: '1px solid var(--color-card-border)'
          }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              👤 Profile
            </h3>
            <div className="space-y-2">
              <p className="text-sm">
                <span style={{ color: 'var(--color-text-secondary)' }}>Name:</span>{' '}
                <span style={{ color: 'var(--color-text-primary)' }}>{user?.fullName}</span>
              </p>
              <p className="text-sm">
                <span style={{ color: 'var(--color-text-secondary)' }}>Username:</span>{' '}
                <span style={{ color: 'var(--color-text-primary)' }}>{user?.username}</span>
              </p>
              <p className="text-sm">
                <span style={{ color: 'var(--color-text-secondary)' }}>Email:</span>{' '}
                <span style={{ color: 'var(--color-text-primary)' }}>{user?.email}</span>
              </p>
              <p className="text-sm">
                <span style={{ color: 'var(--color-text-secondary)' }}>Joined:</span>{' '}
                <span style={{ color: 'var(--color-text-primary)' }}>
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                </span>
              </p>
            </div>
          </div>

          {/* Study Stats Card */}
          <div className="rounded-lg p-6 shadow-lg" style={{
            backgroundColor: 'var(--color-card-background)',
            border: '1px solid var(--color-card-border)'
          }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              📊 Study Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>Study Sessions:</span>
                <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>0</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>Total Hours:</span>
                <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>0.0</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>Focus Score:</span>
                <span className="font-medium" style={{ color: 'var(--color-button-primary)' }}>--</span>
              </div>
            </div>
          </div>

          {/* Pattern Intelligence Card */}
          <div className="rounded-lg p-6 shadow-lg" style={{
            backgroundColor: 'var(--color-card-background)',
            border: '1px solid var(--color-card-border)'
          }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              🧠 Pattern Intelligence
            </h3>
            <div className="space-y-3">
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Start tracking your study sessions to unlock personalized insights and pattern analysis.
              </p>
              <button className="w-full py-2 px-4 rounded-md text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: 'var(--color-button-secondary)',
                        color: 'var(--color-button-secondary-text)'
                      }}>
                Start Study Session
              </button>
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className="rounded-lg p-6 shadow-lg md:col-span-2" style={{
            backgroundColor: 'var(--color-card-background)',
            border: '1px solid var(--color-card-border)'
          }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              📈 Recent Activity
            </h3>
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                No study sessions yet. Start your first session to see your activity here.
              </p>
            </div>
          </div>

          {/* Settings Card */}
          <div className="rounded-lg p-6 shadow-lg" style={{
            backgroundColor: 'var(--color-card-background)',
            border: '1px solid var(--color-card-border)'
          }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              ⚙️ Settings
            </h3>
            <div className="space-y-3">
              <button className="w-full py-2 px-4 rounded-md text-sm font-medium transition-colors text-left"
                      style={{
                        backgroundColor: 'var(--color-button-secondary)',
                        color: 'var(--color-button-secondary-text)'
                      }}>
                Profile Settings
              </button>
              <button className="w-full py-2 px-4 rounded-md text-sm font-medium transition-colors text-left"
                      style={{
                        backgroundColor: 'var(--color-button-secondary)',
                        color: 'var(--color-button-secondary-text)'
                      }}>
                Notification Preferences
              </button>
              <button 
                onClick={handleLogout}
                className="w-full py-2 px-4 rounded-md text-sm font-medium transition-colors text-left hover:opacity-80"
                style={{
                  backgroundColor: 'var(--color-button-danger)',
                  color: 'var(--color-button-primary-text)'
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="mt-8 text-center">
          <div className="rounded-lg p-6 shadow-lg" style={{
            backgroundColor: 'var(--color-background-secondary)',
            border: '1px solid var(--color-card-border)'
          }}>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Welcome to Athena, {user?.fullName?.split(' ')[0]}! 🎉
            </h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              You're now part of the intelligent study tracking revolution. 
              Athena will learn your patterns and help optimize your learning journey.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;