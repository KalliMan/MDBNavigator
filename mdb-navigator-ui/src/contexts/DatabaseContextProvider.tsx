import DatabaseCommandContextProvider from "./databaseCommand/databaseCommandContextProvider";
import DatabaseConnectContextProvider from "./databaseConnect/DatabaseConnectContextProvider";
import DatabaseSchemaContextProvider from "./databaseSchema/DatabaseSchemaContextProvider";

export default function DatabaseContextProvider({ children }: React.PropsWithChildren) {
  return (
    <DatabaseConnectContextProvider>
      <DatabaseSchemaContextProvider>
        <DatabaseCommandContextProvider>
          {children}
        </DatabaseCommandContextProvider>
      </DatabaseSchemaContextProvider>
    </DatabaseConnectContextProvider>
  );
}
