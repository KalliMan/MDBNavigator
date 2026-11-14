using System.Runtime.CompilerServices;
using System.Xml.Linq;

namespace MDBNavigator.Architecture.Tests
{
    // Which project may reference which. A new project, or a new reference, has to be added here on purpose.
    public class ProjectReferenceTests
    {
        private static readonly Dictionary<string, string[]> Allowed = new()
        {
            ["MDBNavigator.SharedKernel"] = [],
            ["MDBNavigator.Providers.Abstractions"] = [],
            ["MDBNavigator.Providers.PostgreSQL"] = ["MDBNavigator.Providers.Abstractions"],
            ["MDBNavigator.Accounts"] = ["MDBNavigator.SharedKernel"],
            ["MDBNavigator.Connections.Contracts"] = ["MDBNavigator.Providers.Abstractions"],
            ["MDBNavigator.Connections.Core"] = ["MDBNavigator.Connections.Contracts", "MDBNavigator.SharedKernel"],
            ["MDBNavigator.Connections.Infrastructure"] = ["MDBNavigator.Connections.Core"],
            ["MDBNavigator.Workbench.Core"] = ["MDBNavigator.Connections.Contracts", "MDBNavigator.SharedKernel"],
            ["MDBNavigator.Workbench.Infrastructure"] = ["MDBNavigator.Workbench.Core"],
            ["MDBNavigator.API"] =
            [
                "MDBNavigator.Accounts",
                "MDBNavigator.Connections.Infrastructure",
                "MDBNavigator.Providers.PostgreSQL",
                "MDBNavigator.Workbench.Infrastructure",
            ],
        };

        // Packages that Core, Contracts and the SharedKernel must not use: they would tie the rules to the web or to a database.
        private static readonly string[] ForbiddenPackagePrefixes = ["Microsoft.AspNetCore", "Microsoft.EntityFrameworkCore"];
        private static readonly string[] ForbiddenPackages = ["EFCore.NamingConventions", "Npgsql", "Dapper"];

        public static IEnumerable<object[]> ProjectNames() => Allowed.Keys.Select(name => new object[] { name });

        [Fact]
        public void Every_project_under_src_is_in_the_table()
        {
            var found = ProjectFiles().Keys.OrderBy(name => name, StringComparer.Ordinal).ToList();
            var expected = Allowed.Keys.OrderBy(name => name, StringComparer.Ordinal).ToList();

            var notInTable = found.Except(expected).ToList();
            var notOnDisk = expected.Except(found).ToList();

            Assert.True(notInTable.Count == 0 && notOnDisk.Count == 0,
                $"The projects under src/ and the table in ProjectReferenceTests differ. " +
                $"Not in the table: [{string.Join(", ", notInTable)}]. In the table but not under src/: [{string.Join(", ", notOnDisk)}].");
        }

        [Theory]
        [MemberData(nameof(ProjectNames))]
        public void Each_project_references_only_what_the_rules_allow(string project)
        {
            var files = ProjectFiles();
            if (!files.TryGetValue(project, out var file))
            {
                Assert.Fail($"{project} is in the table but there is no {project}.csproj under src/.");
            }

            var actual = References(file).OrderBy(name => name, StringComparer.Ordinal).ToList();
            var allowed = Allowed[project].OrderBy(name => name, StringComparer.Ordinal).ToList();

            var extra = actual.Except(allowed).ToList();
            var missing = allowed.Except(actual).ToList();

            Assert.True(extra.Count == 0 && missing.Count == 0,
                $"{project} has the wrong project references. " +
                $"Extra (not allowed): [{string.Join(", ", extra)}]. Missing (allowed but not referenced): [{string.Join(", ", missing)}].");
        }

        [Fact]
        public void Core_and_contract_projects_are_free_of_web_and_database_packages()
        {
            var problems = new List<string>();

            foreach (var (name, file) in ProjectFiles())
            {
                var isPure = name is "MDBNavigator.SharedKernel" or "MDBNavigator.Providers.Abstractions"
                    || name.EndsWith(".Core", StringComparison.Ordinal)
                    || name.EndsWith(".Contracts", StringComparison.Ordinal);
                if (!isPure)
                {
                    continue;
                }

                var document = XDocument.Load(file);

                foreach (var _ in document.Descendants("FrameworkReference"))
                {
                    problems.Add($"{name} has a FrameworkReference");
                }

                foreach (var package in document.Descendants("PackageReference").Select(e => (string?)e.Attribute("Include") ?? ""))
                {
                    var forbidden = ForbiddenPackages.Contains(package, StringComparer.Ordinal)
                        || ForbiddenPackagePrefixes.Any(prefix => package.StartsWith(prefix, StringComparison.Ordinal));
                    if (forbidden)
                    {
                        problems.Add($"{name} uses the package {package}");
                    }
                }
            }

            Assert.True(problems.Count == 0,
                "Core, Contracts, the SharedKernel and Providers.Abstractions must not use ASP.NET Core, EF Core, Npgsql or Dapper: "
                + string.Join("; ", problems) + ".");
        }

        // Project name (file name without extension) to its path, for every .csproj under src/. bin and obj are skipped: they can
        // hold generated project files.
        private static Dictionary<string, string> ProjectFiles()
        {
            var src = Path.Combine(RepositoryRoot(), "src");
            return Directory.EnumerateFiles(src, "*.csproj", SearchOption.AllDirectories)
                .Where(file => !IsInBuildFolder(Path.GetRelativePath(src, file)))
                .ToDictionary(file => Path.GetFileNameWithoutExtension(file), file => file, StringComparer.Ordinal);
        }

        private static bool IsInBuildFolder(string relativePath) =>
            relativePath.Split(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar).Any(part => part is "bin" or "obj");

        // The referenced projects' names. Include paths use backslashes in the project files, whatever the OS.
        private static IEnumerable<string> References(string projectFile) =>
            XDocument.Load(projectFile).Descendants("ProjectReference")
                .Select(e => (string?)e.Attribute("Include") ?? "")
                .Select(include => Path.GetFileNameWithoutExtension(include.Replace('\\', '/')));

        // Found through this source file's own path, not the output folder: tests are often built into a scratch folder with -o,
        // which is not inside the repository.
        private static string RepositoryRoot([CallerFilePath] string path = "")
        {
            var directory = new DirectoryInfo(Path.GetDirectoryName(path)!);
            while (directory is not null && !File.Exists(Path.Combine(directory.FullName, "MDBNavigator.slnx")))
            {
                directory = directory.Parent;
            }

            return directory?.FullName ?? throw new InvalidOperationException($"MDBNavigator.slnx not found above {path}.");
        }
    }
}
