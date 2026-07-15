FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src
COPY ["src/SBLMS.Api/SBLMS.Api.csproj", "SBLMS.Api/"]
COPY ["src/SBLMS.Application/SBLMS.Application.csproj", "SBLMS.Application/"]
COPY ["src/SBLMS.Domain/SBLMS.Domain.csproj", "SBLMS.Domain/"]
COPY ["src/SBLMS.Infrastructure/SBLMS.Infrastructure.csproj", "SBLMS.Infrastructure/"]
RUN dotnet restore "SBLMS.Api/SBLMS.Api.csproj" -r linux-musl-x64 --no-cache
COPY src/ .
WORKDIR "/src/SBLMS.Api"
RUN dotnet publish "SBLMS.Api.csproj" -c Release -o /app/publish -r linux-musl-x64 --self-contained false /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
RUN mkdir -p /app/Uploads
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1
ENV ASPNETCORE_ENVIRONMENT=Production
ENTRYPOINT ["dotnet", "SBLMS.Api.dll"]
