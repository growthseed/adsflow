/**
 * Custom hooks para gerenciamento de flows
 */

import { useState, useEffect, useCallback } from 'react';
import { flowsAPI, metaAPI } from '@/lib/api';
import type {
  Flow,
  CreateFlowInput,
  UpdateFlowInput,
  MetaSyncInput
} from '@/lib/api';

// Re-exportar o tipo Flow para uso em outros arquivos
export type { Flow, CreateFlowInput, UpdateFlowInput };

export interface UseFlowsResult {
  flows: Flow[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createNewFlow: (input: CreateFlowInput) => Promise<Flow | null>;
  updateExistingFlow: (id: string, input: UpdateFlowInput) => Promise<Flow | null>;
  deleteExistingFlow: (id: string) => Promise<boolean>;
}

/**
 * Hook para gerenciar lista de flows
 */
export function useFlows(): UseFlowsResult {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlows = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const flows = await flowsAPI.list();
      setFlows(flows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlows();
  }, [fetchFlows]);

  const createNewFlow = useCallback(async (input: CreateFlowInput): Promise<Flow | null> => {
    try {
      const flow = await flowsAPI.create(input);
      if (flow) {
        setFlows((prev) => [...prev, flow]);
        return flow;
      }
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, []);

  const updateExistingFlow = useCallback(
    async (id: string, input: UpdateFlowInput): Promise<Flow | null> => {
      try {
        const flow = await flowsAPI.update(id, input);
        if (flow) {
          setFlows((prev) => prev.map((f) => (f.id === id ? flow : f)));
          return flow;
        }
        return null;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        return null;
      }
    },
    []
  );

  const deleteExistingFlow = useCallback(async (id: string): Promise<boolean> => {
    try {
      await flowsAPI.delete(id);
      setFlows((prev) => prev.filter((flow) => flow.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, []);

  return {
    flows,
    isLoading,
    error,
    refetch: fetchFlows,
    createNewFlow,
    updateExistingFlow,
    deleteExistingFlow,
  };
}

export interface UseMetaSyncResult {
  isSyncing: boolean;
  syncError: string | null;
  lastSyncData: any | null;
  syncData: (input: MetaSyncInput) => Promise<boolean>;
}

/**
 * Hook para sincronização com Meta Ads
 */
export function useMetaSync(): UseMetaSyncResult {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncData, setLastSyncData] = useState<any | null>(null);

  const syncData = useCallback(async (input: MetaSyncInput): Promise<boolean> => {
    setIsSyncing(true);
    setSyncError(null);

    try {
      const response = await metaAPI.sync(input);

      if (response.success) {
        setLastSyncData(response.data);
        return true;
      } else {
        setSyncError(response.message || 'Failed to sync Meta Ads data');
        return false;
      }
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return {
    isSyncing,
    syncError,
    lastSyncData,
    syncData,
  };
}
