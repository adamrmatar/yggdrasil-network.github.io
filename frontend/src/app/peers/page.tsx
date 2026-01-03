'use client';

import { useEffect, useState } from 'react';
import { 
  Users, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  UserPlus,
  Trash2
} from 'lucide-react';
import { getPeers, type Peer } from '@/lib/api';

export default function PeersPage() {
  const [peers, setPeers] = useState<Peer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    let cancelled = false;

    const fetchPeers = async () => {
      try {
        const result = await getPeers();
        if (!cancelled) {
          setPeers(result.peers);
          setError(null);
          setIsLoading(false);
          setLastUpdate(new Date());
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch peers');
          setIsLoading(false);
        }
      }
    };

    // Initial fetch
    fetchPeers();

    // Poll every 2 seconds
    const interval = setInterval(fetchPeers, 2000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatBytes = (bytes: number): string => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-light text-slate-900 mb-2">
                Peers
              </h1>
              <p className="text-slate-600">
                Manage your Yggdrasil network peers and connections
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <RefreshCw className="w-3 h-3" />
                <span>Updated {lastUpdate.toLocaleTimeString()}</span>
              </div>
              <button
                onClick={() => alert('Manual peer addition coming soon!')}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Peer</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Total Peers</h3>
              <Users className="w-5 h-5 text-slate-400" />
            </div>
            <div className="text-3xl font-light text-slate-900">
              {peers.length}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Active Connections</h3>
              <Activity className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-3xl font-light text-emerald-600">
              {peers.length}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Avg Uptime</h3>
              <TrendingUp className="w-5 h-5 text-slate-400" />
            </div>
            <div className="text-3xl font-light text-slate-900">
              {peers.length > 0
                ? formatUptime(
                    peers.reduce((sum, p) => sum + p.uptime, 0) / peers.length
                  )
                : '0m'}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
            <div className="animate-pulse text-slate-400">
              Loading peers...
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Peer List */}
        {!isLoading && !error && peers.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-medium text-slate-900">
                Connected Peers
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Port
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Uptime
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Traffic
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {peers.map((peer, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-mono text-sm text-slate-900">
                          {peer.address}
                        </div>
                        <div className="font-mono text-xs text-slate-500 mt-1">
                          {peer.key.substring(0, 16)}...
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-700">
                          {peer.port}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-700">
                          {formatUptime(peer.uptime)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="flex items-center space-x-2 text-slate-600">
                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                            <span>{formatBytes(peer.bytes_sent || 0)}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-slate-600 mt-1">
                            <TrendingDown className="w-3 h-3 text-blue-500" />
                            <span>{formatBytes(peer.bytes_recv || 0)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                          <span className="text-xs text-emerald-600 font-medium">
                            Active
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => alert('Peer removal coming soon!')}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                          title="Remove peer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && peers.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No Peers Connected
            </h3>
            <p className="text-slate-600 mb-6">
              Add a peer to start building your mesh network
            </p>
            <button
              onClick={() => alert('Bootstrap or manual peer addition coming soon!')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 px-6 rounded-lg transition-colors inline-flex items-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Peer</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
