# syntax=docker/dockerfile:1

# The whole app in one image: the API serves the built UI, so the browser talks to one origin.
# Build from the repository root:  docker build -t mdbnavigator:local .

# 1. The UI
FROM node:22-alpine AS ui
WORKDIR /ui
COPY mdb-navigator-ui/package.json mdb-navigator-ui/package-lock.json ./
RUN npm ci
COPY mdb-navigator-ui/ ./
# Bundling Monaco needs more memory than Node's default heap.
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN npm run build

# 2. The API, with the UI in wwwroot
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /repo
COPY global.json Directory.Build.props Directory.Packages.props ./
COPY src/ src/
# The NuGet cache is kept between builds; it is not part of any layer.
RUN --mount=type=cache,target=/root/.nuget/packages     dotnet publish src/MDBNavigator.API/MDBNavigator.API.csproj -c Release -o /app/publish /p:UseAppHost=false
COPY --from=ui /ui/dist/ /app/publish/wwwroot/

# 3. What runs
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish/ ./
# The app's SQLite database (ConnectionStrings:AppDb, data/mdbnavigator.db). Owned by the user the app runs as,
# so a new volume mounted here is writable.
RUN mkdir /app/data && chown $APP_UID /app/data
VOLUME /app/data
# Not root. Plain HTTP on 8080: TLS belongs to the proxy in front.
USER $APP_UID
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "MDBNavigator.API.dll"]
