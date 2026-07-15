# SBLMS - Smart Business Lead Management System
## Implementation Plan

---

## Solution Architecture: Clean Architecture (.NET 8)

```
SBLMS/
├── SBLMS.sln
├── src/
│   ├── SBLMS.Api/              → ASP.NET Core Web API (Presentation)
│   ├── SBLMS.Application/      → CQRS (MediatR), Features, DTOs, Validators
│   ├── SBLMS.Domain/           → Entities, Enums, Interfaces (pure domain)
│   └── SBLMS.Infrastructure/   → EF Core, Repositories, Services, Identity
├── frontend/                   → React 18 + TypeScript + Redux Toolkit + MUI
├── mobile/                     → React Native (iOS & Android)
├── tests/                      → Unit & Integration Tests
└── docker/                     → Dockerfiles + docker-compose
```

## Key Tech Stack
- **Backend**: ASP.NET Core 8, MediatR (CQRS), AutoMapper, FluentValidation, EF Core, SignalR, Hangfire
- **Frontend**: React 18, TypeScript, Redux Toolkit + RTK Query, Material UI v5, React Router v6, Recharts
- **Mobile**: React Native, React Navigation v6, Firebase (FCM)
- **Database**: SQL Server
- **Auth**: JWT (15min access + 7-day refresh with rotation)
- **Export**: EPPlus (Excel) + QuestPDF (PDF)

## 10 Implementation Phases

| Phase | Focus | Deliverables |
|-------|-------|-------------|
| **1** | Solution Setup + Auth + DB | All 4 projects, DB schema, JWT login/refresh/logout, seed roles |
| **2** | User Management + RBAC | CRUD users, role assignment, password change, toggle status |
| **3** | Lead Management | Create/Edit/Delete leads, assign, reassign, status tracking, search, import |
| **4** | Follow-ups + Meetings | CRUD follow-ups, schedule meetings, calendar view, reminders |
| **5** | Activities + Notifications | Activity logging, in-app notifications, SignalR real-time, email |
| **6** | Dashboard + Reports | Dashboard stats, charts, conversion/performance reports, Excel/PDF export |
| **7** | Audit Logs + File Upload | Audit trail, file attachments, document management |
| **8** | React Frontend | Full SPA with all pages, responsive design, real-time updates |
| **9** | React Native Mobile | iOS/Android app with offline sync, push notifications, biometrics |
| **10** | Testing + Deployment | Unit/integration tests, Docker, production config, Swagger docs |

## Database Schema (Core Entities)
- **Users** ↔ **Roles** (many-to-many via UserRoles)
- **RefreshTokens** (JWT refresh with rotation)
- **Leads** (status, source, value, priority, assignments)
- **FollowUps** (scheduled, status, notes, outcome)
- **Meetings** (scheduled, location, status)
- **Activities** (type, description, metadata JSON)
- **Notifications** (type, read status, link)
- **AuditLogs** (action, old/new values JSON, IP, user agent)
- **FileAttachments** (file path, entity reference)

## API Endpoints (50+ routes)
- `/api/auth/*` → Login, Refresh, Logout, Profile
- `/api/users/*` → CRUD, Password, Toggle Status
- `/api/leads/*` → CRUD, Assign, Status, Search, Import, Statistics
- `/api/followups/*` → CRUD, Complete, Cancel, Overdue
- `/api/meetings/*` → CRUD, Cancel, Complete, Date Range
- `/api/notifications/*` → List, Read, Delete, Unread Count
- `/api/reports/*` → Dashboard, Conversion, Performance, Export
- `/api/auditlogs/*` → Audit trail (Admin+)
- `/api/activities/*` → Activity log
- `/hubs/notifications` → SignalR real-time

## Frontend (React)
- Redux Toolkit + RTK Query for state/API
- Material UI v5 with custom corporate theme
- React Router v6 with role-based route guards
- Recharts for dashboard visualizations
- React Hook Form + Yup for form validation
- SignalR client for live notifications

## Mobile (React Native)
- React Navigation v6 (Stack + Bottom Tabs)
- AsyncStorage for offline caching
- Firebase Cloud Messaging for push notifications
- Biometric auth (Face ID / Touch ID)

## Phase 1 - Detailed File Manifest

