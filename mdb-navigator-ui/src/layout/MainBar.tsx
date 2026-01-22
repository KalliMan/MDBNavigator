import { useRef, useState } from 'react';
import Tabs from '../ui/tabs/Tabs';

import { v4 as uuidv4 } from 'uuid';
import DatabaseCommandAndResult from '../features/databaseCommand/DatabaseCommandAndResult';
import { DatabaseSQLCommandQuery } from '../models/databaseCommand/query/databaseSQLCommandQuery';
import useCommandQueryContext from '../contexts/commandQuery/useCommandQueryContext';

interface TabData {
  id: string;
  name: string;

  databaseCommandQuery: DatabaseSQLCommandQuery;
}

function Mainbar() {
  const { databaseCommandQueries } = useCommandQueryContext();

  const [tabsData, setTabsData] = useState<TabData[]>([]);
  const activeId = useRef<string | null>(null);
  const processedQueryIds = useRef<Set<string>>(new Set());

  function handleCloseTab (id: string): void {
    const index = tabsData.findIndex(t => t.id === id);
    if (index === -1) {
      return;
    }

    const newTabsData = [...tabsData];
    newTabsData.splice(index, 1);

    if (newTabsData.length === 0) {
      activeId.current = null;
    } else {
      if (activeId.current === id) {
        if (index > 0 && newTabsData.length > index - 1) {
          activeId.current = newTabsData[index - 1].id;
        } else {
          activeId.current = newTabsData[0].id;
        }
      }
    }

    setTabsData(newTabsData);
  }

  const newQueries = databaseCommandQueries.filter(
    query => !processedQueryIds.current.has(query.id)
  );

  if (newQueries.length > 0) {
    const newTabs = newQueries.map(query => {
      processedQueryIds.current.add(query.id);
      return {
        id: uuidv4(),
        name: `New Query (${tabsData.length + newQueries.indexOf(query) + 1}) '${query.name}'`,
        databaseCommandQuery: query
      };
    });

    setTabsData([...tabsData, ...newTabs]);
    activeId.current = newTabs[newTabs.length - 1].id;
  }

  return (
    <div className="pr-2 overflow-auto">
      {tabsData?.length > 0 && (
        <Tabs activeId={activeId.current}
          onClose={(id) => handleCloseTab(id)} >
          {tabsData.map(t => (
            <Tabs.Tab label={t.name} id={t.id} key={t.id}>
              <DatabaseCommandAndResult databaseCommandQuery={t.databaseCommandQuery} key={t.id} />
            </Tabs.Tab>
          ))}
        </Tabs>
      )}
    </div>
  );
}

export default Mainbar;
