FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base

WORKDIR /app

EXPOSE 3000
EXPOSE 3001
EXPOSE 3002

# =========================
# 1️ Build Vite UI
# =========================
FROM node:22.12.0 AS ui-build
WORKDIR /src/mdb-navigator-ui

COPY mdb-navigator-ui/package.json mdb-navigator-ui/package-lock.json ./
RUN npm ci

# copy source and build
COPY mdb-navigator-ui/ .
ENV NODE_ENV=production
RUN npm run build

# debug (optional) — list dist to help during early debugging
RUN ls -la /src/mdb-navigator-ui && ls -la /src/mdb-navigator-ui/dist || true

# =========================
# 2️ Build .NET solution
# =========================

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

COPY ["MDBNavigator.API/MDBNavigator.API.csproj", "MDBNavigator.API/"]
COPY ["MDBNavigator.BL/MDBNavigator.BL.csproj", "MDBNavigator.BL/"]
COPY ["MDBNavigator.DAL/MDBNavigator.DAL.csproj", "MDBNavigator.DAL/"]
COPY ["MDBNavigator.DAL.Interfaces/MDBNavigator.DAL.Interfaces.csproj", "MDBNavigator.DAL.Interfaces/"]
COPY ["Models/Models.csproj", "Models/"]
COPY ["MDBNavigator.PostgreSQL/MDBNavigator.PostgreSQL.csproj", "MDBNavigator.PostgreSQL/"]


RUN dotnet restore "MDBNavigator.API/MDBNavigator.API.csproj"

COPY . .

# copy the built UI into the API wwwroot before publishing
RUN rm -rf MDBNavigator.API/wwwroot/* || true
RUN mkdir -p MDBNavigator.API/wwwroot

# **Important: use absolute path from the ui-build stage**
COPY --from=ui-build /src/mdb-navigator-ui/dist/ MDBNavigator.API/wwwroot/
# (optional) list what's in wwwroot for debugging
RUN ls -la MDBNavigator.API/wwwroot || true

WORKDIR "/src/MDBNavigator.API"
RUN dotnet build "MDBNavigator.API.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "MDBNavigator.API.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false


# =========================
# 3️ Runtime image
# =========================

# This stage is used in production or when running from VS in regular mode (Default when not using the Debug configuration)
FROM base AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://0.0.0.0:8080
EXPOSE 8080

COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "MDBNavigator.API.dll"]