### Domain Layer (`src/SBLMS.Domain/`)
- `SBLMS.Domain.csproj` - Class library targeting net8.0
- `Common/BaseEntity.cs` - Base with Id (Guid), CreatedAt, UpdatedAt
- `Common/AuditableEntity.cs` - Extends BaseEntity with CreatedBy, LastModifiedBy
- `Common/Enums/LeadStatus.cs` - New, Contacted, FollowUp, Interested, MeetingScheduled, ProposalSent, Negotiation, Converted, Lost, Closed
- `Common/Enums/LeadSource.cs` - Website, Referral, SocialMedia, ColdCall, Advertisement, Email, Other
- `Common/Enums/FollowUpStatus.cs` - Pending, Completed, Cancelled, Rescheduled
- `Common/Enums/MeetingStatus.cs` - Scheduled, Completed, Cancelled
- `Common/Enums/UserRole.cs` - SuperAdmin, Admin, Manager, Employee
- `Common/Enums/NotificationType.cs` - Info, Warning, Success, Error, FollowUpReminder, MeetingReminder
- `Common/Enums/ActivityType.cs` - Call, Email, Meeting, Note, StatusChange, Assignment, FollowUp
- `Entities/User.cs` - Email, PasswordHash, FirstName, LastName, PhoneNumber, ProfileImageUrl, IsActive
- `Entities/Role.cs` - Name, Description
- `Entities/UserRole.cs` - UserId, RoleId, AssignedAt, AssignedBy
- `Entities/RefreshToken.cs` - Token, ExpiresAt, CreatedAt, RevokedAt, ReplacedByToken
- `Entities/Lead.cs` - Full lead entity with all customer fields
- `Entities/LeadAssignment.cs` - LeadId, UserId, AssignedAt, AssignedBy, IsActive
- `Entities/FollowUp.cs` - LeadId, UserId, ScheduledDate, Status, Notes, Outcome
- `Entities/Meeting.cs` - LeadId, UserId, Title, Description, ScheduledDate, Duration, Location, Status
- `Entities/Activity.cs` - LeadId, UserId, Type, Description, Metadata (JSON)
- `Entities/Notification.cs` - UserId, Title, Message, Type, IsRead, Link
- `Entities/AuditLog.cs` - UserId, Action, EntityName, EntityId, OldValues, NewValues, IpAddress, UserAgent
- `Entities/FileAttachment.cs` - FileName, FilePath, FileSize, ContentType, EntityType, EntityId, UploadedBy
- `Interfaces/IRepository.cs` - Generic repository with CRUD + query methods
- `Interfaces/IUnitOfWork.cs` - SaveChangesAsync

### Application Layer (`src/SBLMS.Application/`)
- `SBLMS.Application.csproj` - Class library with MediatR, FluentValidation, AutoMapper
- `Common/Models/Result.cs` - Generic Result<T> wrapper
- `Common/Models/PaginatedList.cs` - Paginated response
- `Common/Interfaces/ICurrentUserService.cs` - Get current user ID
- `Common/Interfaces/IJwtService.cs` - Generate JWT tokens
- `Common/Interfaces/IEmailService.cs` - Send email
- `Common/Interfaces/IFileService.cs` - File upload/download
- `Common/Interfaces/INotificationService.cs` - Create/send notifications
- `Common/Interfaces/IAuditService.cs` - Log audit trails
- `Common/Mappings/MappingProfile.cs` - AutoMapper profile
- `Common/Behaviours/ValidationBehavior.cs` - MediatR validation pipeline
- `Common/Behaviours/LoggingBehavior.cs` - MediatR logging pipeline
- `Common/Behaviours/PerformanceBehavior.cs` - MediatR performance tracking
- `Common/Exceptions/ValidationException.cs` - Custom validation error
- `Common/Exceptions/NotFoundException.cs` - Custom not found error
- `Features/Auth/Commands/Login/LoginCommand.cs` - Login command
- `Features/Auth/Commands/Login/LoginCommandValidator.cs` - Login validation
- `Features/Auth/Commands/Login/LoginCommandHandler.cs` - Login handler
- `Features/Auth/Commands/Login/LoginResponse.cs` - Login response DTO
- `Features/Auth/Commands/RefreshToken/RefreshTokenCommand.cs` - Refresh command
- `Features/Auth/Commands/RefreshToken/RefreshTokenCommandHandler.cs` - Refresh handler
- `Features/Auth/Commands/Logout/LogoutCommand.cs` - Logout command
- `Features/Auth/Commands/Logout/LogoutCommandHandler.cs` - Logout handler
- `Features/Auth/Queries/GetCurrentUser/GetCurrentUserQuery.cs` - Get profile
- `Features/Auth/Queries/GetCurrentUser/GetCurrentUserQueryHandler.cs` - Profile handler

