'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  Info,
  Loader2,
  Check,
  X
} from 'lucide-react';
import { setExitNode, getStatus } from '@/lib/api';

export default function SettingsPage() {
  const [exitNodeEnabled, setExitNodeEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load initial state
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // In a real implementation, we'd have an endpoint that returns config state
      // For now, we'll assume it's disabled by default
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load settings');
      setIsLoading(false);
    }
  };

  const handleExitNodeToggle = async (enabled: boolean) => {
    // Optimistic UI update
    setExitNodeEnabled(enabled);
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await setExitNode(enabled);
      
      if (result.reload_success) {
        setSuccess(
          enabled 
            ? 'Exit node enabled successfully' 
            : 'Exit node disabled successfully'
        );
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error('Failed to reload Yggdrasil configuration');
      }
    } catch (err) {
      // Revert optimistic update on error
      setExitNodeEnabled(!enabled);
      setError(err instanceof Error ? err.message : 'Failed to update exit node settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-slate-900 mb-2">
            Settings
          </h1>
          <p className="text-slate-600">
            Configure your Yggdrasil node and interface preferences
          </p>
        </div>

        {/* Exit Node Card */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-slate-600" />
              <div>
                <h2 className="text-xl font-medium text-slate-900">
                  Exit Node (VPN Gateway)
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Allow other mesh devices to route internet traffic through this node
                </p>
              </div>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-6">
            {/* Status Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start space-x-3">
                <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-700">{success}</p>
              </div>
            )}

            {/* Toggle Switch */}
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-200">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-slate-900 mb-1">
                  Enable Exit Node
                </h3>
                <p className="text-sm text-slate-600">
                  Route `::/0` (all IPv6 traffic) through this node
                </p>
              </div>

              {/* Toggle */}
              <button
                onClick={() => handleExitNodeToggle(!exitNodeEnabled)}
                disabled={isSaving || isLoading}
                className={`
                  relative inline-flex h-8 w-14 items-center rounded-full
                  transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${exitNodeEnabled ? 'bg-emerald-500' : 'bg-slate-300'}
                `}
              >
                <span
                  className={`
                    inline-block h-6 w-6 transform rounded-full bg-white shadow-lg
                    transition-transform duration-200
                    ${exitNodeEnabled ? 'translate-x-7' : 'translate-x-1'}
                  `}
                >
                  {isSaving && (
                    <Loader2 className="w-4 h-4 text-slate-400 animate-spin m-1" />
                  )}
                </span>
              </button>
            </div>

            {/* Warning Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-amber-900 mb-2">
                    Important Considerations
                  </h4>
                  <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                    <li>Your IP address will be visible to other mesh users</li>
                    <li>You may be liable for traffic routed through your connection</li>
                    <li>Check your ISP's terms of service before enabling</li>
                    <li>Monitor your bandwidth usage regularly</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-slate-900 mb-2">
                    How Exit Nodes Work
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    When enabled, your node advertises a route to `::/0` (all IPv6 addresses).
                    Other Yggdrasil nodes can then configure their routing to send internet-bound
                    traffic through your node, using it as a VPN gateway. This is useful for:
                  </p>
                  <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside mt-2 ml-2">
                    <li>Sharing your internet connection with trusted peers</li>
                    <li>Providing secure routing for remote devices</li>
                    <li>Building sovereign VPN infrastructure</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Current Status */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">Current Status</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {exitNodeEnabled 
                      ? 'Advertising ::/0 to the mesh' 
                      : 'Not advertising any routes'
                    }
                  </p>
                </div>
                <div className={`
                  px-3 py-1 rounded-full text-xs font-medium
                  ${exitNodeEnabled 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-slate-100 text-slate-700'
                  }
                `}>
                  {exitNodeEnabled ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Settings Placeholder */}
        <div className="mt-6 bg-white border border-slate-200 rounded-lg p-12 text-center">
          <p className="text-slate-400 text-lg">
            Additional configuration options coming soon
          </p>
        </div>
      </div>
    </div>
  );
}
