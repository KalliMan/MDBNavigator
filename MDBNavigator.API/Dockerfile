FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base

WORKDIR /app

EXPOSE 3000
EXPOSE 3001
EXPOSE 3002

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Development
WORKDIR /src

COPY ["MDBNavigator.API/MDBNavigator.API.csproj", "MDBNavigator.API/"]
COPY ["MDBNavigator.BL/MDBNavigator.BL.csproj", "MDBNavigator.BL/"]
COPY ["MDBNavigator.DAL/MDBNavigator.DAL.csproj", "MDBNavigator.DAL/"]
COPY ["MDBNavigator.DAL.Interfaces/MDBNavigator.DAL.Interfaces.csproj", "MDBNavigator.DAL.Interfaces/"]
COPY ["Models/Models.csproj", "Models/"]
COPY ["MDBNavigator.PostgreSQL/MDBNavigator.PostgreSQL.csproj", "MDBNavigator.PostgreSQL/"]

RUN dotnet restore "MDBNavigator.API/MDBNavigator.API.csproj"

COPY . .

WORKDIR "/src/MDBNavigator.API"
RUN dotnet build "MDBNavigator.API.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Development
RUN dotnet publish "MDBNavigator.API.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# This stage is used in production or when running from VS in regular mode (Default when not using the Debug configuration)
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "MDBNavigator.API.dll"]