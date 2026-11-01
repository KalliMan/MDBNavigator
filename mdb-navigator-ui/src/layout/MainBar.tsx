import { useEffect, useRef, useState } from 'react';
import Tabs from '../ui/tabs/Tabs';

import { v4 as uuidv4 } from 'uuid';
import DatabaseCommandAndResult from '../features/databaseCommand/DatabaseCommandAndResult';
import { DatabaseSQLCommandQuery } from '../models/databaseCommand/query/databaseSQLCommandQuery';
import useCommandQueryContext from '../contexts/commandQuery/useCommandQueryContext';
import useDatabaseCommandContext from '../contexts/databaseCommand/useDatabaseCommandContext';
import useDatabaseServerConnectContext from '../contexts/databaseServerConnect/useDatabaseServerConnect';
import { QueryTarget } from '../models/databaseCommand/query/queryTarget';
import { DatabaseServerConnection } from '../contexts/databaseServerConnect/DatabaseServerConnectReducer';
import { connectionAddress, UNKNOWN_CONNECTION_COLOR } from '../utils/connectionColor';

interface TabData {
  id: string;
  title: string;
  target: QueryTarget;

  databaseCommandQuery: DatabaseSQLCommandQuery;
}

// Captured when the tab opens: a disconnect removes the connection, but the tab keeps showing where it ran.
function queryTarget(query: DatabaseSQLCommandQuery, connections: DatabaseServerConnection[]): QueryTarget {
  const match = connections.find(c => c.connectedResult?.connectionId === query.connectionId);
  const connection = match?.connectedResult;
  if (!match || !connection) {
    return { serverName: 'Unknown server', databaseName: query.databaseName, address: '', color: UNKNOWN_CONNECTION_COLOR };
  }
  return {
    serverName: connection.serverName,
    databaseName: query.databaseName,
    address: connectionAddress(connection),
    color: match.color,
  };
}

function Mainbar() {
  const { databaseCommandQueries } = useCommandQueryContext();
  const { commands, removeDatabaseSQLCommand } = useDatabaseCommandContext();
  const { databaseServerConnections } = useDatabaseServerConnectContext();

  const [tabsData, setTabsData] = useState<TabData[]>([]);
  // Single source of truth for the active tab (Tabs is controlled).
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const processedQueryIds = useRef<Set<string>>(new Set());
  // Keeps tab numbers unique even after tabs are closed.
  const tabCounter = useRef(0);

  // Every new query in the CommandQuery context opens a new tab and activates it.
  useEffect(() => {
    const newQueries = databaseCommandQueries.filter(
      query => !processedQueryIds.current.has(query.id)
    );
    if (newQueries.length === 0) {
      return;
    }

    const newTabs = newQueries.map(query => {
      processedQueryIds.current.add(query.id);
      tabCounter.current += 1;
      return {
        id: uuidv4(),
        // Untitled queries ("New Query for this database") are numbered; generated ones keep their name.
        title: query.name || `Query ${tabCounter.current}`,
        target: queryTarget(query, databaseServerConnections),
        databaseCommandQuery: query
      };
    });

    setTabsData(prev => [...prev, ...newTabs]);
    setActiveTabId(newTabs[newTabs.length - 1].id);
  }, [databaseCommandQueries, databaseServerConnections]);

  // Tabs of a disconnected server stay open (read-only), but their results are freed.
  useEffect(() => {
    const connectedIds = new Set(databaseServerConnections.map(c => c.connectedResult?.connectionId));
    tabsData
      .filter(t => !connectedIds.has(t.databaseCommandQuery.connectionId))
      .filter(t => commands.some(c => c.id === t.databaseCommandQuery.id))
      .forEach(t => removeDatabaseSQLCommand(t.databaseCommandQuery.id));
  }, [databaseServerConnections, tabsData, commands, removeDatabaseSQLCommand]);

  function handleCloseTab (id: string): void {
    const index = tabsData.findIndex(t => t.id === id);
    if (index === -1) {
      return;
    }

    // Free the tab's results (and cancel its query if it is still running).
    removeDatabaseSQLCommand(tabsData[index].databaseCommandQuery.id);

    const newTabsData = tabsData.filter(t => t.id !== id);

    // Closing the active tab activates its left neighbour (or the new first tab).
    if (activeTabId === id) {
      setActiveTabId(newTabsData.length === 0 ? null : newTabsData[Math.max(0, index - 1)].id);
    }

    setTabsData(newTabsData);
  }

  return (
    <div className="h-full overflow-hidden">
      {tabsData?.length > 0 && (
        <Tabs activeId={activeTabId}
          onSetActiveTab={setActiveTabId}
          onClose={(id) => handleCloseTab(id)} >
          {tabsData.map(t => (
            <Tabs.Tab
              id={t.id}
              key={t.id}
              label={t.title}
              sublabel={`${t.target.serverName} · ${t.target.databaseName}`}
              color={t.target.color}
              title={`${t.title}\n${t.target.address || t.target.serverName} · ${t.target.databaseName}`}
            >
              <DatabaseCommandAndResult databaseCommandQuery={t.databaseCommandQuery} target={t.target} key={t.id} />
            </Tabs.Tab>
          ))}
        </Tabs>
      )}
    </div>
  );
}

export default Mainbar;
