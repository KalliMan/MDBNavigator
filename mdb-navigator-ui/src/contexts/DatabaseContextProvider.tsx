import CommandQueryContextProvider from "./commandQuery/CommandQueryContextProvider";
import DatabaseCommandContextProvider from "./databaseCommand/DatabaseCommandContextProvider";
import DatabaseConnectContextProvider from "./databaseServerConnect/DatabaseServerConnectContextProvider";
import DatabaseSchemaContextProvider from "./databaseSchema/DatabaseSchemaContextProvider";

export default function DatabaseServerContextProvider({ children }: React.PropsWithChildren) {
  return (
    <DatabaseConnectContextProvider>
      <DatabaseSchemaContextProvider>
        <DatabaseCommandContextProvider>
          <CommandQueryContextProvider>
            {children}
          </CommandQueryContextProvider>
        </DatabaseCommandContextProvider>
      </DatabaseSchemaContextProvider>
    </DatabaseConnectContextProvider>
  );
}
