'use client';

import { useState } from 'react';
import { Sparkles, Globe, Key, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { bootstrap } from '@/lib/api';

interface WizardProps {
  onComplete: () => void;
}

export default function Wizard({ onComplete }: WizardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPeerInput, setShowPeerInput] = useState(false);
  const [peerUri, setPeerUri] = useState('');

  const handleBootstrap = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await bootstrap();
      
      if (result.peers_added.length > 0) {
        // Success! Celebrate with confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#059669', '#047857'], // Emerald shades
        });

        // Close wizard after a brief moment
        setTimeout(() => {
          onComplete();
        }, 1500);
      } else {
        setError('No peers were added. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to public mesh');
      setIsLoading(false);
    }
  };

  const handleManualPeer = () => {
    // TODO: Implement manual peer addition endpoint
    // For now, just show the input
    setShowPeerInput(true);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative overflow-hidden">
        {/* Decorative gradient */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600" />

        {/* Content */}
        <div className="relative">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-emerald-500" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-light text-slate-900 text-center mb-3">
            Welcome to Yggdrasil
          </h2>
          <p className="text-slate-600 text-center mb-8 leading-relaxed">
            You're not connected to the mesh yet. Let's get you online.
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          {!showPeerInput ? (
            <div className="space-y-4">
              {/* Primary Action: Bootstrap */}
              <button
                onClick={handleBootstrap}
                disabled={isLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-medium py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-3 shadow-lg shadow-emerald-500/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Finding low-latency peers...</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-5 h-5" />
                    <span>Connect to Public Mesh</span>
                  </>
                )}
              </button>

              {/* Secondary Action: Manual Peer */}
              <button
                onClick={handleManualPeer}
                disabled={isLoading}
                className="w-full bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-700 font-medium py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-3"
              >
                <Key className="w-5 h-5" />
                <span>I Have a Private Peer</span>
              </button>
            </div>
          ) : (
            /* Manual Peer Input */
            <div className="space-y-4">
              <div>
                <label htmlFor="peer-uri" className="block text-sm font-medium text-slate-700 mb-2">
                  Peering URI
                </label>
                <input
                  id="peer-uri"
                  type="text"
                  value={peerUri}
                  onChange={(e) => setPeerUri(e.target.value)}
                  placeholder="tcp://[200:1234::1]:9001"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPeerInput(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    // TODO: Call add peer endpoint
                    alert('Manual peer addition coming soon!');
                  }}
                  disabled={!peerUri.trim()}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Add Peer
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              Connecting to public peers will route your traffic through community-operated nodes.
              <br />
              Your sovereignty remains intact—no central accounts required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
