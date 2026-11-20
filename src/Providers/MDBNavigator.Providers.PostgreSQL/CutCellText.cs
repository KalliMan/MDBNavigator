using System.Globalization;

namespace MDBNavigator.Providers.PostgreSQL
{
    // What a value too large for QueryExecution:MaxRowBytes becomes. A plain string, so the cell value contract
    // (JsonCellValue, cellValue.ts) doesn't change: text keeps its beginning, anything else shows only its size.
    internal static class CutCellText
    {
        public const int PreviewChars = 1000;

        public static string For(string? preview, long totalBytes) =>
            preview is null
                ? $"[too large to show: {Size(totalBytes)}]"
                : $"{preview}… [cut: {Size(totalBytes)} in total]";

        // KB below a megabyte, rounded up so a cut value never reads "0 KB"; MB with one decimal from there.
        internal static string Size(long bytes) =>
            bytes < 1024 * 1024
                ? string.Create(CultureInfo.InvariantCulture, $"{Math.Ceiling(bytes / 1024.0):0} KB")
                : string.Create(CultureInfo.InvariantCulture, $"{bytes / (1024.0 * 1024.0):0.0} MB");
    }
}
