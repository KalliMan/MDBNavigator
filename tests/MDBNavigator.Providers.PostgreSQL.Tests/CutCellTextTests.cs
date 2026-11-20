namespace MDBNavigator.Providers.PostgreSQL.Tests
{
    public class CutCellTextTests
    {
        [Fact]
        public void Text_keeps_its_beginning_and_says_how_large_it_was()
            => Assert.Equal("abc… [cut: 196 KB in total]", CutCellText.For("abc", 200_000));

        [Fact]
        public void A_value_without_a_preview_shows_only_its_size()
            => Assert.Equal("[too large to show: 98 KB]", CutCellText.For(null, 100_000));

        [Theory]
        [InlineData(1025, "2 KB")]
        [InlineData(200_000, "196 KB")]
        [InlineData(1_048_576, "1.0 MB")]
        [InlineData(300_000_000, "286.1 MB")]
        public void Sizes_are_in_KB_below_a_megabyte_and_MB_from_there(long bytes, string expected)
            => Assert.Equal(expected, CutCellText.Size(bytes));
    }
}
