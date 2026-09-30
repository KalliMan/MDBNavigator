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

COPY ["Presentation/MDBNavigator.API/MDBNavigator.API.csproj", "Presentation/MDBNavigator.API/"]
COPY ["Application/MDBNavigator.BL/MDBNavigator.BL.csproj", "Application/MDBNavigator.BL/"]
COPY ["Infrastructure/MDBNavigator.DAL/MDBNavigator.DAL.csproj", "Infrastructure/MDBNavigator.DAL/"]
COPY ["Domain/MDBNavigator.DAL.Interfaces/MDBNavigator.DAL.Interfaces.csproj", "Domain/MDBNavigator.DAL.Interfaces/"]
COPY ["Domain/Models/Models.csproj", "Domain/Models/"]
COPY ["Infrastructure/MDBNavigator.PostgreSQL/MDBNavigator.PostgreSQL.csproj", "Infrastructure/MDBNavigator.PostgreSQL/"]


RUN dotnet restore "Presentation/MDBNavigator.API/MDBNavigator.API.csproj"

COPY . .

# copy the built UI into the API wwwroot before publishing
RUN rm -rf Presentation/MDBNavigator.API/wwwroot/* || true
RUN mkdir -p Presentation/MDBNavigator.API/wwwroot

# **Important: use absolute path from the ui-build stage**
COPY --from=ui-build /src/mdb-navigator-ui/dist/ Presentation/MDBNavigator.API/wwwroot/
# (optional) list what's in wwwroot for debugging
RUN ls -la Presentation/MDBNavigator.API/wwwroot || true

WORKDIR "/src/Presentation/MDBNavigator.API"
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