'use client';

import { useEffect, useState } from 'react';
import { X, Copy, Check, Loader2, QrCode } from 'lucide-react';
import { getInvite, type InviteResponse } from '@/lib/api';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InviteModal({ isOpen, onClose }: InviteModalProps) {
  const [invite, setInvite] = useState<InviteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadInvite();
    }
  }, [isOpen]);

  const loadInvite = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getInvite();
      setInvite(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate invite');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (invite) {
      navigator.clipboard.writeText(invite.peering_string);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <QrCode className="w-6 h-6 text-white" />
            <h3 className="text-lg font-medium text-white">Share Invite</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
              <p className="text-slate-600">Generating invite...</p>
            </div>
          ) : error ? (
            <div className="py-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button
                onClick={loadInvite}
                className="mt-4 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          ) : invite ? (
            <div className="space-y-6">
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg border-2 border-slate-200 shadow-sm">
                  <img
                    src={invite.qr_code}
                    alt="Peering QR Code"
                    className="w-64 h-64"
                  />
                </div>
              </div>

              {/* Peering String */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Peering URI
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={invite.peering_string}
                    readOnly
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-mono text-sm text-slate-700 focus:outline-none"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Node Address */}
              <div className="pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-600 mb-2">Your Node Address</p>
                <p className="font-mono text-sm text-slate-900 break-all">
                  {invite.address}
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  Share this QR code or URI with others to allow them to peer with your node.
                  They can scan the QR code with their mobile device or paste the URI into their
                  Yggdrasil configuration.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
