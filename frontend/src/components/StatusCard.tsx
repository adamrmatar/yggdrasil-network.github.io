interface StatusCardProps {
  title: string;
  status: 'active' | 'inactive' | 'error';
  details?: string;
}

export default function StatusCard({ title, status, details }: StatusCardProps) {
  const statusConfig = {
    active: {
      color: 'emerald',
      label: 'Active',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      dotColor: 'bg-emerald-500',
    },
    inactive: {
      color: 'slate',
      label: 'Inactive',
      bgColor: 'bg-slate-50',
      textColor: 'text-slate-700',
      dotColor: 'bg-slate-400',
    },
    error: {
      color: 'red',
      label: 'Error',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      dotColor: 'bg-red-500',
    },
  };

  const config = statusConfig[status];

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-slate-900">
          {title}
        </h3>
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${config.bgColor}`}>
          <span className={`w-2 h-2 rounded-full ${config.dotColor} animate-pulse`} />
          <span className={`text-sm font-medium ${config.textColor}`}>
            {config.label}
          </span>
        </div>
      </div>
      
      {details && (
        <p className="text-sm text-slate-600 font-mono">
          {details}
        </p>
      )}
    </div>
  );
}
