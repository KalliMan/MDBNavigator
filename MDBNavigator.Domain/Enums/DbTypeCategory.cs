namespace MDBNavigator.Domain.Enums
{
    // What kind of value a result column holds, the same for every database server. The UI decides how to sort,
    // format and show a column from this alone, never from a server's own type names.
    // Keep in sync with the UI type DbTypeCategory (mdb-navigator-ui/src/models/databaseCommand/result/dbTypeCategory.ts).
    public enum DbTypeCategory
    {
        Number,
        Text,
        Boolean,
        DateTime,
        Json,
        Binary,
        // Everything else (uuid, arrays, intervals, ranges, network addresses, ...). The UI treats it as text.
        Other
    }
}
