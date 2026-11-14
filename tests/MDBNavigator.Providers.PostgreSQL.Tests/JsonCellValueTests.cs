namespace MDBNavigator.Providers.PostgreSQL.Tests
{
    public class JsonCellValueTests
    {
        [Fact]
        public void A_timestamp_is_written_with_a_space_and_its_fraction()
        {
            var value = new DateTime(2026, 1, 22, 15, 19, 1).AddTicks(7853090);
            Assert.Equal<object?>("2026-01-22 15:19:01.785309", JsonCellValue.From(value));
        }

        [Fact]
        public void A_timestamp_without_a_fraction_has_no_decimal_point()
        {
            Assert.Equal<object?>("2026-01-22 15:19:01", JsonCellValue.From(new DateTime(2026, 1, 22, 15, 19, 1)));
        }

        [Fact]
        public void Trailing_zeros_of_the_fraction_are_dropped()
        {
            var value = new DateTime(2026, 1, 22, 15, 19, 1).AddMilliseconds(500);
            Assert.Equal<object?>("2026-01-22 15:19:01.5", JsonCellValue.From(value));
        }

        [Fact]
        public void A_utc_timestamp_ends_with_a_zero_offset()
        {
            var value = new DateTime(2026, 1, 22, 13, 19, 1, DateTimeKind.Utc).AddTicks(7853090);
            Assert.Equal<object?>("2026-01-22 13:19:01.785309+00", JsonCellValue.From(value));
        }

        [Fact]
        public void A_time_with_time_zone_drops_the_made_up_date_and_keeps_the_offset()
        {
            var value = new DateTimeOffset(1, 1, 2, 15, 19, 1, TimeSpan.FromHours(2)).AddTicks(7853090);
            Assert.Equal<object?>("15:19:01.785309+02", JsonCellValue.From(value));
        }

        [Fact]
        public void A_negative_offset_with_minutes_is_written_with_its_minutes()
        {
            var value = new DateTimeOffset(1, 1, 2, 15, 19, 1, new TimeSpan(-3, -30, 0));
            Assert.Equal<object?>("15:19:01-03:30", JsonCellValue.From(value));
        }

        [Fact]
        public void A_zero_offset_is_written_as_plus_zero()
        {
            var value = new DateTimeOffset(1, 1, 2, 15, 19, 1, TimeSpan.Zero);
            Assert.Equal<object?>("15:19:01+00", JsonCellValue.From(value));
        }

        [Fact]
        public void A_time_is_written_with_six_fraction_digits_at_most()
        {
            var value = new TimeOnly(15, 19, 1).Add(TimeSpan.FromTicks(7853090));
            Assert.Equal<object?>("15:19:01.785309", JsonCellValue.From(value));
        }

        [Fact]
        public void A_time_without_a_fraction_has_no_decimal_point()
        {
            Assert.Equal<object?>("15:19:01", JsonCellValue.From(new TimeOnly(15, 19, 1)));
        }

        [Fact]
        public void A_date_is_passed_through()
        {
            var value = new DateOnly(1955, 10, 11);
            Assert.Equal<object?>(value, JsonCellValue.From(value));
        }

        [Fact]
        public void Array_elements_are_converted_too()
        {
            var result = JsonCellValue.From(new[] { new DateTime(2026, 1, 22, 15, 19, 1) });
            var array = Assert.IsType<object?[]>(result);
            Assert.Equal<object?>("2026-01-22 15:19:01", Assert.Single(array));
        }

        [Fact]
        public void Null_and_DBNull_become_null()
        {
            Assert.Null(JsonCellValue.From(null));
            Assert.Null(JsonCellValue.From(DBNull.Value));
        }

        [Fact]
        public void A_64_bit_integer_becomes_text()
        {
            Assert.Equal<object?>("9007199254740993", JsonCellValue.From(9007199254740993L));
        }
    }
}
