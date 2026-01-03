'use client';

import { useEffect, useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Users, 
  Share2, 
  UserPlus,
  Activity,
  Network,
  RefreshCw
} from 'lucide-react';
import StatusCard from '@/components/StatusCard';
import Wizard from '@/components/Wizard';
import InviteModal from '@/components/InviteModal';
import { getStatus, getNodeInfo, getPeers, type NodeInfo, type Peer } from '@/lib/api';

export default function DashboardPage() {
  // State
  const [nodeInfo, setNodeInfo] = useState<NodeInfo | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Polling logic
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        // Fetch node info and peers in parallel
        const [nodeData, peersData] = await Promise.all([
          getNodeInfo(),
          getPeers(),
        ]);

        if (!cancelled) {
          setNodeInfo(nodeData);
          setPeers(peersData.peers);
          setError(null);
          setIsLoading(false);
          setLastUpdate(new Date());

          // Show wizard if no peers connected
          if (peersData.peers.length === 0 && !showWizard) {
            setShowWizard(true);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch data');
          setIsLoading(false);
        }
      }
    };

    // Initial fetch
    fetchData();

    // Poll every 2 seconds
    const interval = setInterval(fetchData, 2000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [showWizard]);

  const handleWizardComplete = () => {
    setShowWizard(false);
    // Force immediate refresh
    window.location.reload();
  };

  const isOnline = peers.length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-light text-slate-900">
              Dashboard
            </h1>
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <RefreshCw className="w-3 h-3" />
              <span>Updated {lastUpdate.toLocaleTimeString()}</span>
            </div>
          </div>
          <p className="text-slate-600">
            Monitor your Yggdrasil node status and connectivity
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-slate-400">
              Loading...
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="mb-6">
            <StatusCard
              title="Connection Error"
              status="error"
              details={error}
            />
          </div>
        )}

        {/* Main Content */}
        {!isLoading && !error && (
          <>
            {/* Connection Status Hero */}
            <div className="mb-8">
              <div className={`
                relative overflow-hidden rounded-2xl p-8
                ${isOnline 
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' 
                  : 'bg-gradient-to-br from-slate-700 to-slate-800'
                }
              `}>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {isOnline ? (
                        <Wifi className="w-8 h-8 text-white" />
                      ) : (
                        <WifiOff className="w-8 h-8 text-white/80" />
                      )}
                      <div>
                        <h2 className="text-2xl font-medium text-white">
                          {isOnline ? 'Online' : 'Offline'}
                        </h2>
                        <p className="text-white/80">
                          {isOnline 
                            ? `Connected to ${peers.length} peer${peers.length !== 1 ? 's' : ''}`
                            : 'Not connected to the mesh'
                          }
                        </p>
                      </div>
                    </div>

                    {isOnline && (
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                        <span className="text-white/90 text-sm font-medium">
                          Active
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Node Address */}
                  {nodeInfo && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                      <p className="text-white/70 text-xs mb-1">Your IPv6 Address</p>
                      <p className="text-white font-mono text-sm break-all">
                        {nodeInfo.address}
                      </p>
                    </div>
                  )}
                </div>

                {/* Decorative circles */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
              </div>
            </div>

            {/* Action Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => setShowInviteModal(true)}
                disabled={!isOnline}
                className="flex items-center justify-center space-x-3 bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:cursor-not-allowed border border-slate-200 rounded-lg py-4 px-6 transition-colors group"
              >
                <Share2 className="w-5 h-5 text-emerald-500 group-disabled:text-slate-400" />
                <span className="font-medium text-slate-700 group-disabled:text-slate-400">
                  Share Invite
                </span>
              </button>

              <button
                onClick={() => alert('Manual peer addition coming soon!')}
                className="flex items-center justify-center space-x-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg py-4 px-6 transition-colors group"
              >
                <UserPlus className="w-5 h-5 text-slate-500" />
                <span className="font-medium text-slate-700">
                  Add Peer
                </span>
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <StatusCard
                title="Node Status"
                status={isOnline ? 'active' : 'inactive'}
                details={nodeInfo?.coords || 'No coordinates'}
              />

              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-slate-900">
                    Connected Peers
                  </h3>
                  <Users className="w-5 h-5 text-slate-400" />
                </div>
                <div className="text-3xl font-light text-slate-900 mb-2">
                  {peers.length}
                </div>
                <p className="text-sm text-slate-600">
                  {isOnline ? 'Active connections' : 'No connections'}
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-slate-900">
                    Public Key
                  </h3>
                  <Network className="w-5 h-5 text-slate-400" />
                </div>
                <div className="font-mono text-xs text-slate-700 break-all">
                  {nodeInfo?.key.substring(0, 32)}...
                </div>
                <p className="text-sm text-slate-600 mt-2">
                  Node identifier
                </p>
              </div>
            </div>

            {/* Peer List */}
            {peers.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-slate-200">
                  <div className="flex items-center space-x-3">
                    <Activity className="w-5 h-5 text-slate-400" />
                    <h3 className="text-lg font-medium text-slate-900">
                      Active Peers
                    </h3>
                  </div>
                </div>
                <div className="divide-y divide-slate-200">
                  {peers.map((peer, index) => (
                    <div key={index} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-mono text-sm text-slate-900 mb-1">
                            {peer.address}
                          </p>
                          <p className="text-xs text-slate-500">
                            Port: {peer.port} • Uptime: {Math.floor(peer.uptime / 60)}m
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                          <span className="text-xs text-emerald-600 font-medium">
                            Connected
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {peers.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
                <WifiOff className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No Peers Connected
                </h3>
                <p className="text-slate-600 mb-6">
                  Connect to the public mesh to start routing
                </p>
                <button
                  onClick={() => setShowWizard(true)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  Get Started
                </button>
              </div>
            )}
          </>
        )}

        {/* Modals */}
        {showWizard && <Wizard onComplete={handleWizardComplete} />}
        <InviteModal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} />
      </div>
    </div>
  );
}
