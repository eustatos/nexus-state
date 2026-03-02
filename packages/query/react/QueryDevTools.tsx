import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getQueryDevToolsStore } from '../src/devtools/devtools-store';
import type { QueryDevToolsConfig, QuerySnapshot, MutationSnapshot } from '../src/devtools/types';
import {
  formatDevToolsValue,
  getQueryStatus,
  getSafeBoolean,
  getSafeNumber,
  toDisplayableQuery,
  toDisplayableMutation,
} from '../src/devtools/type-guards';

/**
 * Query DevTools Panel Component for visual debugging of queries and mutations
 *
 * @example
 * ```tsx
 * import { QueryDevTools } from '@nexus-state/query/react';
 *
 * function App() {
 *   return (
 *     <>
 *       <YourApp />
 *       <QueryDevTools position="bottom-right" />
 *     </>
 *   );
 * }
 * ```
 *
 * @param config - DevTools configuration options
 */
export function QueryDevTools(config: QueryDevToolsConfig = {}) {
  const {
    position = 'bottom-right',
    initialIsOpen = false,
    panelPosition = 'bottom',
    closeButtonProps = {},
    toggleButtonProps = {},
  } = config;

  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'queries' | 'mutations' | 'network'>('queries');

  const store = getQueryDevToolsStore();

  // Subscribe to store updates
  const [, forceUpdate] = useState({});
  useEffect(() => {
    return store.subscribe(() => {
      forceUpdate({});
    });
  }, [store]);

  // Filter queries by search term
  const filteredQueries = useMemo(() => {
    const queries = Array.from(store.queries.entries());
    if (!filter) return queries;
    return queries.filter(([key]) =>
      key.toLowerCase().includes(filter.toLowerCase())
    );
  }, [store.queries, filter]);

  // Filter mutations by search term
  const filteredMutations = useMemo(() => {
    const mutations = Array.from(store.mutations.entries());
    if (!filter) return mutations;
    return mutations.filter(([key]) =>
      key.toLowerCase().includes(filter.toLowerCase())
    );
  }, [store.mutations, filter]);

  // Get recent network activity
  const recentNetworkActivity = useMemo(() => {
    return [...store.networkActivity].reverse().slice(0, 50);
  }, [store.networkActivity]);

  // Handlers
  const handleInvalidate = useCallback((queryKey: string) => {
    store.invalidateQuery(queryKey);
  }, [store]);

  const handleRefetch = useCallback(async (queryKey: string) => {
    await store.refetchQuery(queryKey);
  }, [store]);

  const handleRemove = useCallback((queryKey: string) => {
    store.removeQuery(queryKey);
    if (selectedQuery === queryKey) {
      setSelectedQuery(null);
    }
  }, [store, selectedQuery]);

  const handleClearCache = useCallback(() => {
    store.clearCache();
    setSelectedQuery(null);
  }, [store]);

  // Toggle button when closed
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        {...toggleButtonProps}
        style={{
          position: 'fixed',
          [position.includes('bottom') ? 'bottom' : 'top']: '10px',
          [position.includes('right') ? 'right' : 'left']: '10px',
          padding: '8px 12px',
          background: '#FF6347',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          zIndex: 99999,
          fontSize: '12px',
          fontWeight: 'bold',
          ...toggleButtonProps.style,
        }}
      >
        ⚡ Queries ({store.queries.size})
      </button>
    );
  }

  // Panel when open
  return (
    <div
      style={{
        position: 'fixed',
        [panelPosition]: 0,
        left: panelPosition !== 'bottom' ? undefined : 0,
        right: panelPosition !== 'bottom' ? undefined : 0,
        width: panelPosition === 'bottom' ? '100%' : '400px',
        height: panelPosition === 'bottom' ? '300px' : '100vh',
        background: 'white',
        borderTop: panelPosition === 'bottom' ? '2px solid #FF6347' : undefined,
        borderLeft: panelPosition === 'right' ? '2px solid #FF6347' : undefined,
        borderRight: panelPosition === 'left' ? '2px solid #FF6347' : undefined,
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 99999,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '12px',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px',
          background: '#FF6347',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <strong style={{ fontSize: '14px' }}>⚡ Query DevTools</strong>
          <span style={{ opacity: 0.8 }}>
            {store.queries.size} queries • {store.mutations.size} mutations
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleClearCache}
            style={{
              padding: '4px 8px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            🗑️ Clear Cache
          </button>
          <button
            onClick={() => setIsOpen(false)}
            {...closeButtonProps}
            style={{
              padding: '4px 8px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer',
              fontSize: '14px',
              ...closeButtonProps.style,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #eee', flexShrink: 0 }}>
        <TabButton active={activeTab === 'queries'} onClick={() => setActiveTab('queries')}>
          Queries ({store.queries.size})
        </TabButton>
        <TabButton active={activeTab === 'mutations'} onClick={() => setActiveTab('mutations')}>
          Mutations ({store.mutations.size})
        </TabButton>
        <TabButton active={activeTab === 'network'} onClick={() => setActiveTab('network')}>
          Network ({store.networkActivity.length})
        </TabButton>
      </div>

      {/* Filter */}
      <div style={{ padding: '8px', borderBottom: '1px solid #eee', flexShrink: 0 }}>
        <input
          type="text"
          placeholder={`Filter ${activeTab}...`}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '12px',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* List Panel */}
        <div
          style={{
            width: activeTab === 'network' ? '100%' : '50%',
            overflowY: 'auto',
            borderRight: activeTab === 'network' ? 'none' : '1px solid #eee',
          }}
        >
          {activeTab === 'queries' && (
            <QueryList
              queries={filteredQueries}
              selectedQuery={selectedQuery}
              onSelect={setSelectedQuery}
            />
          )}
          {activeTab === 'mutations' && (
            <MutationList
              mutations={filteredMutations}
              selectedMutation={selectedQuery}
              onSelect={setSelectedQuery}
            />
          )}
          {activeTab === 'network' && (
            <NetworkActivityList activities={recentNetworkActivity} />
          )}
        </div>

        {/* Details Panel */}
        {activeTab !== 'network' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {selectedQuery ? (
              activeTab === 'queries' ? (
                <QueryDetails
                  query={store.queries.get(selectedQuery)}
                  queryKey={selectedQuery}
                  onInvalidate={() => handleInvalidate(selectedQuery)}
                  onRefetch={() => handleRefetch(selectedQuery)}
                  onRemove={() => handleRemove(selectedQuery)}
                />
              ) : (
                <MutationDetails
                  mutation={store.mutations.get(selectedQuery)}
                  onRemove={() => handleRemove(selectedQuery)}
                />
              )
            ) : (
              <EmptyState message={`Select a ${activeTab.slice(0, -1)} to view details`} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Tab Button Component
// ============================================================================

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      flex: 1,
      padding: '8px 12px',
      background: active ? '#f0f0f0' : 'transparent',
      borderBottom: active ? '2px solid #FF6347' : '2px solid transparent',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: active ? 'bold' : 'normal',
      color: active ? '#333' : '#666',
      border: 'none',
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
    }}
  >
    {children}
  </button>
);

// ============================================================================
// Query List Component
// ============================================================================

const QueryList: React.FC<{
  queries: Array<[string, QuerySnapshot]>;
  selectedQuery: string | null;
  onSelect: (key: string) => void;
}> = ({ queries, selectedQuery, onSelect }) => {
  if (queries.length === 0) {
    return <EmptyState message="No queries found" />;
  }

  return (
    <div>
      {queries.map(([key, query]) => {
        const display = toDisplayableQuery(query);
        return (
          <div
            key={key}
            onClick={() => onSelect(key)}
            style={{
              padding: '12px',
              cursor: 'pointer',
              borderBottom: '1px solid #eee',
              background: selectedQuery === key ? '#f0f0f0' : 'white',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <StatusIndicator status={display.status} />
              <span style={{ fontWeight: 'bold', wordBreak: 'break-all', flex: 1 }}>
                {key}
              </span>
            </div>
            <div style={{ marginTop: '4px', fontSize: '10px', color: '#666' }}>
              {display.isStale && '⏰ Stale • '}
              {display.isFetching && '🔄 Fetching • '}
              Updated: {display.dataUpdatedAt > 0 ? new Date(display.dataUpdatedAt).toLocaleTimeString() : 'Never'}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// Mutation List Component
// ============================================================================

const MutationList: React.FC<{
  mutations: Array<[string, MutationSnapshot]>;
  selectedMutation: string | null;
  onSelect: (key: string) => void;
}> = ({ mutations, selectedMutation, onSelect }) => {
  if (mutations.length === 0) {
    return <EmptyState message="No mutations found" />;
  }

  return (
    <div>
      {mutations.map(([key, mutation]) => {
        const display = toDisplayableMutation(mutation);
        return (
          <div
            key={key}
            onClick={() => onSelect(key)}
            style={{
              padding: '12px',
              cursor: 'pointer',
              borderBottom: '1px solid #eee',
              background: selectedMutation === key ? '#f0f0f0' : 'white',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <StatusIndicator status={display.status} />
              <span style={{ fontWeight: 'bold', wordBreak: 'break-all', flex: 1 }}>
                {display.mutationId || key}
              </span>
            </div>
            <div style={{ marginTop: '4px', fontSize: '10px', color: '#666' }}>
              Status: {display.status}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// Network Activity List Component
// ============================================================================

const NetworkActivityList: React.FC<{
  activities: Array<{
    id: string;
    queryKey: string;
    type: 'query' | 'mutation';
    status: 'pending' | 'success' | 'error';
    startedAt: number;
    endedAt?: number;
    duration?: number;
  }>;
}> = ({ activities }) => {
  if (activities.length === 0) {
    return <EmptyState message="No network activity" />;
  }

  return (
    <div>
      {activities.map((activity) => (
        <div
          key={activity.id}
          style={{
            padding: '12px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <NetworkStatusIndicator status={activity.status} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', wordBreak: 'break-all' }}>
              {activity.queryKey}
            </div>
            <div style={{ fontSize: '10px', color: '#666' }}>
              {activity.type} • {new Date(activity.startedAt).toLocaleTimeString()}
              {activity.duration && ` • ${activity.duration}ms`}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// Status Indicator Component
// ============================================================================

const StatusIndicator: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    idle: '#999',
    loading: '#3498db',
    success: '#2ecc71',
    error: '#e74c3c',
  };

  return (
    <div
      style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: colors[status] || '#999',
        flexShrink: 0,
      }}
      title={status}
    />
  );
};

// ============================================================================
// Network Status Indicator Component
// ============================================================================

const NetworkStatusIndicator: React.FC<{ status: string }> = ({ status }) => {
  const icons: Record<string, string> = {
    pending: '⏳',
    success: '✅',
    error: '❌',
  };

  return <div style={{ fontSize: '16px', flexShrink: 0 }}>{icons[status] || '⚪'}</div>;
};

// ============================================================================
// Query Details Component
// ============================================================================

const QueryDetails: React.FC<{
  query: QuerySnapshot | undefined;
  queryKey: string;
  onInvalidate: () => void;
  onRefetch: () => void;
  onRemove: () => void;
}> = ({ query, queryKey, onInvalidate, onRefetch, onRemove }) => {
  if (!query) {
    return <EmptyState message="Query not found" />;
  }

  const display = toDisplayableQuery(query);

  return (
    <div>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Query Details</h3>

      {/* Query Key */}
      <DetailSection title="Query Key">
        <pre style={{
          background: '#f5f5f5',
          padding: '8px',
          borderRadius: '4px',
          margin: 0,
          fontSize: '11px',
          wordBreak: 'break-all',
        }}>
          {queryKey}
        </pre>
      </DetailSection>

      {/* Actions */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <ActionButton onClick={onRefetch} color="#3498db" icon="🔄">Refetch</ActionButton>
        <ActionButton onClick={onInvalidate} color="#f39c12" icon="⏰">Invalidate</ActionButton>
        <ActionButton onClick={onRemove} color="#e74c3c" icon="🗑️">Remove</ActionButton>
      </div>

      {/* State */}
      <DetailSection title="State">
        <StateRow label="Status" value={display.status} />
        <StateRow label="Fetching" value={display.isFetching ? 'Yes' : 'No'} />
        <StateRow label="Stale" value={display.isStale ? 'Yes' : 'No'} />
        <StateRow label="Failure Count" value={display.failureCount} />
      </DetailSection>

      {/* Data */}
      {display.hasData && (
        <DetailSection title="Data">
          <pre style={{
            background: '#f5f5f5',
            padding: '8px',
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '200px',
            margin: 0,
            fontSize: '11px',
          }}>
            {formatDevToolsValue(query.data)}
          </pre>
        </DetailSection>
      )}

      {/* Error */}
      {display.hasError && (
        <DetailSection title="Error">
          <pre style={{
            background: '#fee',
            padding: '8px',
            borderRadius: '4px',
            color: '#c00',
            margin: 0,
            fontSize: '11px',
            overflow: 'auto',
            maxHeight: '200px',
          }}>
            {formatDevToolsValue(query.error)}
          </pre>
        </DetailSection>
      )}

      {/* Timestamps */}
      <DetailSection title="Timestamps">
        <StateRow
          label="Data Updated"
          value={display.dataUpdatedAt > 0 ? new Date(display.dataUpdatedAt).toLocaleString() : 'Never'}
        />
        {display.errorUpdatedAt > 0 && (
          <StateRow
            label="Error Updated"
            value={new Date(display.errorUpdatedAt).toLocaleString()}
          />
        )}
      </DetailSection>
    </div>
  );
};

// ============================================================================
// Mutation Details Component
// ============================================================================

const MutationDetails: React.FC<{
  mutation: MutationSnapshot | undefined;
  onRemove: () => void;
}> = ({ mutation, onRemove }) => {
  if (!mutation) {
    return <EmptyState message="Mutation not found" />;
  }

  const display = toDisplayableMutation(mutation);

  return (
    <div>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Mutation Details</h3>

      {/* Mutation ID */}
      <DetailSection title="Mutation ID">
        <pre style={{
          background: '#f5f5f5',
          padding: '8px',
          borderRadius: '4px',
          margin: 0,
          fontSize: '11px',
          wordBreak: 'break-all',
        }}>
          {display.mutationId}
        </pre>
      </DetailSection>

      {/* Actions */}
      <div style={{ marginBottom: '16px' }}>
        <ActionButton onClick={onRemove} color="#e74c3c" icon="🗑️">Remove</ActionButton>
      </div>

      {/* State */}
      <DetailSection title="State">
        <StateRow label="Status" value={display.status} />
        <StateRow label="Failure Count" value={display.failureCount} />
      </DetailSection>

      {/* Variables */}
      {display.hasVariables && (
        <DetailSection title="Variables">
          <pre style={{
            background: '#f5f5f5',
            padding: '8px',
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '150px',
            margin: 0,
            fontSize: '11px',
          }}>
            {formatDevToolsValue(mutation.variables)}
          </pre>
        </DetailSection>
      )}

      {/* Data */}
      {display.hasData && (
        <DetailSection title="Data">
          <pre style={{
            background: '#f5f5f5',
            padding: '8px',
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '150px',
            margin: 0,
            fontSize: '11px',
          }}>
            {formatDevToolsValue(mutation.data)}
          </pre>
        </DetailSection>
      )}

      {/* Error */}
      {display.hasError && (
        <DetailSection title="Error">
          <pre style={{
            background: '#fee',
            padding: '8px',
            borderRadius: '4px',
            color: '#c00',
            margin: 0,
            fontSize: '11px',
            overflow: 'auto',
            maxHeight: '150px',
          }}>
            {formatDevToolsValue(mutation.error)}
          </pre>
        </DetailSection>
      )}
    </div>
  );
};

// ============================================================================
// Helper Components
// ============================================================================

const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: '16px' }}>
    <h4 style={{ margin: '0 0 8px 0', color: '#666', fontSize: '12px' }}>{title}</h4>
    {children}
  </div>
);

const StateRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '4px 0',
      borderBottom: '1px solid #eee',
      fontSize: '11px',
    }}
  >
    <span style={{ color: '#666' }}>{label}</span>
    <span style={{ fontWeight: 'bold' }}>{value}</span>
  </div>
);

const ActionButton: React.FC<{
  onClick: () => void;
  color: string;
  icon: string;
  children: React.ReactNode;
}> = ({ onClick, color, icon, children }) => (
  <button
    onClick={onClick}
    style={{
      padding: '6px 12px',
      background: color,
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '11px',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    }}
  >
    <span>{icon}</span>
    {children}
  </button>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#999' }}>
    {message}
  </div>
);
