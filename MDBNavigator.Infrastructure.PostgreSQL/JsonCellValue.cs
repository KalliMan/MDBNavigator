using System.Collections;
using System.Globalization;

namespace MDBNavigator.Infrastructure.PostgreSQL
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
            string or bool or byte or sbyte or short or ushort or int or uint
                or Guid or DateTime or DateTimeOffset or DateOnly or TimeOnly => value,
            long or ulong or decimal => Convert.ToString(value, CultureInfo.InvariantCulture),
            double d => double.IsFinite(d) ? d : d.ToString(CultureInfo.InvariantCulture),
            float f => float.IsFinite(f) ? f : f.ToString(CultureInfo.InvariantCulture),
            byte[] bytes => "\\x" + Convert.ToHexString(bytes).ToLowerInvariant(),
            // hstore arrives as a dictionary; JSON objects represent it directly.
            IDictionary dictionary => dictionary,
            Array array => array.Cast<object?>().Select(From).ToArray(),
            _ => Convert.ToString(value, CultureInfo.InvariantCulture)
        };
    }
}
