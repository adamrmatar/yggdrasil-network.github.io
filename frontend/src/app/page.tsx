'use client';

import { useEffect, useState } from 'react';
import StatusCard from '@/components/StatusCard';

interface ApiStatus {
  status: string;
  yggdrasil_socket: string;
  socket_path: string;
  backend_version: string;
}

export default function DashboardPage() {
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/status');
        if (!response.ok) {
          throw new Error('Failed to fetch status');
        }
        const data = await response.json();
        setApiStatus(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    
    // Poll every 5 seconds
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-light text-slate-900 mb-2">
          Dashboard
        </h1>
        <p className="text-slate-600">
          Monitor your Yggdrasil node status and connectivity
        </p>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="animate-pulse text-slate-400">
              Loading...
            </div>
          </div>
        ) : error ? (
          <div className="col-span-full">
            <StatusCard
              title="Connection Error"
              status="error"
              details={error}
            />
          </div>
        ) : (
          <>
            <StatusCard
              title="Backend API"
              status={apiStatus?.status === 'ok' ? 'active' : 'inactive'}
              details={`Version ${apiStatus?.backend_version || 'unknown'}`}
            />
            
            <StatusCard
              title="Yggdrasil Node"
              status={apiStatus?.yggdrasil_socket === 'connected' ? 'active' : 'inactive'}
              details={apiStatus?.socket_path || 'No socket path'}
            />

            {/* Welcome Card */}
            <div className="col-span-full bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-medium text-slate-900 mb-3">
                Welcome to Yggdrasil Commander
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Your sovereign network management interface is ready. This dashboard provides
                a clean, minimal interface to manage your Yggdrasil node without compromising
                on control or privacy.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  Full stack connection: <span className="font-mono text-emerald-600">verified</span>
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
