using System.Numerics;

namespace MDBNavigator.Providers.Abstractions.Queries
{
    // The category a .NET value type implies. Every database driver reports .NET types, so this part is shared;
    // a provider calls it and then corrects only what its database knows better (PostgreSQL: json arrives as a string).
    public static class DbTypeCategories
    {
        public static DbTypeCategory FromClrType(Type type)
        {
            type = Nullable.GetUnderlyingType(type) ?? type;

            if (type == typeof(bool)) return DbTypeCategory.Boolean;
            if (type == typeof(string) || type == typeof(char)) return DbTypeCategory.Text;
            if (type == typeof(byte[])) return DbTypeCategory.Binary;
            if (type == typeof(DateTime) || type == typeof(DateTimeOffset) || type == typeof(DateOnly) || type == typeof(TimeOnly))
                return DbTypeCategory.DateTime;
            if (type == typeof(byte) || type == typeof(sbyte) || type == typeof(short) || type == typeof(ushort)
                || type == typeof(int) || type == typeof(uint) || type == typeof(long) || type == typeof(ulong)
                || type == typeof(decimal) || type == typeof(float) || type == typeof(double) || type == typeof(BigInteger))
                return DbTypeCategory.Number;

            return DbTypeCategory.Other;
        }
    }
}
