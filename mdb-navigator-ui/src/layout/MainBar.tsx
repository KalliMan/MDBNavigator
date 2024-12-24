import { useRef } from 'react';
import Tabs from '../ui/tabs/Tabs';

import { v4 as uuidv4 } from 'uuid';
import { useDatabaseContext } from '../contexts/DatabaseContextProvider';
import DatabaseCommandAndResult from '../features/databaseCommand/DatabaseCommandAndResult';
import { DatabaseSQLCommandQuery } from '../models/databaseCommand/query/databaseSQLCommandQuery';

interface TabData {
  id: string;
  name: string;

  databaseCommandQuery: DatabaseSQLCommandQuery;
}

function Mainbar() {
  const { databaseCommandQueries } = useDatabaseContext();
  const tabsData = useRef<TabData[]>([]);

  console.log(databaseCommandQueries);
  if (!databaseCommandQueries?.length) {
    return null;
  }

  const newDatabaseCommandQueryRequest = databaseCommandQueries[databaseCommandQueries.length - 1];
  const tabs = tabsData.current;
  if (newDatabaseCommandQueryRequest && !tabs.some(t => t.databaseCommandQuery.id === newDatabaseCommandQueryRequest.id)) {
    const newTab: TabData = {
      id: uuidv4(),
      name: `New SQL Query (${tabs.length + 1})`,
      databaseCommandQuery: newDatabaseCommandQueryRequest
    };

    tabs?.push(newTab);
  }

  return (
    <div className="pl-2 pr-2 overflow-auto">
      {tabs?.length > 0 && (
        <Tabs>
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
