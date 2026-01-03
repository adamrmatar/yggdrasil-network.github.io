/**
 * Yggdrasil Commander API Client
 * Strongly-typed interface to the Flask backend
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface ApiStatus {
  status: string;
  yggdrasil_socket: 'connected' | 'disconnected';
  socket_path: string;
  socket_exists: boolean;
  socket_responsive: boolean;
  backend_version: string;
}

export interface NodeInfo {
  address: string;
  key: string;
  coords: string;
  subnet: string;
}

export interface Peer {
  address: string;
  key: string;
  port: number;
  uptime: number;
  bytes_sent?: number;
  bytes_recv?: number;
}

export interface PeersResponse {
  peers: Peer[];
}

export interface InviteResponse {
  qr_code: string; // Base64 data URI
  peering_string: string;
  address: string;
}

export interface BootstrapResponse {
  status: 'bootstrapped';
  peers_added: string[];
  total_peers: number;
  reload_success: boolean;
}

export interface ExitNodeResponse {
  status: 'exit_node_updated';
  enabled: boolean;
  advertised_routes: string[];
  reload_success: boolean;
}

export interface ApiError {
  error: string;
}

// =============================================================================
// API CLIENT
// =============================================================================

const API_BASE = '/api';

/**
 * Generic fetch wrapper with error handling and TypeScript support
 */
export async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // API returned an error
      const error = data as ApiError;
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return data as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred');
  }
}

// =============================================================================
// API METHODS
// =============================================================================

/**
 * Get backend and Yggdrasil socket status
 */
export async function getStatus(): Promise<ApiStatus> {
  return fetchAPI<ApiStatus>('/status');
}

/**
 * Get node information (address, key, coords, subnet)
 */
export async function getNodeInfo(): Promise<NodeInfo> {
  return fetchAPI<NodeInfo>('/self');
}

/**
 * Get list of connected peers
 */
export async function getPeers(): Promise<PeersResponse> {
  return fetchAPI<PeersResponse>('/peers');
}

/**
 * Generate invite QR code for peering
 */
export async function getInvite(): Promise<InviteResponse> {
  return fetchAPI<InviteResponse>('/invite');
}

/**
 * Bootstrap node with public peers (magic button)
 */
export async function bootstrap(): Promise<BootstrapResponse> {
  return fetchAPI<BootstrapResponse>('/bootstrap', {
    method: 'POST',
  });
}

/**
 * Enable or disable exit node (VPN gateway)
 */
export async function setExitNode(enabled: boolean): Promise<ExitNodeResponse> {
  return fetchAPI<ExitNodeResponse>('/exit-node', {
    method: 'POST',
    body: JSON.stringify({ enabled }),
  });
}

// =============================================================================
// HOOKS (for use in React components)
// =============================================================================

/**
 * Poll an API endpoint at a specified interval
 * Returns [data, error, isLoading]
 */
export function usePolling<T>(
  fetcher: () => Promise<T>,
  interval: number = 2000
): [T | null, Error | null, boolean] {
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  
  React.useEffect(() => {
    let cancelled = false;
    
    const poll = async () => {
      try {
        const result = await fetcher();
        if (!cancelled) {
          setData(result);
          setError(null);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setIsLoading(false);
        }
      }
    };
    
    // Initial fetch
    poll();
    
    // Set up polling
    const intervalId = setInterval(poll, interval);
    
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [fetcher, interval]);
  
  return [data, error, isLoading];
}

// Export React for the hook
import React from 'react';
