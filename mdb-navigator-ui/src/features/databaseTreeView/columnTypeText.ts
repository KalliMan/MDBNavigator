// PostgreSQL's long standard type names and the aliases it accepts for them.
const shortNames: Record<string, string> = {
  'character varying': 'varchar',
  'character': 'char',
  'timestamp without time zone': 'timestamp',
  'timestamp with time zone': 'timestamptz',
  'time without time zone': 'time',
  'time with time zone': 'timetz',
}

function withLength(name: string, maxLength?: number): string {
  return typeof maxLength === 'number' && maxLength > 0 ? `${name}(${maxLength})` : name
}

// A column's type as the tree shows it: lower-case, with PostgreSQL's long standard names shortened to the
// aliases PostgreSQL itself accepts. Names it doesn't know are only lower-cased.
export function shortTypeName(dataType: string, maxLength?: number): string {
  const lower = dataType.toLowerCase()
  return withLength(shortNames[lower] ?? lower, maxLength)
}

// The same without shortening, for the tooltip.
export function fullTypeName(dataType: string, maxLength?: number): string {
  return withLength(dataType.toLowerCase(), maxLength)
}
