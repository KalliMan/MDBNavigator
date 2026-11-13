import { useEffect, useRef, useState } from 'react';
import Tabs from '../ui/tabs/Tabs';

import { v4 as uuidv4 } from 'uuid';
import DatabaseCommandAndResult from '../features/databaseCommand/DatabaseCommandAndResult';
import { DatabaseSQLCommandQuery } from '../models/databaseCommand/query/databaseSQLCommandQuery';
import useCommandQueryContext from '../contexts/commandQuery/useCommandQueryContext';
import useDatabaseCommandContext from '../contexts/databaseCommand/useDatabaseCommandContext';
import useDatabaseServerConnectContext from '../contexts/databaseServerConnect/useDatabaseServerConnect';
import { QueryTarget } from '../models/databaseCommand/query/queryTarget';
import { queryTargetFor } from '../features/databaseCommand/queryTargets';

interface TabData {
  id: string;
  title: string;
  target: QueryTarget;

  databaseCommandQuery: DatabaseSQLCommandQuery;
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
        // Captured when the tab opens; the query bar can change it.
        target: queryTargetFor(query.connectionId, query.databaseName, databaseServerConnections),
        databaseCommandQuery: query
      };
    });

    setTabsData(prev => [...prev, ...newTabs]);
    setActiveTabId(newTabs[newTabs.length - 1].id);
  }, [databaseCommandQueries, databaseServerConnections]);

  // Results are freed once the server they came from is disconnected. After a switch (1.2d) that can be another
  // server than the tab's current one, so the run's own connection (ranOn) decides. The tabs stay open.
  useEffect(() => {
    const connectedIds = new Set(databaseServerConnections.map(c => c.connectedResult?.connectionId));
    commands
      .filter(c => c.ranOn && !connectedIds.has(c.ranOn.connectionId))
      .forEach(c => removeDatabaseSQLCommand(c.id));
  }, [databaseServerConnections, commands, removeDatabaseSQLCommand]);

  // The query bar changed where this tab runs (1.2d). The tab's query object stays as it is, so its editor text is kept.
  function handleTargetChange(tabId: string, target: QueryTarget) {
    setTabsData(prev => prev.map(t => (t.id === tabId ? { ...t, target } : t)));
  }

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
              <DatabaseCommandAndResult
                databaseCommandQuery={t.databaseCommandQuery}
                target={t.target}
                onTargetChange={target => handleTargetChange(t.id, target)}
                key={t.id}
              />
            </Tabs.Tab>
          ))}
        </Tabs>
      )}
    </div>
  );
}

export default Mainbar;
