export enum ServerType {
  None = '',
  PostgreSQL = 'PostgreSQL',
  MSSQLServer = 'MS SQL Server'
}

export const serverTypeOptions = [
  { text: '', value: ServerType.None },
  { text: 'PostgreSQL', value: ServerType.PostgreSQL },
  { text: 'MS SQL Server', value: ServerType.MSSQLServer },
];
