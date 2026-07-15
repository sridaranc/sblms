name: SBLMS - Smart Business Lead Management System

## Overview

Full-stack Lead Management System with ASP.NET Core 8 backend, React 18 frontend, and React Native mobile app.

## Tech Stack

- **Backend**: ASP.NET Core 8, CQRS with MediatR, Entity Framework Core 8, SQL Server
- **Frontend**: React 18, TypeScript, Redux Toolkit, Material UI
- **Mobile**: React Native (iOS/Android)
- **Infrastructure**: Docker, Hangfire, SignalR

## Features

- JWT Authentication with Refresh Tokens
- Lead Management (CRUD, Status, Assignment)
- Follow-up Tracking
- Meeting Scheduling
- Dashboard & Reports with Excel/PDF Export
- Real-time Notifications (SignalR)
- Audit Logging
- Role-based Access Control (SuperAdmin, Admin, Manager, Employee)

## Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd SBLMS

# Start all services
docker-compose -f docker/docker-compose.yml up -d

# Access:
# - API: http://localhost:8080
# - Swagger: http://localhost:8080/swagger
# - Frontend: http://localhost:3000
# - SQL Server: localhost:1433
```

### Default Login

- **Email**: admin@sblms.com
- **Password**: Admin@123

### Local Development

#### Backend
```bash
dotnet restore
dotnet run --project src/SBLMS.Api
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Mobile
```bash
cd mobile
npm install
npx react-native run-ios  # or run-android
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh-token` - Refresh token
- `POST /api/auth/logout` - Logout

### Leads
- `GET /api/leads` - Get all leads (paginated)
- `POST /api/leads` - Create lead
- `GET /api/leads/{id}` - Get lead by ID
- `PUT /api/leads/{id}` - Update lead
- `DELETE /api/leads/{id}` - Delete lead
- `PUT /api/leads/{id}/status` - Update status
- `PUT /api/leads/{id}/assign` - Assign lead

### Follow-ups
- `GET /api/followups` - Get all follow-ups
- `POST /api/followups` - Create follow-up
- `PUT /api/followups/{id}/complete` - Complete follow-up
- `PUT /api/followups/{id}/cancel` - Cancel follow-up

### Meetings
- `GET /api/meetings` - Get all meetings
- `POST /api/meetings` - Create meeting
- `PUT /api/meetings/{id}/complete` - Complete meeting
- `PUT /api/meetings/{id}/cancel` - Cancel meeting

### Reports
- `GET /api/reports/dashboard` - Dashboard stats
- `GET /api/reports/leads-by-status` - Leads by status report
- `GET /api/reports/conversion` - Conversion report
- `GET /api/reports/performance` - Performance report
- `GET /api/reports/export/leads/excel` - Export leads to Excel
- `GET /api/reports/export/performance/pdf` - Export performance to PDF

## Project Structure

```
SBLMS/
├── src/
│   ├── SBLMS.Api/           # Web API
│   ├── SBLMS.Application/   # Business Logic (CQRS)
│   ├── SBLMS.Domain/        # Domain Entities
│   └── SBLMS.Infrastructure/ # Data Access, Services
├── tests/
│   ├── SBLMS.Domain.Tests/
│   ├── SBLMS.Application.Tests/
│   └── SBLMS.Api.Tests/
├── frontend/                 # React 18 App
├── mobile/                   # React Native App
├── docker/                   # Docker Configuration
└── .github/workflows/        # CI/CD
```

## Testing

```bash
# Run all tests
dotnet test

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"
```

## License

MIT
