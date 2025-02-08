import { useRef } from 'react';
import Tabs from '../ui/tabs/Tabs';

import { v4 as uuidv4 } from 'uuid';
import DatabaseCommandAndResult from '../features/databaseCommand/DatabaseCommandAndResult';
import { DatabaseSQLCommandQuery } from '../models/databaseCommand/query/databaseSQLCommandQuery';
import useCommandQueryContext from '../contexts/commandQuery/useDatabaseCommand';

interface TabData {
  id: string;
  name: string;

  databaseCommandQuery: DatabaseSQLCommandQuery;
}

function Mainbar() {
  const { databaseCommandQueries } = useCommandQueryContext();

  const tabsData = useRef<TabData[]>([]);
  const activeId = useRef<string | null>(null);

  function handleCloseTab (id: string): void {
    const index = tabsData.current.findIndex(t => t.id === id);
    if (index === -1) {
      return;
    }

    tabsData.current.splice(index, 1);
    if (tabsData.current.length === 0) {
      activeId.current = null;
    } else {
      activeId.current = tabsData.current[0].id;
    }
  }

  if (!databaseCommandQueries) {
    return null;
  }

  const tabs = tabsData.current;
  if (databaseCommandQueries && !tabs.some(t => t.databaseCommandQuery.id === databaseCommandQueries.id)) {
    const newTab: TabData = {
      id: uuidv4(),
      name: `New Query (${tabs.length + 1}) '${databaseCommandQueries.databaseName}'`,
      databaseCommandQuery: databaseCommandQueries
    };

    tabs?.push(newTab);
    activeId.current = newTab.id;
  }

  return (
    <div className="pl-2 pr-2 overflow-auto">
      {tabs?.length > 0 && (
        <Tabs activeId={activeId.current}
          onClose={(id) => handleCloseTab(id)} >
          {tabs.map(t => (
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
