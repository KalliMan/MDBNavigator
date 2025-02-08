import CommandQueryContextProvider from "./commandQuery/CommandQueryContextProvider";
import DatabaseCommandContextProvider from "./databaseCommand/DatabaseCommandContextProvider";
import DatabaseConnectContextProvider from "./databaseConnect/DatabaseConnectContextProvider";
import DatabaseSchemaContextProvider from "./databaseSchema/DatabaseSchemaContextProvider";

export default function DatabaseContextProvider({ children }: React.PropsWithChildren) {
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
