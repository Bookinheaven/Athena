const LoadingSpinner = ({ size = 'medium', text = 'Loading...' }) => {
  const sizeClasses = {
    small: 'w-5 h-5',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-1">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-t-transparent mb-4`}
           style={{
             borderColor: 'var(--color-border-secondary)',
             borderTopColor: 'var(--color-button-primary)'
           }}>
      </div>
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        {text}
      </p>
    </div>
  );
};

export default LoadingSpinner;