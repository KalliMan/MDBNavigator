import { createContext, useContext, useReducer } from "react";
import { ConnectionSettings } from "../models/connect/connectionSettings";
import { DatabaseActionTypes } from "./DatabaseActionType";
import { DatabaseContextType, databaseReducer, databaseInitialState } from "./DatabaseReducer";
import agent from "../services/apiAgent";
import { v4 as uuidv4 } from 'uuid';
import { DatabaseGetTopNRecordsTableCommandQuery } from "../models/databaseCommand/query/databaseGetTopNRecordsTableCommandQuery";


const DatabaseContext = createContext<DatabaseContextType | null>(null);


export function DatabaseContextProvider({ children }: React.PropsWithChildren) {
  const [state, dispatch] = useReducer(databaseReducer, databaseInitialState);

  return ( <DatabaseContext.Provider value={{ state, dispatch }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabaseContext() {
  const context = useContext(DatabaseContext);

  if (!context) {
      throw new Error('TreeViewContext must be used inside the Provider');
  }

  async function connect(connectionSettings: ConnectionSettings) {
    context!.dispatch({
      type: DatabaseActionTypes.Loading,
    });

    const result = await agent.databaseConnectionApi.connect(connectionSettings);

    if (result ){
      context!.dispatch({
        type:DatabaseActionTypes.DatabaseConnected,
        payload: connectionSettings
      });
    } else {
      context!.dispatch({
        type:DatabaseActionTypes.Error,
        payload: `Cannot connect to ${connectionSettings.serverName}`
      });
    }
  }

  async function fetchDatabases() {
    context!.dispatch({
      type: DatabaseActionTypes.Loading,
    });

    const result = await agent.databaseSchemaApi.fetchDatabases();

    context!.dispatch({
      type: DatabaseActionTypes.FetchedDatabases,
      payload: result
    });
  }

  async function fetchTables(databaseName: string) {
    context!.dispatch({
      type: DatabaseActionTypes.Loading,
    });

    const result = await agent.databaseSchemaApi.fetchTables(databaseName);

    context!.dispatch({
      type: DatabaseActionTypes.FetchedTables,
      payload: result
    });
  }

  async function queryCommandGetTopNTableRecords(databaseName: string, schema: string, table: string, recordsNumber: number) {

    const query: DatabaseGetTopNRecordsTableCommandQuery = new DatabaseGetTopNRecordsTableCommandQuery(uuidv4(), databaseName, schema, table, recordsNumber, true);

    context!.dispatch({
      type: DatabaseActionTypes.CommandQueried,
      payload: query
    });

  }

  // async function getTopNTableRecords(id: string, databaseName: string, schema: string, table: string, recordsNumber: number) {
  //   context!.dispatch({
  //     type: DatabaseActionTypes.Loading,
  //   });

  //   const result = await agent.databaseCommandApi.getTopNTableRecords(id, databaseName, schema, table, recordsNumber);

  //   context!.dispatch({
  //     type: DatabaseActionTypes.CommandResultReceived,
  //     payload: result
  //   });
  // }

  const {isLoading, isConnectedToDB, error, connectionSettings, databasesDetails, tablesDetails, databaseCommandQueries} = context.state;

  return {
    isLoading,
    isConnectedToDB,
    error,
    connectionSettings,
    databasesDetails,
    tablesDetails,
    databaseCommandQueries,
    connect,
    fetchDatabases,
    fetchTables,
    queryCommandGetTopNTableRecords,
//    getTopNTableRecords
  };
}