### Infrastructure Layer (`src/SBLMS.Infrastructure/`)
- `SBLMS.Infrastructure.csproj` - Class library with EF Core, Hangfire
- `Persistence/SBLMSDbContext.cs` - DbContext with all DbSets
- `Persistence/Configurations/UserConfiguration.cs`
- `Persistence/Configurations/RoleConfiguration.cs`
- `Persistence/Configurations/UserRoleConfiguration.cs`
- `Persistence/Configurations/RefreshTokenConfiguration.cs`
- `Persistence/Configurations/LeadConfiguration.cs`
- `Persistence/Configurations/FollowUpConfiguration.cs`
- `Persistence/Configurations/MeetingConfiguration.cs`
- `Persistence/Configurations/ActivityConfiguration.cs`
- `Persistence/Configurations/NotificationConfiguration.cs`
- `Persistence/Configurations/AuditLogConfiguration.cs`
- `Persistence/Configurations/FileAttachmentConfiguration.cs`
- `Persistence/Seeds/RoleSeeder.cs` - Seed 4 roles
- `Persistence/Seeds/UserSeeder.cs` - Seed default admin
- `Repositories/Repository.cs` - Generic repository implementation
- `Repositories/UserRepository.cs` - User-specific queries
- `Repositories/LeadRepository.cs` - Lead-specific queries
- `Services/JWTService.cs` - JWT token generation + refresh
- `Services/CurrentUserService.cs` - HttpContext user extraction
- `Services/EmailService.cs` - SMTP email sending
- `Services/FileService.cs` - File upload to disk/blob
- `Services/NotificationService.cs` - In-app notification creation
- `Services/AuditService.cs` - Audit log writing
- `Identity/ClaimsPrincipalExtensions.cs` - Claims helpers
- `DependencyInjection.cs` - DI registration for all services

### API Layer (`src/SBLMS.Api/`)
- `SBLMS.Api.csproj` - Web API project
- `Program.cs` - App builder, middleware, DI, Hangfire, Swagger, SignalR, CORS
- `Controllers/AuthController.cs` - Login, Refresh, Logout, Profile
- `Controllers/UsersController.cs` - User CRUD (scaffold)
- `Controllers/LeadsController.cs` - Lead CRUD (scaffold)
- `Controllers/FollowUpsController.cs` - FollowUp CRUD (scaffold)
- `Controllers/MeetingsController.cs` - Meeting CRUD (scaffold)
- `Controllers/NotificationsController.cs` - Notifications (scaffold)
- `Controllers/ReportsController.cs` - Reports (scaffold)
- `Controllers/AuditLogsController.cs` - Audit logs (scaffold)
- `Controllers/ActivitiesController.cs` - Activities (scaffold)
- `Hubs/NotificationHub.cs` - SignalR notification hub
- `Middleware/ExceptionHandlingMiddleware.cs` - Global exception handler
- `Middleware/AuditLogMiddleware.cs` - Request audit logging
- `Middleware/RequestLoggingMiddleware.cs` - Request/response logging
- `Filters/ApiResultFilter.cs` - Uniform API response format
- `Extensions/ClaimsExtensions.cs` - Claims extension methods
- `appsettings.json` - JWT, ConnectionString, Email, FileStorage config
- `appsettings.Development.json` - Dev overrides

### Frontend Scaffold (`frontend/`)
- `package.json` - React 18, TypeScript, Redux Toolkit, MUI, React Router
- `tsconfig.json` - TypeScript config
- `vite.config.ts` - Vite bundler config
- `src/main.tsx` - App entry point
- `src/App.tsx` - Router setup with route guards
- `src/store/index.ts` - Redux store configuration
- `src/store/hooks.ts` - Typed hooks
- `src/api/axiosClient.ts` - Axios with JWT interceptors
- `src/services/tokenService.ts` - Token management
- `src/types/auth.ts` - Auth types
- `src/features/auth/LoginPage.tsx` - Login page
- `src/components/common/AppLayout.tsx` - Main layout shell
- `src/components/common/Sidebar.tsx` - Navigation sidebar

### Mobile Scaffold (`mobile/`)
- `package.json` - React Native dependencies
- `src/App.tsx` - App entry
- `src/navigation/AppNavigator.tsx` - Root navigator
- `src/navigation/AuthNavigator.tsx` - Auth flow
- `src/screens/auth/LoginScreen.tsx` - Login screen

### Docker (`docker/`)
- `Dockerfile.api` - Multi-stage build for API
- `Dockerfile.frontend` - Multi-stage build for React
- `docker-compose.yml` - API + Frontend + SQL Server + Redis

### Root
- `SBLMS.sln` - Solution file
- `.gitignore` - .NET + Node.js + Docker ignores
- `README.md` - Project documentation

## Verification
1. `dotnet build` succeeds for all projects
2. Swagger loads at `/swagger`
3. Auth flow works (login → refresh → logout)
4. CRUD operations for all entities
5. Dashboard shows real statistics
6. Excel/PDF export downloads correctly
7. SignalR delivers real-time notifications
8. Mobile builds for iOS and Android
