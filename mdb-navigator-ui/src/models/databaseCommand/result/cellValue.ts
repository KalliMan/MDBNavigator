// One cell of a streamed result, exactly as the server sends it.
// Keep in sync with MDBNavigator.Infrastructure.PostgreSQL/JsonCellValue.cs, which produces these shapes:
// - string: text, and values JSON can't carry exactly or has no form for (numeric, bigint, NaN/Infinity,
//   dates and times, uuid, bytea as \x hex, interval, inet, ranges, ...)
// - number: integers and finite floats
// - boolean
// - null: SQL NULL
// - array: PostgreSQL arrays (element by element)
// - object: hstore (key/value pairs)
export type CellValue =
  | string
  | number
  | boolean
  | null
  | CellValue[]
  | { [key: string]: CellValue };
