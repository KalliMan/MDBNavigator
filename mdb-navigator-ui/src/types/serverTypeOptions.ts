export enum ServerType {
  None = '',
  PostgreSQL = 'PostgreSQL',
  MSSQLServer = 'MS SQL Server'
}

// Only server types with a provider on the API are offered. MS SQL Server stays in
// the enum (the API knows the name) but is left out here until its provider exists;
// picking it would only fail with "No provider registered".
export const serverTypeOptions = [
  { text: '', value: ServerType.None },
  { text: 'PostgreSQL', value: ServerType.PostgreSQL },
];
