using System.Collections;
using System.Globalization;

namespace MDBNavigator.Providers.PostgreSQL
{
    // Result cells are sent to the browser as JSON. This turns each database value into something JSON can carry
    // without losing information: values JavaScript can't represent exactly (decimal/numeric, 64-bit integers,
    // NaN/Infinity) become text, binary becomes PostgreSQL hex notation, and values without a JSON form
    // (intervals, ranges, inet, ...) use their text representation.
    // Keep in sync with the UI type CellValue (mdb-navigator-ui/src/models/databaseCommand/result/cellValue.ts):
    // every shape produced here must be one of its cases.
    internal static class JsonCellValue
    {
        public static object? From(object? value) => value switch
        {
            null or DBNull => null,
            // Dates and times are written the way PostgreSQL writes them, so the grid, the filter, copy and export all
            // show what psql shows. Fraction digits are dropped when zero, as PostgreSQL does.
            DateTime dt => dt.ToString("yyyy-MM-dd HH:mm:ss.FFFFFF", CultureInfo.InvariantCulture)
                // Npgsql reads "timestamp with time zone" as UTC, whatever the session's time zone is.
                + (dt.Kind == DateTimeKind.Utc ? "+00" : ""),
            // Only "time with time zone" arrives as a DateTimeOffset, on a made-up date: the time and the offset are the value.
            DateTimeOffset dto => dto.ToString("HH:mm:ss.FFFFFF", CultureInfo.InvariantCulture) + OffsetText(dto.Offset),
            TimeOnly t => t.ToString("HH:mm:ss.FFFFFF", CultureInfo.InvariantCulture),
            string or bool or byte or sbyte or short or ushort or int or uint
                or Guid or DateOnly => value,
            long or ulong or decimal => Convert.ToString(value, CultureInfo.InvariantCulture),
            double d => double.IsFinite(d) ? d : d.ToString(CultureInfo.InvariantCulture),
            float f => float.IsFinite(f) ? f : f.ToString(CultureInfo.InvariantCulture),
            byte[] bytes => "\\x" + Convert.ToHexString(bytes).ToLowerInvariant(),
            // hstore arrives as a dictionary; JSON objects represent it directly.
            IDictionary dictionary => dictionary,
            Array array => array.Cast<object?>().Select(From).ToArray(),
            _ => Convert.ToString(value, CultureInfo.InvariantCulture)
        };

        // PostgreSQL's offset form: sign, two-digit hours, and minutes only when they are not zero (+02, +00, -03:30).
        private static string OffsetText(TimeSpan offset)
        {
            var sign = offset < TimeSpan.Zero ? "-" : "+";
            var abs = offset.Duration();
            var text = sign + abs.Hours.ToString("00", CultureInfo.InvariantCulture);
            return abs.Minutes == 0 ? text : text + ":" + abs.Minutes.ToString("00", CultureInfo.InvariantCulture);
        }
    }
}
