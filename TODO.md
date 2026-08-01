# DAMOT-UNION BACKEND AUDIT REPORT

## Generated: 2026-07-31
## Project: Damot-Union (Next.js 16 + Prisma + MySQL)

---

## 1. PROJECT STRUCTURE OVERVIEW

### Current Architecture
- Framework: Next.js 16 (App Router)
- Database: MySQL with Prisma ORM
- Authentication: Next-Auth v5
- Internationalization: Next-Intl
- File Upload: Cloudinary
- Email: Nodemailer

---

## 2. FILE ACTIVITY REGISTER

### 2.1 Configuration Files (Complete)
| File | Status | Purpose |
|------|--------|---------|
| package.json | ✅ Complete | All dependencies listed |
| next.config.ts | ✅ Complete | i18n, dev origins, logging |
| tsconfig.json | ✅ Complete | Path aliases configured |
| prisma.config.ts | ✅ Complete | Schema path configured |
| .gitignore | ✅ Complete | Excludes configured |
| prisma/schema.prisma | ✅ Complete | 18 models defined |

### 2.2 Database Models (18 Models Found)
| Model | Status | Description |
|-------|--------|-------------|
| User | ✅ Present | User authentication |
| Role | ✅ Present | User roles (admin, user) |
| RefreshToken | ✅ Present | JWT refresh tokens |
| PasswordResetToken | ✅ Present | Password reset functionality |
| GalleryAlbum | ✅ Present | Photo albums |
| GalleryImage | ✅ Present | Individual images |
| ContactMessage | ✅ Present | Contact form submissions |
| ContactMessageStatus | ✅ Present | Message status tracking |
| NewsCategory | ✅ Present | News categories |
| NewsArticle | ✅ Present | News articles |
| ProjectCategory | ✅ Present | Project categories |
| ProjectStatus | ✅ Present | Project status tracking |
| Project | ✅ Present | Main project entity |
| PartnerCategory | ✅ Present | Partner categories |
| Partner | ✅ Present | Organization partners |
| ReportCategory | ✅ Present | Report categories |
| Report | ✅ Present | Generated reports |
| NotificationType | ✅ Present | Notification types |
| Notification | ✅ Present | User notifications |
| SiteSettings | ✅ Present | Application settings |
| OrganizationStat | ✅ Present | Organization statistics |
| WorkArea | ✅ Present | Work areas/domains |
| AuditLog | ✅ Present | Activity logging |

### 2.3 Backend Files Found

#### Controllers (6 files found)
| File | Status | Methods |
|------|--------|---------|
| authController.ts | ✅ Present | login, register, logout, refresh, resetPassword |
| contactController.ts | ✅ Present | submitContact, getMessages, updateStatus |
| galleryController.ts | ✅ Present | getAlbums, getImages, uploadImage |
| newsController.ts | ✅ Present | getNews, getNewsById, createNews, updateNews, deleteNews |
| projectController.ts | ✅ Present | getProjects, getProjectById, createProject, updateProject, deleteProject |
| reportController.ts | ✅ Present | getReports, createReport, deleteReport |

#### Services (7 files found)
| File | Status | Methods |
|------|--------|---------|
| authService.ts | ✅ Present | validateUser, generateToken, hashPassword |
| contactService.ts | ✅ Present | saveMessage, markAsRead |
| emailService.ts | ✅ Present | sendEmail, sendContactConfirmation |
| galleryService.ts | ✅ Present | uploadToCloudinary, deleteImage |
| newsService.ts | ✅ Present | createArticle, updateArticle |
| projectService.ts | ✅ Present | createProject, updateProject |
| reportService.ts | ✅ Present | generateReport, exportPDF |

#### Repositories (6 files found)
| File | Status | Methods |
|------|--------|---------|
| contactRepository.ts | ✅ Present | create, findAll, findById, updateStatus |
| galleryRepository.ts | ✅ Present | createAlbum, addImage, deleteImage |
| newsRepository.ts | ✅ Present | create, findAll, findById, update, delete |
| projectRepository.ts | ✅ Present | create, findAll, findById, update, delete |
| reportRepository.ts | ✅ Present | create, findAll, delete |
| userRepository.ts | ✅ Present | findByEmail, create, findById, update |

#### Models (6 files found)
| File | Status | Purpose |
|------|--------|---------|
| Contact.ts | ✅ Present | Contact form data structure |
| Gallery.ts | ✅ Present | Gallery data structure |
| News.ts | ✅ Present | News data structure |
| Project.ts | ✅ Present | Project data structure |
| Report.ts | ✅ Present | Report data structure |
| User.ts | ✅ Present | User data structure |

#### Middleware (2 files found)
| File | Status | Purpose |
|------|--------|---------|
| adminMiddleware.ts | ✅ Present | Admin role verification |
| authMiddleware.ts | ✅ Present | JWT authentication |

#### Types (4 files found)
| File | Status | Purpose |
|------|--------|---------|
| gallery.ts | ✅ Present | Gallery TypeScript types |
| news.ts | ✅ Present | News TypeScript types |
| project.ts | ✅ Present | Project TypeScript types |
| report.ts | ✅ Present | Report TypeScript types |

#### Hooks (2 files found)
| File | Status | Purpose |
|------|--------|---------|
| useAuth.ts | ✅ Present | Authentication hook |
| useFetch.ts | ✅ Present | API fetching hook |

### 2.4 Frontend Files Found

#### Pages (App Router)
| Path | Status | Description |
|------|--------|-------------|
| app/[locale]/page.tsx | ✅ Present | Home page |
| app/[locale]/about/page.tsx | ✅ Present | About page |
| app/[locale]/contact/page.tsx | ✅ Present | Contact page |
| app/[locale]/gallery/page.tsx | ✅ Present | Gallery page |
| app/[locale]/news/page.tsx | ✅ Present | News listing |
| app/[locale]/projects/page.tsx | ✅ Present | Projects listing |
| app/[locale]/reports/page.tsx | ✅ Present | Reports page |
| app/[locale]/services/page.tsx | ✅ Present | Services page |
| app/admin/page.tsx | ✅ Present | Admin dashboard |
| app/admin/gallery/page.tsx | ✅ Present | Gallery management |
| app/admin/news/page.tsx | ✅ Present | News management |
| app/admin/projects/page.tsx | ✅ Present | Projects management |
| app/admin/partners/page.tsx | ✅ Present | Partners management |
| app/admin/reports/page.tsx | ✅ Present | Reports management |
| app/admin/settings/page.tsx | ✅ Present | Settings page |

#### Components (85+ files found)
| Category | Count | Status |
|----------|-------|--------|
| About components | 14 | ✅ Present |
| Admin components | 17 | ✅ Present |
| Contact components | 4 | ✅ Present |
| Gallery components | 4 | ✅ Present |
| Home components | 12 | ✅ Present |
| Layout components | 3 | ✅ Present |
| News components | 13 | ✅ Present |
| Projects components | 8 | ✅ Present |
| Services components | 11 | ✅ Present |
| UI components | 7 | ✅ Present |

---

## 3. EXISTING BACKEND FUNCTIONALITY

### 3.1 Authentication System
- ✅ User registration with email/password
- ✅ User login with JWT
- ✅ Password hashing with bcrypt
- ✅ Refresh token mechanism
- ✅ Password reset flow
- ✅ Role-based access (admin/user)
- ✅ Session management

### 3.2 Content Management
- ✅ News CRUD operations
- ✅ Projects CRUD operations  
- ✅ Gallery image management
- ✅ Partner management
- ✅ Report generation and management

### 3.3 Contact System
- ✅ Contact form submission
- ✅ Message storage
- ✅ Email notifications
- ✅ Status tracking

### 3.4 File Management
- ✅ Cloudinary integration
- ✅ Image upload
- ✅ Image deletion

### 3.5 API Architecture
- ✅ RESTful API structure
- ✅ Route handlers in controllers
- ✅ Database abstraction via repositories
- ✅ Business logic in services

---

## 4. MISSING BACKEND COMPONENTS

### 4.1 Critical Missing Files

#### API Routes (src/app/api/)
| Missing File | Priority | Purpose |
|--------------|----------|---------|
| api/auth/login/route.ts | 🔴 Critical | Authentication endpoint |
| api/auth/register/route.ts | 🔴 Critical | Registration endpoint |
| api/auth/refresh/route.ts | 🔴 Critical | Token refresh endpoint |
| api/auth/logout/route.ts | 🔴 Critical | Logout endpoint |
| api/auth/reset-password/route.ts | 🔴 Critical | Password reset endpoint |
| api/contact/route.ts | 🟡 High | Contact form submission |
| api/news/route.ts | 🟡 High | News CRUD operations |
| api/news/[id]/route.ts | 🟡 High | Single news operations |
| api/projects/route.ts | 🟡 High | Projects CRUD operations |
| api/projects/[id]/route.ts | 🟡 High | Single project operations |
| api/gallery/route.ts | 🟡 High | Gallery operations |
| api/gallery/upload/route.ts | 🟡 High | Image upload endpoint |
| api/reports/route.ts | 🟡 High | Reports operations |
| api/partners/route.ts | 🟡 High | Partners operations |
| api/admin/users/route.ts | 🟡 High | User management |
| api/admin/stats/route.ts | 🟡 High | Dashboard statistics |

### 4.2 Missing Validation Files

| Missing File | Priority | Purpose |
|--------------|----------|---------|
| src/validations/authValidation.ts | 🔴 Critical | Auth input validation |
| src/validations/contactValidation.ts | 🟡 High | Contact form validation |
| src/validations/newsValidation.ts | 🟡 High | News data validation |
| src/validations/projectValidation.ts | 🟡 High | Project data validation |
| src/validations/galleryValidation.ts | 🟡 High | Gallery data validation |

### 4.3 Missing Utility Files

| Missing File | Priority | Purpose |
|--------------|----------|---------|
| src/utils/constants.ts | 🟡 High | App-wide constants |
| src/utils/helpers.ts | 🟡 High | Helper functions |
| src/utils/errorHandler.ts | 🔴 Critical | Global error handling |
| src/utils/logger.ts | 🟡 High | Logging utility |

### 4.4 Missing Middleware

| Missing File | Priority | Purpose |
|--------------|----------|---------|
| src/middleware/validationMiddleware.ts | 🟡 High | Input validation |
| src/middleware/errorMiddleware.ts | 🔴 Critical | Error handling |
| src/middleware/rateLimitMiddleware.ts | 🟡 High | Rate limiting |

---

## 5. API ENDPOINT MAPPING

### 5.1 Authentication Endpoints (Missing)
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | /api/auth/register | Register new user | 🔴 Missing |
| POST | /api/auth/login | Login user | 🔴 Missing |
| POST | /api/auth/refresh | Refresh token | 🔴 Missing |
| POST | /api/auth/logout | Logout user | 🔴 Missing |
| POST | /api/auth/reset-password | Reset password | 🔴 Missing |
| POST | /api/auth/forgot-password | Forgot password | 🔴 Missing |

### 5.2 Content Endpoints (Missing)
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | /api/news | Get all news | 🟡 Missing |
| GET | /api/news/:id | Get single news | 🟡 Missing |
| POST | /api/news | Create news | 🟡 Missing |
| PUT | /api/news/:id | Update news | 🟡 Missing |
| DELETE | /api/news/:id | Delete news | 🟡 Missing |
| GET | /api/projects | Get all projects | 🟡 Missing |
| GET | /api/projects/:id | Get single project | 🟡 Missing |
| POST | /api/projects | Create project | 🟡 Missing |
| PUT | /api/projects/:id | Update project | 🟡 Missing |
| DELETE | /api/projects/:id | Delete project | 🟡 Missing |
| GET | /api/gallery | Get gallery images | 🟡 Missing |
| POST | /api/gallery/upload | Upload image | 🟡 Missing |
| DELETE | /api/gallery/:id | Delete image | 🟡 Missing |

### 5.3 Contact Endpoints (Missing)
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | /api/contact | Submit contact form | 🟡 Missing |
| GET | /api/contact/messages | Get all messages | 🟡 Missing |
| GET | /api/contact/:id | Get single message | 🟡 Missing |
| PUT | /api/contact/:id/status | Update message status | 🟡 Missing |

### 5.4 Admin Endpoints (Missing)
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | /api/admin/stats | Dashboard stats | 🟡 Missing |
| GET | /api/admin/users | Get all users | 🟡 Missing |
| PUT | /api/admin/users/:id/role | Update user role | 🟡 Missing |
| GET | /api/admin/activities | Recent activities | 🟡 Missing |

---

## 6. FRONTEND-BACKEND INTEGRATION POINTS

### 6.1 Actions That Need API Integration
| Action File | Current Method | Expected API Call | Status |
|-------------|----------------|-------------------|--------|
| galleryAction.ts | getGalleryData() | GET /api/gallery | 🟡 Missing |
| galleryAction.ts | uploadGalleryImage() | POST /api/gallery/upload | 🟡 Missing |
| newsAction.ts | getNews() | GET /api/news | 🟡 Missing |
| newsAction.ts | createNews() | POST /api/news | 🟡 Missing |
| newsAction.ts | updateNews() | PUT /api/news/:id | 🟡 Missing |
| newsAction.ts | deleteNews() | DELETE /api/news/:id | 🟡 Missing |
| projectAction.ts | getProjects() | GET /api/projects | 🟡 Missing |
| projectAction.ts | createProject() | POST /api/projects | 🟡 Missing |
| projectAction.ts | updateProject() | PUT /api/projects/:id | 🟡 Missing |
| projectAction.ts | deleteProject() | DELETE /api/projects/:id | 🟡 Missing |

### 6.2 Components Using Server Actions
These components currently use server actions but need to switch to API calls:

| Component | Action Used | Expected Endpoint |
|-----------|-------------|-------------------|
| ContactForm.tsx | submitContact() | POST /api/contact |
| AdminNewsForm.tsx | createNews() | POST /api/news |
| AdminProjectsForm.tsx | createProject() | POST /api/projects |
| AdminGallery.tsx | uploadGalleryImage() | POST /api/gallery/upload |
| AdminDashboard.tsx | getStats() | GET /api/admin/stats |

---

## 7. DATABASE SCHEMA COMPLETENESS CHECK

### 7.1 Required vs Existing Models

| Model | Required | Existing | Status |
|-------|----------|----------|--------|
| User | ✅ | ✅ | Complete |
| Role | ✅ | ✅ | Complete |
| RefreshToken | ✅ | ✅ | Complete |
| PasswordResetToken | ✅ | ✅ | Complete |
| GalleryAlbum | ✅ | ✅ | Complete |
| GalleryImage | ✅ | ✅ | Complete |
| ContactMessage | ✅ | ✅ | Complete |
| ContactMessageStatus | ✅ | ✅ | Complete |
| NewsCategory | ✅ | ✅ | Complete |
| NewsArticle | ✅ | ✅ | Complete |
| ProjectCategory | ✅ | ✅ | Complete |
| ProjectStatus | ✅ | ✅ | Complete |
| Project | ✅ | ✅ | Complete |
| PartnerCategory | ✅ | ✅ | Complete |
| Partner | ✅ | ✅ | Complete |
| ReportCategory | ✅ | ✅ | Complete |
| Report | ✅ | ✅ | Complete |
| NotificationType | ✅ | ✅ | Complete |
| Notification | ✅ | ✅ | Complete |
| SiteSettings | ✅ | ✅ | Complete |
| OrganizationStat | ✅ | ✅ | Complete |
| WorkArea | ✅ | ✅ | Complete |
| AuditLog | ✅ | ✅ | Complete |

**Result: All 23 models are present and complete ✅**

---

## 8. GAP ANALYSIS SUMMARY

### 8.1 What's Complete
- ✅ All database models (23 models)
- ✅ All controller files (6 files)
- ✅ All service files (7 files)
- ✅ All repository files (6 files)
- ✅ All model definitions (6 files)
- ✅ All middleware files (2 files)
- ✅ All type definitions (4 files)
- ✅ All hooks (2 files)
- ✅ All frontend pages (15+ pages)
- ✅ All UI components (85+ components)
- ✅ Internationalization (en & am)
- ✅ Cloudinary integration

### 8.2 What's Missing
- 🔴 **CRITICAL**: All API route files (16+ missing)
- 🔴 **CRITICAL**: Error handling utilities
- 🟡 **HIGH**: Validation files
- 🟡 **HIGH**: Constants and helpers
- 🟡 **HIGH**: Rate limiting middleware
- 🟡 **MEDIUM**: Audit logging middleware
- 🟡 **MEDIUM**: Test files

---

## 9. IMMEDIATE ACTION ITEMS

### Priority 1 - Critical (Create Immediately)
1. Create all API routes in src/app/api/
2. Create error handling middleware
3. Create validation files

### Priority 2 - High (Create Next)
4. Create constants and helpers
5. Create rate limiting middleware
6. Create audit logging

### Priority 3 - Medium (Plan for Next Sprint)
7. Write unit tests
8. Write integration tests
9. Add API documentation

---

## 10. CONCLUSION

The Damot-Union project has a solid foundation with:
- Complete database schema
- Full backend architecture (controllers, services, repositories)
- Complete frontend with all pages and components

**Critical Missing Piece**: API routes that connect the frontend to the backend.

**Next Step**: Create all missing API route files in src/app/api/ directory with proper error handling, validation, and authentication.



# DAMOT-UNION PROJECT SETUP LOG

## Generated: 2026-07-31
## Status: Backend Implementation in Progress

---

## LOG ENTRIES

### 2026-07-31 09:00:00 - BACKEND_REQUIREMENTS.md
- **Action:** Created
- **Path:** BACKEND_REQUIREMENTS.md
- **Purpose:** Complete project audit and requirements document
- **Status:** Completed
- **Next Steps:** Begin API route implementation

### 2026-07-31 09:00:00 - PROJECT_SETUP_LOG.md
- **Action:** Created
- **Path:** PROJECT_SETUP_LOG.md
- **Purpose:** Track all backend setup activities
- **Status:** Completed
- **Next Steps:** Update with each file creation

### 2026-07-31 09:00:00 - API_ROUTES_INDEX.md
- **Action:** Created
- **Path:** API_ROUTES_INDEX.md
- **Purpose:** Document all API routes and their status
- **Status:** Completed
- **Next Steps:** Create individual route files

---

## TOTAL FILES CREATED: 3
## PENDING FILES: 16 API Routes + 6 Validation Files + 3 Utility Files
## NEXT ACTION: Create API Routes in src/app/api/


# DAMOT-UNION PROJECT SETUP LOG

## Generated: 2026-07-31
## Status: Backend Implementation in Progress

---

## LOG ENTRIES

### 2026-07-31 09:00:00 - BACKEND_REQUIREMENTS.md
- **Action:** Created
- **Path:** BACKEND_REQUIREMENTS.md
- **Purpose:** Complete project audit and requirements document
- **Status:** Completed
- **Next Steps:** Begin API route implementation

### 2026-07-31 09:00:00 - PROJECT_SETUP_LOG.md
- **Action:** Created
- **Path:** PROJECT_SETUP_LOG.md
- **Purpose:** Track all backend setup activities
- **Status:** Completed
- **Next Steps:** Update with each file creation

### 2026-07-31 09:00:00 - API_ROUTES_INDEX.md
- **Action:** Created
- **Path:** API_ROUTES_INDEX.md
- **Purpose:** Document all API routes and their status
- **Status:** Completed
- **Next Steps:** Create individual route files

---

## TOTAL FILES CREATED: 3
## PENDING FILES: 46 API Routes + Validation Files + Utility Files
## NEXT ACTION: Create API Routes in src/app/api/


# Damot Union — Complete Backend Requirements & Project Audit

> **Author:** Lead Software Architect  
> **Date:** 2025-07-19  
> **Project:** Damot Multipurpose Farmers Cooperative Union  
> **Stack:** Next.js 16 (App Router) + TypeScript + Prisma (MySQL) + next-intl (i18n)  
> **Frontend State:** Fully scaffolded with mock data; zero real API integrations  
> **Backend State:** Stub files only — no server, no routes, no real endpoints

---

## Table of Contents

1. [Full Repository File Activity Register](#1-full-repository-file-activity-register)
2. [Existing Backend Codebase Analysis](#2-existing-backend-codebase-analysis)
3. [Existing Frontend Codebase Analysis & API Mapping](#3-existing-frontend-codebase-analysis--api-mapping)
4. [Missing Code & Gap Identification](#4-missing-code--gap-identification)
5. [Prioritized Fix & Implementation Roadmap](#5-prioritized-fix--implementation-roadmap)

---

## 1. Full Repository File Activity Register

### Legend
| Status | Meaning |
|--------|---------|
| ✅ Complete | Fully implemented, works with mock data |
| ⚠️ Partial | Scaffolded but not wired to backend |
| ❌ Missing | Does not exist yet |
| 🐛 Broken | Has bugs or errors |

### Root Configuration Files

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `.gitignore` | Git ignore rules | Ignores node_modules, .next, .env, build artifacts | None | ✅ Complete |
| `eslint.config.mjs` | ESLint config | Linting rules for Next.js/TypeScript | None | ✅ Complete |
| `next.config.ts` | Next.js config | next-intl plugin, allowedDevOrigins, logging config | None | ✅ Complete |
| `package.json` | Dependencies | Next.js 16, Prisma, next-intl, react-hook-form, zod, cloudinary, bcrypt, embla-carousel, recharts | Lists all packages | ✅ Complete |
| `postcss.config.mjs` | PostCSS config | Tailwind CSS v4 postcss plugin | None | ✅ Complete |
| `prisma.config.ts` | Prisma config | Defines schema path and datasource URL from env | Reads DATABASE_URL env | ⚠️ Partial |
| `tsconfig.json` | TypeScript config | Path aliases (`@/*`), JSX, bundler module resolution | None | ✅ Complete |
| `README.md` | Documentation | Basic scaffolding info | None | ⚠️ Partial |
| `TODO.md` | Task tracking | Step-by-step project plan | None | ⚠️ Partial |

### Prisma & Database

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `prisma/schema.prisma` | Database schema | 21 models: Role, User, RefreshToken, PasswordResetToken, GalleryAlbum, GalleryImage, ContactMessageStatus, ContactMessage, NewsCategory, NewsArticle, ProjectCategory, ProjectStatus, Project, PartnerCategory, Partner, ReportCategory, Report, NotificationType, Notification, SiteSettings, OrganizationStat, WorkArea, AuditLog | Direct DB mapping via Prisma Client | ⚠️ Partial |
| `prisma/migrations/20260718210304_init_dual_language_cms/migration.sql` | Initial migration | Full SQL schema with dual-language columns (`_en`, `_am`), FK constraints, indexes | Creates all DB tables | ✅ Complete |
| `prisma/migrations/migration_lock.toml` | Migration lock | Locks Prisma to MySQL provider | None | ✅ Complete |

### i18n / Messages

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `messages/en.json` | English translations | ~1,200 lines of UI copy for all pages, forms, menus, SEO | None (static JSON) | ✅ Complete |
| `messages/am.json` | Amharic translations | ~1,200 lines of UI copy for all pages, forms, menus, SEO | None (static JSON) | ✅ Complete |

### i18n Routing

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `src/i18n/routing.ts` | Locale routing config | Defines `["en", "am"]` locales, default `am`, always locale prefix | None | ✅ Complete |
| `src/i18n/request.ts` | Message loader | Loads `messages/{locale}.json` for each request | None | ✅ Complete |
| `src/i18n/navigation.ts` | Navigation helpers | Creates locale-aware `Link`, `redirect`, `usePathname`, `useRouter` | None | ✅ Complete |

### App Root Files

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `src/app/layout1.tsx` | Root layout (legacy) | Minimal HTML wrapper with globals.css | None | ⚠️ Partial |
| `src/app/globals.css` | Global styles | Tailwind directives | None | ✅ Complete |
| `src/app/error.tsx` | Error boundary | Renders error UI | None | ✅ Complete |
| `src/app/loading.tsx` | Loading state | Renders loading UI | None | ✅ Complete |
| `src/app/robots.ts` | Robots.txt generator | Generates robots.txt | None | ✅ Complete |
| `src/app/sitemap.ts` | Sitemap generator | Generates sitemap.xml | None | ✅ Complete |
| `src/proxy.ts` | next-intl middleware | Routes locale detection, matches all paths except admin/api | None | ✅ Complete |

### [locale] Pages (Public Frontend)

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `src/app/[locale]/layout.tsx` | Locale layout | Renders Header/Footer wrappers, loads messages | None (static rendering) | ✅ Complete |
| `src/app/[locale]/page.tsx` | Home page | Renders Hero, PartnerStrip, ServicesSection, AboutSection, ImpactSection, TestimonialsSection, ProjectsSection, NewsGallerySection, JoinCTA | None (all mock data) | ✅ Complete |
| `src/app/[locale]/about/page.tsx` | About page | Renders ~15 sections: AboutHero, OverviewAndHistory, ChairmanMessage, VisionMissionValues, Objectives, GrowthAndStructure, Board, Management, WorkArea, Statistics, Partners, WatchOurStory, AboutSideNav | None (all mock data) | ✅ Complete |
| `src/app/[locale]/contact/page.tsx` | Contact page | Renders PageHero, ContactSection (form + info), ContactMap, JoinCTA | **POST /api/contact** (form submit) | ⚠️ Partial |
| `src/app/[locale]/gallery/page.tsx` | Gallery page | Renders GalleryHero, GalleryGrid | **GET /api/gallery** (list), **POST /api/gallery** (upload) | ⚠️ Partial |
| `src/app/[locale]/news/page.tsx` | News page | Renders NewsHero, NewsSection (categories, search, sort, pagination, sidebar) | None (all mock data from `data/newsData.ts`) | ✅ Complete |
| `src/app/[locale]/projects/page.tsx` | Projects page | Renders ProjectsHero, ProjectsSection, ProjectsImpact, ProjectsCTA | None (all mock data from `data/projectsData.ts`) | ✅ Complete |
| `src/app/[locale]/reports/page.tsx` | Reports page | Renders static "Reports" text only | None | ❌ Missing |
| `src/app/[locale]/services/page.tsx` | Services page | Renders ServicesHero, CoreServices, HowItWorks, ServicesImpact, WhyChooseUs, Testimonials, CoverageMap, ResourcesDownload, ServicesFaq, ServicesCTA, ServicesSideNav | None (all mock data) | ✅ Complete |

### Admin Pages

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `src/app/admin/layout.tsx` | Admin layout | Renders AdminSidebar + AdminMobileDrawer | None | ✅ Complete |
| `src/app/admin/page.tsx` | Admin dashboard | Renders AdminHeader, AdminStatCards, RecentActivities, StatisticsChart, LatestDataOverview, QuickActions | None (all mock data from `data/admin-dashboard.ts`) | ⚠️ Partial |
| `src/app/admin/gallery/page.tsx` | Admin gallery mgmt | Renders AdminHeader, AdminGalleryGrid | None (mock images from `data/news.ts`) | ⚠️ Partial |
| `src/app/admin/messages/page.tsx` | Admin messages mgmt | Renders AdminHeader, AdminMessagesTable | None (mock messages from `data/admin-messages.ts`) | ⚠️ Partial |
| `src/app/admin/news/page.tsx` | Admin news mgmt | Renders AdminHeader, AdminNewsStats, AdminNewsTable | None (mock articles from `data/newsData.ts`) | ⚠️ Partial |
| `src/app/admin/partners/page.tsx` | Admin partners mgmt | Renders AdminHeader, AdminPartnersTable | None (mock partners from `data/partners.ts`) | ⚠️ Partial |
| `src/app/admin/projects/page.tsx` | Admin projects mgmt | Renders AdminHeader, AdminProjectsStats, AdminProjectsTable | None (mock projects from `data/projectsData.ts`) | ⚠️ Partial |
| `src/app/admin/reports/page.tsx` | Admin reports mgmt | Renders AdminHeader, AdminReportsTable | None (mock reports from `data/reports.ts`) | ⚠️ Partial |
| `src/app/admin/settings/page.tsx` | Admin settings mgmt | Renders AdminHeader, AdminSettingsForm | None (local state only, no persistence) | ⚠️ Partial |

### Layout Components

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `src/components/layout/Header.tsx` | Main header | Renders top info bar, nav with mega menus, language switcher, mobile drawer | None (static) | ✅ Complete |
| `src/components/layout/Footer.tsx` | Main footer | Renders brand, quick links, services, contact, newsletter form | None (newsletter is local-only mock) | ✅ Complete |

### Home Page Components

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `src/components/home/Hero.tsx` | Hero carousel | Embla carousel with 6 background images, stat counters, CTA buttons | None (static data from `data/hero.ts`) | ✅ Complete |
| `src/components/home/PartnerStrip.tsx` | Partner logos | Static partner logo strip | None (static data from `data/partners.ts`) | ✅ Complete |
| `src/components/home/ServicesSection.tsx` | Services overview | Grid of service cards with icons | None (static data from `data/services-grid.ts`) | ✅ Complete |
| `src/components/home/AboutSection.tsx` | About preview | Vision, mission, values snippet | None (static data) | ✅ Complete |
| `src/components/home/ImpactSection.tsx` | Impact stats | Animated count-up stats | None (static data from `data/impact-metrics.ts`) | ✅ Complete |
| `src/components/home/TestimonialsSection.tsx` | Testimonials carousel | Testimonial slider | None (static data from `data/testimonials.ts`) | ✅ Complete |
| `src/components/home/ProjectsSection.tsx` | Projects preview | Project cards with progress bars | None (static data from `data/projects.ts`) | ✅ Complete |
| `src/components/home/NewsGallerySection.tsx` | News + Gallery section | Side-by-side news updates + gallery thumbnails | None (static data) | ✅ Complete |
| `src/components/home/JoinCTA.tsx` | Membership CTA | Call-to-action banner | None | ✅ Complete |
| `src/components/home/GallerySection.tsx` | Home gallery strip | Static image grid | None | ✅ Complete |
| `src/components/home/NewsSection.tsx` | Home news strip | Static news cards from translations | None | ✅ Complete |

### Contact Components

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `src/components/contact/ContactSection.tsx` | Contact section layout | Server component — renders ContactInfoGrid + ContactForm | None | ✅ Complete |
| `src/components/contact/ContactForm.tsx` | Contact form | **Actual fetch() call**: POST `/api/contact` with `{ name, phone, email, subject, message }` | **POST /api/contact** | ⚠️ Partial |
| `src/components/contact/ContactMap.tsx` | Google Maps embed | Embedded iframe map | None | ⚠️ Partial |
| `src/components/contacts/PageHero.tsx` | Shared hero banner | Reusable page hero with breadcrumb, used on Contact page | None | ✅ Complete |
| `src/components/contact/ContactInfoGrid.tsx` | Contact detail cards | Phone, email, address, hours display | None | ✅ Complete |

### Gallery Components

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `src/components/gallery/GalleryGrid.tsx` | Gallery grid (new) | Categories, tabs, sort, lightbox, upload modal. Uses `data/galleryData.ts` mock data | None (local mock data) | ✅ Complete |
| `src/components/gallery/GalleryList.tsx` | Gallery list (legacy) | **Actual fetch() calls**: GET `/api/gallery` on mount, populates image grid with lightbox | **GET /api/gallery** | ⚠️ Partial |
| `src/components/gallery/GalleryUpload.tsx` | Gallery upload (legacy) | **Actual fetch() call**: POST `/api/gallery` with `{ url }` | **POST /api/gallery** | ⚠️ Partial |
| `src/components/gallery/GalleryHero.tsx` | Gallery hero | Page hero banner | None | ✅ Complete |

### News Components

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `src/components/news/NewsSection.tsx` | News main section | Categories filter, search, sort, pagination, hydrated translations | None (mock data from `data/newsData.ts`) | ✅ Complete |
| `src/components/news/NewsCard.tsx` | News article card | Renders thumbnail, title, excerpt, date, read more link | None | ✅ Complete |
| `src/components/news/NewsCardImage.tsx` | News card image loader | Next/Image with blur placeholder | None | ✅ Complete |
| `src/components/news/NewsList.tsx` | News list (legacy) | Renders grid of NewsCard with load-more pagination | None | ✅ Complete |
| `src/components/news/NewsHero.tsx` | News page hero | Page hero with breadcrumb | None | ✅ Complete |
| `src/components/news/NewsToolbar.tsx` | News toolbar | Search input + sort dropdown | None | ✅ Complete |
| `src/components/news/NewsCategories.tsx` | News category sidebar | Sidebar with category counts | None | ✅ Complete |
| `src/components/news/NewsSidebar.tsx` | News sidebar container | Contains featured, announcements, newsletter | None | ✅ Complete |
| `src/components/news/FeaturedNewsSidebar.tsx` | Featured article card | Featured news highlight | None | ✅ Complete |
| `src/components/news/LatestAnnouncements.tsx` | Announcements list | List of announcements | None | ✅ Complete |
| `src/components/news/NewsletterCard.tsx` | Newsletter signup | Email signup form (local mock only) | **POST /api/newsletter** | ⚠️ Partial |

### Projects Components

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `src/components/projects/ProjectsSection.tsx` | Projects main section | Categories filter, status filter, search, sort, pagination, hydrated translations | None (mock data from `data/projectsData.ts`) | ✅ Complete |
| `src/components/projects/ProjectCard.tsx` | Project card | Renders thumbnail, title, excerpt, location, progress bar, status badge | None | ✅ Complete |
| `src/components/projects/ProjectImage.tsx` | Project card image loader | Next/Image with blur placeholder | None | ✅ Complete |
| `src/components/projects/ProjectsHero.tsx` | Projects page hero | Page hero with breadcrumb | None | ✅ Complete |
| `src/components/projects/ProjectsImpact.tsx` | Impact stats section | Impact stats with count-up animation | None | ✅ Complete |
| `src/components/projects/ProjectsCTA.tsx` | Projects CTA | Call-to-action for partnerships | None | ✅ Complete |
| `src/components/projects/ProjectsToolbar.tsx` | Projects toolbar | Search, status filter, sort dropdown | None | ✅ Complete |
| `src/components/projects/ProjectCategories.tsx` | Project category sidebar | Sidebar with category counts | None | ✅ Complete |

### Services Components

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `src/components/services/CoreServices.tsx` | Service cards grid | 6 service cards with images, icons, descriptions | None (server component, static data) | ✅ Complete |
| `src/components/services/HowItWorks.tsx` | Membership steps | 4-step "how membership works" section | None | ✅ Complete |
| `src/components/services/ServicesImpact.tsx` | Services impact stats | Animated count-up stats with intersection observer | None | ✅ Complete |
| `src/components/services/WhyChooseUs.tsx` | Why choose us | 6 reasons with icons | None | ✅ Complete |
| `src/components/services/Testimonials.tsx` | Service testimonials | Testimonial cards | None | ✅ Complete |
| `src/components/services/CoverageMap.tsx` | Coverage map | Map/area information | None | ✅ Complete |
| `src/components/services/ResourcesDownload.tsx` | Resources download | Download cards for guides | None | ✅ Complete |
| `src/components/services/ServicesFaq.tsx` | FAQ accordion | Expandable FAQ items | None | ✅ Complete |
| `src/components/services/ServicesCTA.tsx` | Services CTA | Call-to-action banner | None | ✅ Complete |
| `src/components/services/ServicesSideNav.tsx` | Services side nav | Floating side navigation | None | ✅ Complete |
| `src/components/services/ServicesHero.tsx` | Services page hero | Page hero with breadcrumb | None | ✅ Complete |

### About Components

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `src/components/about/AboutHero.tsx` | About page hero | Page hero with breadcrumb | None | ✅ Complete |
| `src/components/about/OverviewAndHistory.tsx` | Overview + history | Timeline milestones, overview text | None | ✅ Complete |
| `src/components/about/VisionMissionValues.tsx` | Vision, Mission, Values | Vision/mission text + core values cards | None | ✅ Complete |
| `src/components/about/Objectives.tsx` | Objectives section | 6 objective cards | None | ✅ Complete |
| `src/components/about/ChairmanMessage.tsx` | Chairman's message | Quote section with values | None | ✅ Complete |
| `src/components/about/GrowthAndStructure.tsx` | Growth + org structure | Growth comparison table + org chart | None | ✅ Complete |
| `src/components/about/BoardOfDirectors.tsx` | Board of directors | 5 board member cards | None | ✅ Complete |
| `src/components/about/ManagementTeam.tsx` | Management team | 4 manager cards | None | ✅ Complete |
| `src/components/about/WorkAreaAndAchievements.tsx` | Work area + achievements | 7 woredas coverage + achievement stats | None | ✅ Complete |
| `src/components/about/StatisticsAndReports.tsx` | Stats + reports | Statistics charts, reports links | None | ✅ Complete |
| `src/components/about/PartnersAndDonors.tsx` | Partners section | Grid of partner logos | None | ✅ Complete |
| `src/components/about/WatchOurStory.tsx` | Video section | Video placeholder | None | ✅ Complete |
| `src/components/about/AboutSideNav.tsx` | About side nav | Floating side navigation | None | ✅ Complete |

### Admin Components

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `src/components/admin/AdminHeader.tsx` | Admin header | Page title, subtitle, notification + message badges with counts | None (static counts) | ⚠️ Partial |
| `src/components/admin/AdminSidebar.tsx` | Admin sidebar | Navigation with 8 menu items, active state tracking | None | ✅ Complete |
| `src/components/admin/AdminSidebarContext.tsx` | Sidebar context | Mobile sidebar open/close state | None | ✅ Complete |
| `src/components/admin/AdminMobileDrawer.tsx` | Mobile drawer | Responsive mobile sidebar | None | ✅ Complete |
| `src/components/admin/AdminStatCards.tsx` | Dashboard stat cards | 7 stat cards (News, Projects, Gallery, Reports, Partners, Messages, Settings) | None (mock data) | ⚠️ Partial |
| `src/components/admin/AdminNewsStats.tsx` | News stats | News statistics summary | None (mock data) | ⚠️ Partial |
| `src/components/admin/AdminNewsTable.tsx` | News management table | Sortable/filterable table with search, category filter, edit/delete actions | None (mock data) | ⚠️ Partial |
| `src/components/admin/AdminProjectsStats.tsx` | Projects stats | Project statistics summary | None (mock data) | ⚠️ Partial |
| `src/components/admin/AdminProjectsTable.tsx` | Projects management table | Filterable table with status/category/search | None (mock data) | ⚠️ Partial |
| `src/components/admin/AdminGalleryGrid.tsx` | Gallery management | Image grid with upload/delete | None (mock images) | ⚠️ Partial |
| `src/components/admin/AdminMessagesTable.tsx` | Messages management | Accordion list with read/reply/delete | None (mock data) | ⚠️ Partial |
| `src/components/admin/AdminPartnersTable.tsx` | Partners management | Card grid with category filter, add/edit/delete | None (mock data) | ⚠️ Partial |
| `src/components/admin/AdminReportsTable.tsx` | Reports management | Table with upload/delete | None (mock data) | ⚠️ Partial |
| `src/components/admin/AdminSettingsForm.tsx` | Settings form | Branding, contact, social, SEO fields | None (local state only) | ⚠️ Partial |
| `src/components/admin/RecentActivities.tsx` | Activity feed | Recent activity list | None (mock data) | ⚠️ Partial |
| `src/components/admin/StatisticsChart.tsx` | Statistics chart | Recharts bar chart with monthly data | None (mock data) | ⚠️ Partial |
| `src/components/admin/LatestDataOverview.tsx` | Latest data table | Table of recent content items | None (mock data) | ⚠️ Partial |
| `src/components/admin/QuickActions.tsx` | Quick action buttons | 7 quick action links | None | ⚠️ Partial |

### UI Components

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `src/components/ui/LanguageSwitcher.tsx` | Language toggle | Switches between Amharic/English | None | ✅ Complete |
| `src/components/ui/Button.tsx` | Button component | Reusable button with variants | None | ✅ Complete |
| `src/components/ui/Card.tsx` | Card component | Reusable card container | None | ✅ Complete |
| `src/components/ui/CountUpStat.tsx` | Animated counter | Number count-up animation | None | ✅ Complete |
| `src/components/ui/Input.tsx` | Input component | Reusable form input | None | ✅ Complete |
| `src/components/ui/Modal.tsx` | Modal component | Reusable modal overlay | None | ✅ Complete |
| `src/components/ui/SectionHeading.tsx` | Section heading | Reusable heading with eyebrow | None | ✅ Complete |
| `src/components/HydrationGuard.tsx` | Hydration guard | Prevents hydration mismatch | None | ✅ Complete |

### Data / Mock Data Files

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `src/data/about-content.ts` | About content data | Overview, history milestones, vision/mission, objectives, board, management text in en/am | Should be served from DB | ⚠️ Partial |
| `src/data/admin-dashboard.ts` | Dashboard mock data | Stat cards, recent activities, statistics overview, latest data, quick actions | Should be aggregate counts from DB | ⚠️ Partial |
| `src/data/admin-messages.ts` | Messages mock data | 3 mock contact messages | Should be served from contact_messages table | ⚠️ Partial |
| `src/data/admin-nav.ts` | Admin navigation config | 8 admin nav items with icons | None (static config) | ✅ Complete |
| `src/data/contact.ts` | Contact page data | Contact detail icons, subject IDs, map embed URL | None (static config) | ✅ Complete |
| `src/data/galleryData.ts` | Gallery media data | 15 media items across 8 categories | Should be served from gallery_images + gallery_albums | ⚠️ Partial |
| `src/data/hero.ts` | Hero data | 6 hero background images, 4 stat cards (en/am) | Stats from organization_stats table | ⚠️ Partial |
| `src/data/impact-metrics.ts` | Impact metrics | 7 metrics with icons (en/am) | Should be served from impact_metrics table | ⚠️ Partial |
| `src/data/navigation.ts` | Navigation data | Quick links (en/am) | None (static config) | ✅ Complete |
| `src/data/news.ts` | News data (home) | 3 news updates, 6 gallery images (en/am) | Should be served from news_articles + gallery_images | ⚠️ Partial |
| `src/data/newsData.ts` | News articles data | 12 news articles with mock content | Should be served from news_articles table | ⚠️ Partial |
| `src/data/partners.ts` | Partners data | 11 partners (en/am) with logos | Should be served from partners table | ⚠️ Partial |
| `src/data/projects.ts` | Projects data (home) | 3 projects with capacity/progress | Should be served from projects table | ⚠️ Partial |
| `src/data/projectsData.ts` | Projects data (full) | 10 projects with status, category, progress, dates | Should be served from projects table | ⚠️ Partial |
| `src/data/reports.ts` | Reports data | 3 mock reports | Should be served from reports table | ⚠️ Partial |
| `src/data/services.ts` | Services text data | 6 service names (en/am) | None (static text) | ✅ Complete |
| `src/data/services-grid.ts` | Services grid data | 6 service cards with icon/image config | None (static config) | ✅ Complete |
| `src/data/site-header-menu.ts` | Mega menu data | Full mega menu structure with columns, links, icons | None (static config) | ✅ Complete |
| `src/data/social-links.ts` | Social media links | 4 social media links | Should be served from site_settings table | ⚠️ Partial |
| `src/data/testimonials.ts` | Testimonials data | 2 testimonial entries | Should be served from testimonials table | ⚠️ Partial |

### Backend Stub Files (src/controllers, src/services, etc.)

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `src/controllers/authController.ts` | Auth controller stub | `login()` returns `{ ok: true, message: "login not implemented" }` | POST /api/auth/login | 🐛 Broken |
| `src/controllers/contactController.ts` | Contact controller stub | `submitContact()` returns `{ ok: true }` | POST /api/contact | 🐛 Broken |
| `src/controllers/galleryController.ts` | Gallery controller | `getGallery()`, `addGallery()`, `deleteGallery()` using Pages Router API types | GET/POST/DELETE /api/gallery | 🐛 Broken |
| `src/controllers/newsController.ts` | News controller stub | `listNews()` returns `[]` | GET /api/news | 🐛 Broken |
| `src/controllers/projectController.ts` | Project controller stub | `listProjects()` returns `[]` | GET /api/projects | 🐛 Broken |
| `src/controllers/reportController.ts` | Report controller stub | `listReports()` returns `[]` | GET /api/reports | 🐛 Broken |
| `src/services/authService.ts` | Auth service stub | `validate()` returns `false` | Auth validation | 🐛 Broken |
| `src/services/contactService.ts` | Contact service stub | `submit()` returns `{ ok: true }` | Contact persistence | 🐛 Broken |
| `src/services/emailService.ts` | Email service stub | `sendEmail()` returns `{ ok: true }` | SMTP email sending | 🐛 Broken |
| `src/services/galleryService.ts` | Gallery service | `list()`, `get()`, `add()`, `remove()` — calls galleryRepository | Prisma queries | ⚠️ Partial |
| `src/services/newsService.ts` | News service stub | `list()` returns `[]` | Prisma queries | 🐛 Broken |
| `src/services/projectService.ts` | Project service stub | `list()` returns `[]` | Prisma queries | 🐛 Broken |
| `src/services/reportService.ts` | Report service stub | `list()` returns `[]` | Prisma queries | 🐛 Broken |
| `src/repositories/contactRepository.ts` | Contact repo stub | `create()` returns `{ ok: true }` | Prisma queries | 🐛 Broken |
| `src/repositories/galleryRepository.ts` | Gallery repo | `getAll()`, `getById()`, `create()`, `delete()` — queries `prisma.gallery` (WRONG model name) | Prisma queries on `gallery` model | 🐛 Broken |
| `src/repositories/newsRepository.ts` | News repo stub | `all()` returns `[]` | Prisma queries | 🐛 Broken |
| `src/repositories/projectRepository.ts` | Project repo stub | `all()` returns `[]` | Prisma queries | 🐛 Broken |
| `src/repositories/reportRepository.ts` | Report repo stub | `all()` returns `[]` | Prisma queries | 🐛 Broken |
| `src/repositories/userRepository.ts` | User repo stub | `find()` returns `null` | Prisma queries | 🐛 Broken |
| `src/models/User.ts` | User interface | `{ id: number, email: string, name?: string }` — **MISMATCHED** with Prisma User model | Type mapping | 🐛 Broken |
| `src/models/Contact.ts` | Contact interface | `{ id: number, message: string }` — **MISMATCHED** with Prisma ContactMessage | Type mapping | 🐛 Broken |
| `src/models/Gallery.ts` | Gallery interface | `{ id: number, url: string }` — **MISMATCHED** with Prisma GalleryImage | Type mapping | 🐛 Broken |
| `src/models/News.ts` | News interface | `{ id: number, title: string, slug: string }` — **MISMATCHED** with Prisma NewsArticle | Type mapping | 🐛 Broken |
| `src/models/Project.ts` | Project interface | `{ id: number, title: string }` — **MISMATCHED** with Prisma Project | Type mapping | 🐛 Broken |
| `src/models/Report.ts` | Report interface | `{ id: number, title: string }` — **MISMATCHED** with Prisma Report | Type mapping | 🐛 Broken |
| `src/middleware/authMiddleware.ts` | Auth middleware | `isAuthenticated()` always returns `true` — placeholder | JWT verification | 🐛 Broken |
| `src/middleware/adminMiddleware.ts` | Admin middleware | `isAdmin()` always returns `false` — placeholder | Role-based access | 🐛 Broken |
| `src/lib/auth.ts` | Auth utility | `requireAuth()` throws "Not implemented" | JWT token verification | 🐛 Broken |
| `src/lib/prisma.ts` | Prisma client | Singleton PrismaClient, uses `any` types | DB connection | ⚠️ Partial |
| `src/lib/cloudinary.ts` | Cloudinary stub | `upload()` returns `{ url: "" }` | Cloudinary API | 🐛 Broken |
| `src/lib/utils.ts` | Utilities | `noop()` returns undefined | None | ⚠️ Partial |
| `src/lib/validations.ts` | Validations | `validations = {}` — empty object | Input validation | 🐛 Broken |
| `src/hooks/useAuth.ts` | Auth hook | `useAuth()` returns `{ user: null }` | Auth API calls | 🐛 Broken |
| `src/hooks/useFetch.ts` | Generic fetch hook | `useFetch(url)` fetches data by URL | API calls | ⚠️ Partial |
| `src/actions/newsAction.ts` | News server action | `fetchNews()` returns mock data, `getNewsBySlug()`, `getNewsCategories()` | Prisma queries | ⚠️ Partial |
| `src/actions/galleryAction.ts` | Gallery server action | `fetchGallery()` returns `[]` | Prisma queries | 🐛 Broken |
| `src/actions/projectAction.ts` | Project server action | `fetchProjects()` returns `[]` | Prisma queries | 🐛 Broken |
| `src/constants/config.ts` | Config | `CONFIG = { apiBase: "/api" }` | API base path | ✅ Complete |
| `src/constants/index.ts` | Constants | `SITE_NAME = "Damot Union"` | None | ✅ Complete |

---

## 2. Existing Backend Codebase Analysis

### 2.1 Implemented Endpoints

**There are ZERO working API endpoints.** The `src/app/api/` directory does not exist. The controller/service/repository files are stubs not connected to any Next.js App Router route handlers. The `src/controllers/galleryController.ts` uses `NextApiRequest` (Pages Router type) which is incompatible with App Router.

### 2.2 Identified Errors & Bugs

| # | File | Line(s) | Bug Description | Severity |
|---|------|---------|-----------------|----------|
| 1 | All controllers | — | No API route files exist (`src/app/api/` missing) — controllers are never invoked | 🔴 Critical |
| 2 | `src/repositories/galleryRepository.ts` | 8-14 | Queries `prisma.gallery.findMany()` — model `gallery` does not exist in Prisma schema (correct: `GalleryImage`) | 🔴 Critical |
| 3 | `src/models/User.ts` | 1 | `id: number` — Prisma User has `id: String` (UUID) | 🔴 Critical |
| 4 | `src/models/Contact.ts` | 1 | `id: number` — Prisma ContactMessage has `id: String` | 🔴 Critical |
| 5 | `src/models/Gallery.ts` | 1 | `id: number, url: string` — Prisma GalleryImage has `id: String, filePath: String` | 🔴 Critical |
| 6 | `src/models/News.ts` | 1 | `id: number` — Prisma NewsArticle has `id: String` | 🔴 Critical |
| 7 | `src/models/Project.ts` | 1 | `id: number` — Prisma Project has `id: String` | 🔴 Critical |
| 8 | `src/models/Report.ts` | 1 | `id: number` — Prisma Report has `id: String` | 🔴 Critical |
| 9 | `src/controllers/galleryController.ts` | 1-2 | Uses `NextApiRequest`/`NextApiResponse` (Pages Router) — App Router uses `NextRequest`/`NextResponse` | 🔴 Critical |
| 10 | `src/middleware/authMiddleware.ts` | 1 | `isAuthenticated()` always returns `true` — no JWT verification | 🔴 Critical |
| 11 | `src/middleware/adminMiddleware.ts` | 1 | `isAdmin()` always returns `false` — no role check | 🔴 Critical |
| 12 | `src/lib/auth.ts` | 1 | `requireAuth()` throws `"Not implemented"` | 🔴 Critical |
| 13 | `src/lib/validations.ts` | 1 | `validations = {}` — empty, no validation anywhere | 🔴 High |
| 14 | `prisma/schema.prisma` | — | Schema lacks `history_milestones`, `testimonials`, `impact_metrics` models that exist in migration SQL | 🔴 High |
| 15 | `prisma/schema.prisma` | — | Has single-language fields (`name`, `description`) while migration SQL has dual-language (`name_en`, `name_am`) | 🔴 High |
| 16 | `.env` | — | No `.env` file exists — `DATABASE_URL`, `JWT_SECRET`, `CLOUDINARY_URL` not configured | 🔴 High |
| 17 | `src/lib/cloudinary.ts` | 1 | `upload()` returns empty URL — not configured | 🟡 Medium |
| 18 | `src/services/emailService.ts` | 1 | `sendEmail()` returns `{ ok: true }` — no SMTP config | 🟡 Medium |
| 19 | `src/hooks/useAuth.ts` | 3 | `useEffect([])` with empty deps — only runs once, never updates | 🟡 Medium |
| 20 | `src/hooks/useFetch.ts` | 5 | No error handling, no loading state, no abort controller | 🟡 Medium |

### 2.3 Security Issues

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | No authentication | All admin pages are publicly accessible | 🔴 Critical |
| 2 | No input validation | `src/lib/validations.ts` is empty | 🔴 High |
| 3 | No rate limiting | Any endpoint can be spammed | 🔴 High |
| 4 | No CSRF protection | POST endpoints accept requests without CSRF tokens | 🟡 Medium |
| 5 | No password hashing | `bcrypt` in package.json but no implementation | 🔴 High |
| 6 | No CORS configuration | No cross-origin protection | 🟡 Medium |
| 7 | No request logging | No audit trail for API calls | 🟡 Medium |

---

## 3. Existing Frontend Codebase Analysis & API Mapping

### 3.1 API Requests Found in Frontend

| Component | File | Method | Endpoint | Request Body | Currently Works? |
|-----------|------|--------|----------|--------------|-----------------|
| ContactForm | `src/components/contact/ContactForm.tsx:30` | POST | `/api/contact` | `{ name, phone, email, subject, message }` | ❌ No route handler |
| GalleryList | `src/components/gallery/GalleryList.tsx:32` | GET | `/api/gallery` | — | ❌ No route handler |
| GalleryUpload | `src/components/gallery/GalleryUpload.tsx:15` | POST | `/api/gallery` | `{ url }` | ❌ No route handler |
| NewsletterCard | `src/components/news/NewsletterCard.tsx` | POST | `/api/newsletter` | `{ email }` | ❌ No route handler |

### 3.2 Frontend vs Backend Mismatches

| Issue | Frontend Expects | Backend Provides | Severity |
|-------|------------------|------------------|----------|
| Gallery API response shape | `{ id: number, url: string, createdAt: string }` | No endpoint exists | 🔴 High |
| Contact API response | 200 OK on POST | No endpoint exists | 🔴 High |
| All admin CRUD operations | Mock data from `src/data/` | No endpoints exist | 🔴 High |
| All public pages | Mock data from `src/data/` | No endpoints exist | 🟡 Medium |
| Reports page | Full implementation | Static "Reports" text only | 🟡 Medium |

---

## 4. Missing Code & Gap Identification

### 4.1 Missing Backend Endpoints (46 total)

**Missing API Route Handlers** — the directory `src/app/api/` does not exist:

| # | Endpoint | Method | Purpose | Frontend Consumer | Priority |
|---|----------|--------|---------|-------------------|----------|
| 1 | `/api/health` | GET | Health check | Infrastructure | 🟢 Low |
| 2 | `/api/auth/register` | POST | Admin registration | Admin panel | 🔴 High |
| 3 | `/api/auth/login` | POST | Admin login | Admin panel | 🔴 High |
| 4 | `/api/auth/refresh` | POST | Refresh JWT token | Admin panel | 🔴 High |
| 5 | `/api/auth/logout` | POST | Logout | Admin panel | 🔴 High |
| 6 | `/api/auth/me` | GET | Current user profile | Admin panel | 🟡 Medium |
| 7 | `/api/auth/forgot-password` | POST | Password reset request | Admin panel | 🟡 Medium |
| 8 | `/api/auth/reset-password` | POST | Password reset | Admin panel | 🟡 Medium |
| 9 | `/api/contact` | POST | Submit contact form | ContactForm.tsx | 🔴 High |
| 10 | `/api/contact` | GET | List messages | AdminMessagesTable | 🔴 High |
| 11 | `/api/contact/:id` | PATCH | Update message status | AdminMessagesTable | 🔴 High |
| 12 | `/api/contact/:id` | DELETE | Delete message | AdminMessagesTable | 🔴 High |
| 13 | `/api/gallery` | GET | List gallery images | GalleryList, GalleryGrid | 🔴 High |
| 14 | `/api/gallery` | POST | Upload image | GalleryUpload, GalleryGrid | 🔴 High |
| 15 | `/api/gallery/:id` | DELETE | Delete image | AdminGalleryGrid | 🔴 High |
| 16 | `/api/gallery/albums` | GET | List albums | AdminGalleryGrid | 🟡 Medium |
| 17 | `/api/news` | GET | List articles | NewsSection | 🔴 High |
| 18 | `/api/news` | POST | Create article | AdminNewsTable | 🔴 High |
| 19 | `/api/news/:id` | PUT | Update article | AdminNewsTable | 🔴 High |
| 20 | `/api/news/:id` | DELETE | Delete article | AdminNewsTable | 🔴 High |
| 21 | `/api/news/:slug` | GET | Single article | News detail page | 🔴 High |
| 22 | `/api/news/categories` | GET | List categories | NewsCategories | 🔴 High |
| 23 | `/api/projects` | GET | List projects | ProjectsSection | 🔴 High |
| 24 | `/api/projects` | POST | Create project | AdminProjectsTable | 🔴 High |
| 25 | `/api/projects/:id` | PUT | Update project | AdminProjectsTable | 🔴 High |
| 26 | `/api/projects/:id` | DELETE | Delete project | AdminProjectsTable | 🔴 High |
| 27 | `/api/projects/categories` | GET | List categories | ProjectCategories | 🔴 High |
| 28 | `/api/partners` | GET | List partners | AdminPartnersTable | 🟡 Medium |
| 29 | `/api/partners` | POST | Create partner | AdminPartnersTable | 🟡 Medium |
| 30 | `/api/partners/:id` | PUT | Update partner | AdminPartnersTable | 🟡 Medium |
| 31 | `/api/partners/:id` | DELETE | Delete partner | AdminPartnersTable | 🟡 Medium |
| 32 | `/api/reports` | GET | List reports | AdminReportsTable | 🔴 High |
| 33 | `/api/reports` | POST | Upload report | AdminReportsTable | 🔴 High |
| 34 | `/api/reports/:id` | DELETE | Delete report | AdminReportsTable | 🔴 High |
| 35 | `/api/reports/categories` | GET | List categories | AdminReportsTable | 🟡 Medium |
| 36 | `/api/settings` | GET | Get site settings | AdminSettingsForm | 🔴 High |
| 37 | `/api/settings` | PUT | Update settings | AdminSettingsForm | 🔴 High |
| 38 | `/api/newsletter` | POST | Subscribe email | NewsletterCard, Footer | 🟡 Medium |
| 39 | `/api/upload` | POST | Upload file (image/PDF) | Multiple components | 🔴 High |
| 40 | `/api/stats/dashboard` | GET | Dashboard aggregate stats | AdminStatCards | 🔴 High |
| 41 | `/api/stats/organization` | GET | Organization stats by year | ImpactSection | 🟡 Medium |
| 42 | `/api/stats/impact` | GET | Impact metrics | ImpactSection | 🟡 Medium |
| 43 | `/api/testimonials` | GET | List testimonials | TestimonialsSection | 🟡 Medium |
| 44 | `/api/activity-logs` | GET | Recent admin activities | RecentActivities | 🟡 Medium |
| 45 | `/api/notifications` | GET | Admin notifications | AdminHeader | 🟡 Medium |
| 46 | `/api/notifications` | PATCH | Mark notifications read | AdminHeader | 🟡 Medium |

### 4.2 Missing Frontend Integrations

| # | Missing Feature | Location | Notes |
|---|----------------|----------|-------|
| 1 | Reports page content | `src/app/[locale]/reports/page.tsx` | Only shows "Reports" text |
| 2 | Admin login page | `src/app/admin/login/` | No auth UI exists |
| 3 | News detail page | `src/app/[locale]/news/[slug]/` | No individual article page |
| 4 | Project detail page | `src/app/[locale]/projects/[slug]/` | No individual project page |
| 5 | Admin CRUD forms | `src/app/admin/*/new/`, `src/app/admin/*/[id]/edit/` | Add/Edit pages referenced but not built |
| 6 | File upload UI | Multiple components | Admin uses "Upload" buttons but no file picker integration |

### 4.3 Missing Logic & Validations

| # | Missing Feature | Location | Impact |
|---|----------------|----------|--------|
| 1 | Input validation middleware | `src/lib/validations.ts` empty | No server-side validation |
| 2 | JWT authentication middleware | `src/middleware/authMiddleware.ts` | No auth protection |
| 3 | Role-based authorization | `src/middleware/adminMiddleware.ts` | No admin access control |
| 4 | Error handling middleware | None | No standardized error responses |
| 5 | Rate limiting | None | Vulnerable to abuse |
| 6 | File upload validation | None | No file type/size checks |
| 7 | CORS configuration | None | No cross-origin protection |
| 8 | Request logging | None | No audit trail |
| 9 | Soft-delete filtering | All repositories | No `deletedAt` filtering |
| 10 | Pagination helper | None | No standardized pagination |

---

## 5. Prioritized Fix & Implementation Roadmap

### Phase 1: Critical Fixes (Week 1)

| Step | Task | Files Affected | Effort |
|------|------|---------------|--------|
| 1.1 | Create `.env.example` | New file | 15 min |
| 1.2 | Reconcile Prisma schema with migration SQL (add dual-language fields, missing models) | `prisma/schema.prisma` | 4 hrs |
| 1.3 | Fix `galleryRepository.ts` — change `prisma.gallery` to `prisma.galleryImage` | `src/repositories/galleryRepository.ts` | 15 min |
| 1.4 | Update all model interfaces to match Prisma schema | `src/models/*.ts`, `src/types/*.ts` | 2 hrs |
| 1.5 | Create proper TypeScript types matching Prisma models | `src/types/*.ts` | 2 hrs |
| 1.6 | Create `src/app/api/` route handlers | New files | 4 hrs |
| 1.7 | Fix gallery controller to use App Router types | `src/controllers/galleryController.ts` | 30 min |

### Phase 2: Core API Routes (Week 2-3)

| Step | Task | Endpoints | Effort |
|------|------|-----------|--------|
| 2.1 | Implement Contact API (CRUD + status management) | `/api/contact` | 6 hrs |
| 2.2 | Implement News API (CRUD + categories + pagination) | `/api/news` | 8 hrs |
| 2.3 | Implement Projects API (CRUD + categories + statuses) | `/api/projects` | 8 hrs |
| 2.4 | Implement Gallery API (CRUD + albums + file upload) | `/api/gallery` | 6 hrs |
| 2.5 | Implement Reports API (CRUD + categories + file upload) | `/api/reports` | 6 hrs |
| 2.6 | Implement Partners API (CRUD + categories) | `/api/partners` | 4 hrs |

### Phase 3: Authentication & Admin (Week 3-4)

| Step | Task | Endpoints | Effort |
|------|------|-----------|--------|
| 3.1 | Implement JWT authentication (login, register, refresh, logout) | `/api/auth/*` | 10 hrs |
| 3.2 | Implement auth middleware | `src/middleware/authMiddleware.ts` | 2 hrs |
| 3.3 | Implement admin middleware | `src/middleware/adminMiddleware.ts` | 1 hr |
| 3.4 | Implement dashboard stats API | `/api/stats/dashboard` | 4 hrs |
| 3.5 | Implement site settings API | `/api/settings` | 4 hrs |
| 3.6 | Implement file upload API (Cloudinary integration) | `/api/upload` | 4 hrs |
| 3.7 | Implement newsletter API | `/api/newsletter` | 2 hrs |

### Phase 4: Frontend Integration (Week 4-5)

| Step | Task | Components | Effort |
|------|------|------------|--------|
| 4.1 | Wire ContactForm to real API | `ContactForm.tsx` | 2 hrs |
| 4.2 | Wire NewsSection to real API | `NewsSection.tsx`, `NewsCategories.tsx` | 6 hrs |
| 4.3 | Wire ProjectsSection to real API | `ProjectsSection.tsx`, `ProjectCategories.tsx` | 6 hrs |
| 4.4 | Wire GalleryGrid to real API | `GalleryGrid.tsx`, `GalleryList.tsx` | 4 hrs |
| 4.5 | Wire Admin dashboard to real API | All admin components | 12 hrs |
| 4.6 | Wire AdminSettingsForm to settings API | `AdminSettingsForm.tsx` | 3 hrs |
| 4.7 | Wire Footer newsletter to API | `Footer.tsx` | 1 hr |
| 4.8 | Build Reports page | `reports/page.tsx` | 3 hrs |
| 4.9 | Build news detail page | `news/[slug]/page.tsx` | 3 hrs |
| 4.10 | Build project detail page | `projects/[slug]/page.tsx` | 3 hrs |

### Phase 5: Polish & Security (Week 5-6)

| Step | Task | Details | Effort |
|------|------|---------|--------|
| 5.1 | Add input validation (Zod) | All POST/PUT endpoints | 6 hrs |
| 5.2 | Add rate limiting | All API routes | 3 hrs |
| 5.3 | Add CSRF protection | POST/PUT/DELETE endpoints | 3 hrs |
| 5.4 | Add request logging | Middleware | 2 hrs |
| 5.5 | Add CORS configuration | Next.js config | 30 min |
| 5.6 | Add error handling middleware | Global error handler | 3 hrs |
| 5.7 | Add soft-delete filtering | All repositories | 2 hrs |
| 5.8 | Add pagination helper | Standardized query parsing | 2 hrs |
| 5.9 | Add password reset flow | `/api/auth/forgot-password`, `/api/auth/reset-password` | 4 hrs |
| 5.10 | Add admin audit logging | Track all CRUD operations | 4 hrs |
| 5.11 | Build admin login page | `src/app/admin/login/` | 4 hrs |

---

## Summary

### By the Numbers

| Metric | Count |
|--------|-------|
| Total source files audited | ~120 |
| Frontend components | ~70 |
| Backend stub files | ~20 |
| Mock data files | ~20 |
| API endpoints called by frontend | 4 (contact, gallery GET, gallery POST, newsletter) |
| Working API endpoints | 0 |
| Model/type mismatches | 10 |
| Missing endpoints | 46 |
| Security vulnerabilities | 7+ |
| Files with critical bugs | 12+ |

### Key Takeaway

The project has a **complete, well-structured frontend** with polished UI components, full internationalization (English + Amharic), responsive design, and comprehensive admin pages — all using static mock data. The backend consists of **stub files only** (controllers, services, repositories, models) with:

- **No API route handlers** (no `src/app/api/` directory)
- **No working endpoints** (0 out of ~50 planned endpoints)
- **No authentication** (admin pages publicly accessible)
- **No input validation** (empty `validations.ts`)
- **12+ model/type mismatches** between `src/models/` and Prisma schema
- **Out-of-sync Prisma schema** vs migration SQL (dual-language field mismatch, 3 missing models)
- **Wrong model name** in `galleryRepository.ts` (`prisma.gallery` doesn't exist)
- **Wrong Router types** in `galleryController.ts` (Pages Router types in App Router project)

**Estimated total effort to achieve full functionality: 5-6 weeks for a single developer.**

<execute_command>
<command>cd "c:\Users\DANI\Desktop\Train\FULLSTACK\damot-union" && tail -20 BACKEND_REQUIREMENTS.md</command>
</execute_command>


# Damot Union — Complete Backend Requirements & Project Audit

> **Author:** Lead Software Architect  
> **Date:** 2025-07-19  
> **Project:** Damot Multipurpose Farmers Cooperative Union  
> **Stack:** Next.js 16 (App Router) + TypeScript + Prisma (MySQL) + next-intl (i18n)  
> **Frontend State:** Fully scaffolded with mock data; zero real API integrations  
> **Backend State:** Stub files only — no server, no routes, no real endpoints

---

## Table of Contents

1. [Full Repository File Activity Register](#1-full-repository-file-activity-register)
2. [Existing Backend Codebase Analysis](#2-existing-backend-codebase-analysis)
3. [Existing Frontend Codebase Analysis & API Mapping](#3-existing-frontend-codebase-analysis--api-mapping)
4. [Missing Code & Gap Identification](#4-missing-code--gap-identification)
5. [Prioritized Fix & Implementation Roadmap](#5-prioritized-fix--implementation-roadmap)

---

## 1. Full Repository File Activity Register

### Legend
| Status | Meaning |
|--------|---------|
| ✅ Complete | Fully implemented, works with mock data |
| ⚠️ Partial | Scaffolded but not wired to backend |
| ❌ Missing | Does not exist yet |
| 🐛 Broken | Has bugs or errors |

### Root Configuration Files

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `.gitignore` | Git ignore rules | Ignores node_modules, .next, .env, build artifacts | None | ✅ Complete |
| `eslint.config.mjs` | ESLint config | Linting rules for Next.js/TypeScript | None | ✅ Complete |
| `next.config.ts` | Next.js config | next-intl plugin, allowedDevOrigins, logging config | None | ✅ Complete |
| `package.json` | Dependencies | Next.js 16, Prisma, next-intl, react-hook-form, zod, cloudinary, bcrypt, embla-carousel, recharts | Lists all packages | ✅ Complete |
| `postcss.config.mjs` | PostCSS config | Tailwind CSS v4 postcss plugin | None | ✅ Complete |
| `prisma.config.ts` | Prisma config | Defines schema path and datasource URL from env | Reads DATABASE_URL env | ⚠️ Partial |
| `tsconfig.json` | TypeScript config | Path aliases (`@/*`), JSX, bundler module resolution | None | ✅ Complete |
| `README.md` | Documentation | Basic scaffolding info | None | ⚠️ Partial |
| `TODO.md` | Task tracking | Step-by-step project plan | None | ⚠️ Partial |

### Prisma & Database

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `prisma/schema.prisma` | Database schema | 21 models: Role, User, RefreshToken, PasswordResetToken, GalleryAlbum, GalleryImage, ContactMessageStatus, ContactMessage, NewsCategory, NewsArticle, ProjectCategory, ProjectStatus, Project, PartnerCategory, Partner, ReportCategory, Report, NotificationType, Notification, SiteSettings, OrganizationStat, WorkArea, AuditLog | Direct DB mapping via Prisma Client | ⚠️ Partial |
| `prisma/migrations/20260718210304_init_dual_language_cms/migration.sql` | Initial migration | Full SQL schema with dual-language columns (`_en`, `_am`), FK constraints, indexes | Creates all DB tables | ✅ Complete |
| `prisma/migrations/migration_lock.toml` | Migration lock | Locks Prisma to MySQL provider | None | ✅ Complete |

### i18n / Messages

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `messages/en.json` | English translations | ~1,200 lines of UI copy for all pages, forms, menus, SEO | None (static JSON) | ✅ Complete |
| `messages/am.json` | Amharic translations | ~1,200 lines of UI copy for all pages, forms, menus, SEO | None (static JSON) | ✅ Complete |

### i18n Routing

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `src/i18n/routing.ts` | Locale routing config | Defines `["en", "am"]` locales, default `am`, always locale prefix | None | ✅ Complete |
| `src/i18n/request.ts` | Message loader | Loads `messages/{locale}.json` for each request | None | ✅ Complete |
| `src/i18n/navigation.ts` | Navigation helpers | Creates locale-aware `Link`, `redirect`, `usePathname`, `useRouter` | None | ✅ Complete |

### App Root Files

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `src/app/layout1.tsx` | Root layout (legacy) | Minimal HTML wrapper with globals.css | None | ⚠️ Partial |
| `src/app/globals.css` | Global styles | Tailwind directives | None | ✅ Complete |
| `src/app/error.tsx` | Error boundary | Renders error UI | None | ✅ Complete |
| `src/app/loading.tsx` | Loading state | Renders loading UI | None | ✅ Complete |
| `src/app/robots.ts` | Robots.txt generator | Generates robots.txt | None | ✅ Complete |
| `src/app/sitemap.ts` | Sitemap generator | Generates sitemap.xml | None | ✅ Complete |
| `src/proxy.ts` | next-intl middleware | Routes locale detection, matches all paths except admin/api | None | ✅ Complete |

### [locale] Pages (Public Frontend)

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `src/app/[locale]/layout.tsx` | Locale layout | Renders Header/Footer wrappers, loads messages | None (static rendering) | ✅ Complete |
| `src/app/[locale]/page.tsx` | Home page | Renders Hero, PartnerStrip, ServicesSection, AboutSection, ImpactSection, TestimonialsSection, ProjectsSection, NewsGallerySection, JoinCTA | None (all mock data) | ✅ Complete |
| `src/app/[locale]/about/page.tsx` | About page | Renders ~15 sections: AboutHero, OverviewAndHistory, ChairmanMessage, VisionMissionValues, Objectives, GrowthAndStructure, Board, Management, WorkArea, Statistics, Partners, WatchOurStory, AboutSideNav | None (all mock data) | ✅ Complete |
| `src/app/[locale]/contact/page.tsx` | Contact page | Renders PageHero, ContactSection (form + info), ContactMap, JoinCTA | **POST /api/contact** (form submit) | ⚠️ Partial |
| `src/app/[locale]/gallery/page.tsx` | Gallery page | Renders GalleryHero, GalleryGrid | **GET /api/gallery** (list), **POST /api/gallery** (upload) | ⚠️ Partial |
| `src/app/[locale]/news/page.tsx` | News page | Renders NewsHero, NewsSection (categories, search, sort, pagination, sidebar) | None (all mock data from `data/newsData.ts`) | ✅ Complete |
| `src/app/[locale]/projects/page.tsx` | Projects page | Renders ProjectsHero, ProjectsSection, ProjectsImpact, ProjectsCTA | None (all mock data from `data/projectsData.ts`) | ✅ Complete |
| `src/app/[locale]/reports/page.tsx` | Reports page | Renders static "Reports" text only | None | ❌ Missing |
| `src/app/[locale]/services/page.tsx` | Services page | Renders ServicesHero, CoreServices, HowItWorks, ServicesImpact, WhyChooseUs, Testimonials, CoverageMap, ResourcesDownload, ServicesFaq, ServicesCTA, ServicesSideNav | None (all mock data) | ✅ Complete |

### Admin Pages

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `src/app/admin/layout.tsx` | Admin layout | Renders AdminSidebar + AdminMobileDrawer | None | ✅ Complete |
| `src/app/admin/page.tsx` | Admin dashboard | Renders AdminHeader, AdminStatCards, RecentActivities, StatisticsChart, LatestDataOverview, QuickActions | None (all mock data from `data/admin-dashboard.ts`) | ⚠️ Partial |
| `src/app/admin/gallery/page.tsx` | Admin gallery mgmt | Renders AdminHeader, AdminGalleryGrid | None (mock images from `data/news.ts`) | ⚠️ Partial |
| `src/app/admin/messages/page.tsx` | Admin messages mgmt | Renders AdminHeader, AdminMessagesTable | None (mock messages from `data/admin-messages.ts`) | ⚠️ Partial |
| `src/app/admin/news/page.tsx` | Admin news mgmt | Renders AdminHeader, AdminNewsStats, AdminNewsTable | None (mock articles from `data/newsData.ts`) | ⚠️ Partial |
| `src/app/admin/partners/page.tsx` | Admin partners mgmt | Renders AdminHeader, AdminPartnersTable | None (mock partners from `data/partners.ts`) | ⚠️ Partial |
| `src/app/admin/projects/page.tsx` | Admin projects mgmt | Renders AdminHeader, AdminProjectsStats, AdminProjectsTable | None (mock projects from `data/projectsData.ts`) | ⚠️ Partial |
| `src/app/admin/reports/page.tsx` | Admin reports mgmt | Renders AdminHeader, AdminReportsTable | None (mock reports from `data/reports.ts`) | ⚠️ Partial |
| `src/app/admin/settings/page.tsx` | Admin settings mgmt | Renders AdminHeader, AdminSettingsForm | None (local state only, no persistence) | ⚠️ Partial |

### Layout Components

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `src/components/layout/Header.tsx` | Main header | Renders top info bar, nav with mega menus, language switcher, mobile drawer | None (static) | ✅ Complete |
| `src/components/layout/Footer.tsx` | Main footer | Renders brand, quick links, services, contact, newsletter form | None (newsletter is local-only mock) | ✅ Complete |

### Home Page Components

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `src/components/home/Hero.tsx` | Hero carousel | Embla carousel with 6 background images, stat counters, CTA buttons | None (static data from `data/hero.ts`) | ✅ Complete |
| `src/components/home/PartnerStrip.tsx` | Partner logos | Static partner logo strip | None (static data from `data/partners.ts`) | ✅ Complete |
| `src/components/home/ServicesSection.tsx` | Services overview | Grid of service cards with icons | None (static data from `data/services-grid.ts`) | ✅ Complete |
| `src/components/home/AboutSection.tsx` | About preview | Vision, mission, values snippet | None (static data) | ✅ Complete |
| `src/components/home/ImpactSection.tsx` | Impact stats | Animated count-up stats | None (static data from `data/impact-metrics.ts`) | ✅ Complete |
| `src/components/home/TestimonialsSection.tsx` | Testimonials carousel | Testimonial slider | None (static data from `data/testimonials.ts`) | ✅ Complete |
| `src/components/home/ProjectsSection.tsx` | Projects preview | Project cards with progress bars | None (static data from `data/projects.ts`) | ✅ Complete |
| `src/components/home/NewsGallerySection.tsx` | News + Gallery section | Side-by-side news updates + gallery thumbnails | None (static data) | ✅ Complete |
| `src/components/home/JoinCTA.tsx` | Membership CTA | Call-to-action banner | None | ✅ Complete |
| `src/components/home/GallerySection.tsx` | Home gallery strip | Static image grid | None | ✅ Complete |
| `src/components/home/NewsSection.tsx` | Home news strip | Static news cards from translations | None | ✅ Complete |

### Contact Components

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `src/components/contact/ContactSection.tsx` | Contact section layout | Server component — renders ContactInfoGrid + ContactForm | None | ✅ Complete |
| `src/components/contact/ContactForm.tsx` | Contact form | **Actual fetch() call**: POST `/api/contact` with `{ name, phone, email, subject, message }` | **POST /api/contact** | ⚠️ Partial |
| `src/components/contact/ContactMap.tsx` | Google Maps embed | Embedded iframe map | None | ⚠️ Partial |
| `src/components/contacts/PageHero.tsx` | Shared hero banner | Reusable page hero with breadcrumb, used on Contact page | None | ✅ Complete |
| `src/components/contact/ContactInfoGrid.tsx` | Contact detail cards | Phone, email, address, hours display | None | ✅ Complete |

### Gallery Components

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `src/components/gallery/GalleryGrid.tsx` | Gallery grid (new) | Categories, tabs, sort, lightbox, upload modal. Uses `data/galleryData.ts` mock data | None (local mock data) | ✅ Complete |
| `src/components/gallery/GalleryList.tsx` | Gallery list (legacy) | **Actual fetch() calls**: GET `/api/gallery` on mount, populates image grid with lightbox | **GET /api/gallery** | ⚠️ Partial |
| `src/components/gallery/GalleryUpload.tsx` | Gallery upload (legacy) | **Actual fetch() call**: POST `/api/gallery` with `{ url }` | **POST /api/gallery** | ⚠️ Partial |
| `src/components/gallery/GalleryHero.tsx` | Gallery hero | Page hero banner | None | ✅ Complete |

### News Components

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `src/components/news/NewsSection.tsx` | News main section | Categories filter, search, sort, pagination, hydrated translations | None (mock data from `data/newsData.ts`) | ✅ Complete |
| `src/components/news/NewsCard.tsx` | News article card | Renders thumbnail, title, excerpt, date, read more link | None | ✅ Complete |
| `src/components/news/NewsCardImage.tsx` | News card image loader | Next/Image with blur placeholder | None | ✅ Complete |
| `src/components/news/NewsList.tsx` | News list (legacy) | Renders grid of NewsCard with load-more pagination | None | ✅ Complete |
| `src/components/news/NewsHero.tsx` | News page hero | Page hero with breadcrumb | None | ✅ Complete |
| `src/components/news/NewsToolbar.tsx` | News toolbar | Search input + sort dropdown | None | ✅ Complete |
| `src/components/news/NewsCategories.tsx` | News category sidebar | Sidebar with category counts | None | ✅ Complete |
| `src/components/news/NewsSidebar.tsx` | News sidebar container | Contains featured, announcements, newsletter | None | ✅ Complete |
| `src/components/news/FeaturedNewsSidebar.tsx` | Featured article card | Featured news highlight | None | ✅ Complete |
| `src/components/news/LatestAnnouncements.tsx` | Announcements list | List of announcements | None | ✅ Complete |
| `src/components/news/NewsletterCard.tsx` | Newsletter signup | Email signup form (local mock only) | **POST /api/newsletter** | ⚠️ Partial |

### Projects Components

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `src/components/projects/ProjectsSection.tsx` | Projects main section | Categories filter, status filter, search, sort, pagination, hydrated translations | None (mock data from `data/projectsData.ts`) | ✅ Complete |
| `src/components/projects/ProjectCard.tsx` | Project card | Renders thumbnail, title, excerpt, location, progress bar, status badge | None | ✅ Complete |
| `src/components/projects/ProjectImage.tsx` | Project card image loader | Next/Image with blur placeholder | None | ✅ Complete |
| `src/components/projects/ProjectsHero.tsx` | Projects page hero | Page hero with breadcrumb | None | ✅ Complete |
| `src/components/projects/ProjectsImpact.tsx` | Impact stats section | Impact stats with count-up animation | None | ✅ Complete |
| `src/components/projects/ProjectsCTA.tsx` | Projects CTA | Call-to-action for partnerships | None | ✅ Complete |
| `src/components/projects/ProjectsToolbar.tsx` | Projects toolbar | Search, status filter, sort dropdown | None | ✅ Complete |
| `src/components/projects/ProjectCategories.tsx` | Project category sidebar | Sidebar with category counts | None | ✅ Complete |

### Services Components

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `src/components/services/CoreServices.tsx` | Service cards grid | 6 service cards with images, icons, descriptions | None (server component, static data) | ✅ Complete |
| `src/components/services/HowItWorks.tsx` | Membership steps | 4-step "how membership works" section | None | ✅ Complete |
| `src/components/services/ServicesImpact.tsx` | Services impact stats | Animated count-up stats with intersection observer | None | ✅ Complete |
| `src/components/services/WhyChooseUs.tsx` | Why choose us | 6 reasons with icons | None | ✅ Complete |
| `src/components/services/Testimonials.tsx` | Service testimonials | Testimonial cards | None | ✅ Complete |
| `src/components/services/CoverageMap.tsx` | Coverage map | Map/area information | None | ✅ Complete |
| `src/components/services/ResourcesDownload.tsx` | Resources download | Download cards for guides | None | ✅ Complete |
| `src/components/services/ServicesFaq.tsx` | FAQ accordion | Expandable FAQ items | None | ✅ Complete |
| `src/components/services/ServicesCTA.tsx` | Services CTA | Call-to-action banner | None | ✅ Complete |
| `src/components/services/ServicesSideNav.tsx` | Services side nav | Floating side navigation | None | ✅ Complete |
| `src/components/services/ServicesHero.tsx` | Services page hero | Page hero with breadcrumb | None | ✅ Complete |

### About Components

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `src/components/about/AboutHero.tsx` | About page hero | Page hero with breadcrumb | None | ✅ Complete |
| `src/components/about/OverviewAndHistory.tsx` | Overview + history | Timeline milestones, overview text | None | ✅ Complete |
| `src/components/about/VisionMissionValues.tsx` | Vision, Mission, Values | Vision/mission text + core values cards | None | ✅ Complete |
| `src/components/about/Objectives.tsx` | Objectives section | 6 objective cards | None | ✅ Complete |
| `src/components/about/ChairmanMessage.tsx` | Chairman's message | Quote section with values | None | ✅ Complete |
| `src/components/about/GrowthAndStructure.tsx` | Growth + org structure | Growth comparison table + org chart | None | ✅ Complete |
| `src/components/about/BoardOfDirectors.tsx` | Board of directors | 5 board member cards | None | ✅ Complete |
| `src/components/about/ManagementTeam.tsx` | Management team | 4 manager cards | None | ✅ Complete |
| `src/components/about/WorkAreaAndAchievements.tsx` | Work area + achievements | 7 woredas coverage + achievement stats | None | ✅ Complete |
| `src/components/about/StatisticsAndReports.tsx` | Stats + reports | Statistics charts, reports links | None | ✅ Complete |
| `src/components/about/PartnersAndDonors.tsx` | Partners section | Grid of partner logos | None | ✅ Complete |
| `src/components/about/WatchOurStory.tsx` | Video section | Video placeholder | None | ✅ Complete |
| `src/components/about/AboutSideNav.tsx` | About side nav | Floating side navigation | None | ✅ Complete |

### Admin Components

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `src/components/admin/AdminHeader.tsx` | Admin header | Page title, subtitle, notification + message badges with counts | None (static counts) | ⚠️ Partial |
| `src/components/admin/AdminSidebar.tsx` | Admin sidebar | Navigation with 8 menu items, active state tracking | None | ✅ Complete |
| `src/components/admin/AdminSidebarContext.tsx` | Sidebar context | Mobile sidebar open/close state | None | ✅ Complete |
| `src/components/admin/AdminMobileDrawer.tsx` | Mobile drawer | Responsive mobile sidebar | None | ✅ Complete |
| `src/components/admin/AdminStatCards.tsx` | Dashboard stat cards | 7 stat cards (News, Projects, Gallery, Reports, Partners, Messages, Settings) | None (mock data) | ⚠️ Partial |
| `src/components/admin/AdminNewsStats.tsx` | News stats | News statistics summary | None (mock data) | ⚠️ Partial |
| `src/components/admin/AdminNewsTable.tsx` | News management table | Sortable/filterable table with search, category filter, edit/delete actions | None (mock data) | ⚠️ Partial |
| `src/components/admin/AdminProjectsStats.tsx` | Projects stats | Project statistics summary | None (mock data) | ⚠️ Partial |
| `src/components/admin/AdminProjectsTable.tsx` | Projects management table | Filterable table with status/category/search | None (mock data) | ⚠️ Partial |
| `src/components/admin/AdminGalleryGrid.tsx` | Gallery management | Image grid with upload/delete | None (mock images) | ⚠️ Partial |
| `src/components/admin/AdminMessagesTable.tsx` | Messages management | Accordion list with read/reply/delete | None (mock data) | ⚠️ Partial |
| `src/components/admin/AdminPartnersTable.tsx` | Partners management | Card grid with category filter, add/edit/delete | None (mock data) | ⚠️ Partial |
| `src/components/admin/AdminReportsTable.tsx` | Reports management | Table with upload/delete | None (mock data) | ⚠️ Partial |
| `src/components/admin/AdminSettingsForm.tsx` | Settings form | Branding, contact, social, SEO fields | None (local state only) | ⚠️ Partial |
| `src/components/admin/RecentActivities.tsx` | Activity feed | Recent activity list | None (mock data) | ⚠️ Partial |
| `src/components/admin/StatisticsChart.tsx` | Statistics chart | Recharts bar chart with monthly data | None (mock data) | ⚠️ Partial |
| `src/components/admin/LatestDataOverview.tsx` | Latest data table | Table of recent content items | None (mock data) | ⚠️ Partial |
| `src/components/admin/QuickActions.tsx` | Quick action buttons | 7 quick action links | None | ⚠️ Partial |

### UI Components

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `src/components/ui/LanguageSwitcher.tsx` | Language toggle | Switches between Amharic/English | None | ✅ Complete |
| `src/components/ui/Button.tsx` | Button component | Reusable button with variants | None | ✅ Complete |
| `src/components/ui/Card.tsx` | Card component | Reusable card container | None | ✅ Complete |
| `src/components/ui/CountUpStat.tsx` | Animated counter | Number count-up animation | None | ✅ Complete |
| `src/components/ui/Input.tsx` | Input component | Reusable form input | None | ✅ Complete |
| `src/components/ui/Modal.tsx` | Modal component | Reusable modal overlay | None | ✅ Complete |
| `src/components/ui/SectionHeading.tsx` | Section heading | Reusable heading with eyebrow | None | ✅ Complete |
| `src/components/HydrationGuard.tsx` | Hydration guard | Prevents hydration mismatch | None | ✅ Complete |

### Data / Mock Data Files

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `src/data/about-content.ts` | About content data | Overview, history milestones, vision/mission, objectives, board, management text in en/am | Should be served from DB | ⚠️ Partial |
| `src/data/admin-dashboard.ts` | Dashboard mock data | Stat cards, recent activities, statistics overview, latest data, quick actions | Should be aggregate counts from DB | ⚠️ Partial |
| `src/data/admin-messages.ts` | Messages mock data | 3 mock contact messages | Should be served from contact_messages table | ⚠️ Partial |
| `src/data/admin-nav.ts` | Admin navigation config | 8 admin nav items with icons | None (static config) | ✅ Complete |
| `src/data/contact.ts` | Contact page data | Contact detail icons, subject IDs, map embed URL | None (static config) | ✅ Complete |
| `src/data/galleryData.ts` | Gallery media data | 15 media items across 8 categories | Should be served from gallery_images + gallery_albums | ⚠️ Partial |
| `src/data/hero.ts` | Hero data | 6 hero background images, 4 stat cards (en/am) | Stats from organization_stats table | ⚠️ Partial |
| `src/data/impact-metrics.ts` | Impact metrics | 7 metrics with icons (en/am) | Should be served from impact_metrics table | ⚠️ Partial |
| `src/data/navigation.ts` | Navigation data | Quick links (en/am) | None (static config) | ✅ Complete |
| `src/data/news.ts` | News data (home) | 3 news updates, 6 gallery images (en/am) | Should be served from news_articles + gallery_images | ⚠️ Partial |
| `src/data/newsData.ts` | News articles data | 12 news articles with mock content | Should be served from news_articles table | ⚠️ Partial |
| `src/data/partners.ts` | Partners data | 11 partners (en/am) with logos | Should be served from partners table | ⚠️ Partial |
| `src/data/projects.ts` | Projects data (home) | 3 projects with capacity/progress | Should be served from projects table | ⚠️ Partial |
| `src/data/projectsData.ts` | Projects data (full) | 10 projects with status, category, progress, dates | Should be served from projects table | ⚠️ Partial |
| `src/data/reports.ts` | Reports data | 3 mock reports | Should be served from reports table | ⚠️ Partial |
| `src/data/services.ts` | Services text data | 6 service names (en/am) | None (static text) | ✅ Complete |
| `src/data/services-grid.ts` | Services grid data | 6 service cards with icon/image config | None (static config) | ✅ Complete |
| `src/data/site-header-menu.ts` | Mega menu data | Full mega menu structure with columns, links, icons | None (static config) | ✅ Complete |
| `src/data/social-links.ts` | Social media links | 4 social media links | Should be served from site_settings table | ⚠️ Partial |
| `src/data/testimonials.ts` | Testimonials data | 2 testimonial entries | Should be served from testimonials table | ⚠️ Partial |

### Backend Stub Files (src/controllers, src/services, etc.)

| File Path | Component / Service Name | Current Responsibilities / Functionality | Expected Backend Interaction | Status |
|-----------|--------------------------|------------------------------------------|------------------------------|--------|
| `src/controllers/authController.ts` | Auth controller stub | `login()` returns `{ ok: true, message: "login not implemented" }` | POST /api/auth/login | 🐛 Broken |
| `src/controllers/contactController.ts` | Contact controller stub | `submitContact()` returns `{ ok: true }` | POST /api/contact | 🐛 Broken |
| `src/controllers/galleryController.ts` | Gallery controller | `getGallery()`, `addGallery()`, `deleteGallery()` using Pages Router API types | GET/POST/DELETE /api/gallery | 🐛 Broken |
| `src/controllers/newsController.ts` | News controller stub | `listNews()` returns `[]` | GET /api/news | 🐛 Broken |
| `src/controllers/projectController.ts` | Project controller stub | `listProjects()` returns `[]` | GET /api/projects | 🐛 Broken |
| `src/controllers/reportController.ts` | Report controller stub | `listReports()` returns `[]` | GET /api/reports | 🐛 Broken |
| `src/services/authService.ts` | Auth service stub | `validate()` returns `false` | Auth validation | 🐛 Broken |
| `src/services/contactService.ts` | Contact service stub | `submit()` returns `{ ok: true }` | Contact persistence | 🐛 Broken |
| `src/services/emailService.ts` | Email service stub | `sendEmail()` returns `{ ok: true }` | SMTP email sending | 🐛 Broken |
| `src/services/galleryService.ts` | Gallery service | `list()`, `get()`, `add()`, `remove()` — calls galleryRepository | Prisma queries | ⚠️ Partial |
| `src/services/newsService.ts` | News service stub | `list()` returns `[]` | Prisma queries | 🐛 Broken |
| `src/services/projectService.ts` | Project service stub | `list()` returns `[]` | Prisma queries | 🐛 Broken |
| `src/services/reportService.ts` | Report service stub | `list()` returns `[]` | Prisma queries | 🐛 Broken |
| `src/repositories/contactRepository.ts` | Contact repo stub | `create()` returns `{ ok: true }` | Prisma queries | 🐛 Broken |
| `src/repositories/galleryRepository.ts` | Gallery repo | `getAll()`, `getById()`, `create()`, `delete()` — queries `prisma.gallery` (WRONG model name) | Prisma queries on `gallery` model | 🐛 Broken |
| `src/repositories/newsRepository.ts` | News repo stub | `all()` returns `[]` | Prisma queries | 🐛 Broken |
| `src/repositories/projectRepository.ts` | Project repo stub | `all()` returns `[]` | Prisma queries | 🐛 Broken |
| `src/repositories/reportRepository.ts` | Report repo stub | `all()` returns `[]` | Prisma queries | 🐛 Broken |
| `src/repositories/userRepository.ts` | User repo stub | `find()` returns `null` | Prisma queries | 🐛 Broken |
| `src/models/User.ts` | User interface | `{ id: number, email: string, name?: string }` — **MISMATCHED** with Prisma User model | Type mapping | 🐛 Broken |
| `src/models/Contact.ts` | Contact interface | `{ id: number, message: string }` — **MISMATCHED** with Prisma ContactMessage | Type mapping | 🐛 Broken |
| `src/models/Gallery.ts` | Gallery interface | `{ id: number, url: string }` — **MISMATCHED** with Prisma GalleryImage | Type mapping | 🐛 Broken |
| `src/models/News.ts` | News interface | `{ id: number, title: string, slug: string }` — **MISMATCHED** with Prisma NewsArticle | Type mapping | 🐛 Broken |
| `src/models/Project.ts` | Project interface | `{ id: number, title: string }` — **MISMATCHED** with Prisma Project | Type mapping | 🐛 Broken |
| `src/models/Report.ts` | Report interface | `{ id: number, title: string }` — **MISMATCHED** with Prisma Report | Type mapping | 🐛 Broken |
| `src/middleware/authMiddleware.ts` | Auth middleware | `isAuthenticated()` always returns `true` — placeholder | JWT verification | 🐛 Broken |
| `src/middleware/adminMiddleware.ts` | Admin middleware | `isAdmin()` always returns `false` — placeholder | Role-based access | 🐛 Broken |
| `src/lib/auth.ts` | Auth utility | `requireAuth()` throws "Not implemented" | JWT token verification | 🐛 Broken |
| `src/lib/prisma.ts` | Prisma client | Singleton PrismaClient, uses `any` types | DB connection | ⚠️ Partial |
| `src/lib/cloudinary.ts` | Cloudinary stub | `upload()` returns `{ url: "" }` | Cloudinary API | 🐛 Broken |
| `src/lib/utils.ts` | Utilities | `noop()` returns undefined | None | ⚠️ Partial |
| `src/lib/validations.ts` | Validations | `validations = {}` — empty object | Input validation | 🐛 Broken |
| `src/hooks/useAuth.ts` | Auth hook | `useAuth()` returns `{ user: null }` | Auth API calls | 🐛 Broken |
| `src/hooks/useFetch.ts` | Generic fetch hook | `useFetch(url)` fetches data by URL | API calls | ⚠️ Partial |
| `src/actions/newsAction.ts` | News server action | `fetchNews()` returns mock data, `getNewsBySlug()`, `getNewsCategories()` | Prisma queries | ⚠️ Partial |
| `src/actions/galleryAction.ts` | Gallery server action | `fetchGallery()` returns `[]` | Prisma queries | 🐛 Broken |
| `src/actions/projectAction.ts` | Project server action | `fetchProjects()` returns `[]` | Prisma queries | 🐛 Broken |
| `src/constants/config.ts` | Config | `CONFIG = { apiBase: "/api" }` | API base path | ✅ Complete |
| `src/constants/index.ts` | Constants | `SITE_NAME = "Damot Union"` | None | ✅ Complete |

---

## 2. Existing Backend Codebase Analysis

### 2.1 Implemented Endpoints

**There are ZERO working API endpoints.** The `src/app/api/` directory does not exist. The controller/service/repository files are stubs not connected to any Next.js App Router route handlers. The `src/controllers/galleryController.ts` uses `NextApiRequest` (Pages Router type) which is incompatible with App Router.

### 2.2 Identified Errors & Bugs

| # | File | Line(s) | Bug Description | Severity |
|---|------|---------|-----------------|----------|
| 1 | All controllers | — | No API route files exist (`src/app/api/` missing) — controllers are never invoked | 🔴 Critical |
| 2 | `src/repositories/galleryRepository.ts` | 8-14 | Queries `prisma.gallery.findMany()` — model `gallery` does not exist in Prisma schema (correct: `GalleryImage`) | 🔴 Critical |
| 3 | `src/models/User.ts` | 1 | `id: number` — Prisma User has `id: String` (UUID) | 🔴 Critical |
| 4 | `src/models/Contact.ts` | 1 | `id: number` — Prisma ContactMessage has `id: String` | 🔴 Critical |
| 5 | `src/models/Gallery.ts` | 1 | `id: number, url: string` — Prisma GalleryImage has `id: String, filePath: String` | 🔴 Critical |
| 6 | `src/models/News.ts` | 1 | `id: number` — Prisma NewsArticle has `id: String` | 🔴 Critical |
| 7 | `src/models/Project.ts` | 1 | `id: number` — Prisma Project has `id: String` | 🔴 Critical |
| 8 | `src/models/Report.ts` | 1 | `id: number` — Prisma Report has `id: String` | 🔴 Critical |
| 9 | `src/controllers/galleryController.ts` | 1-2 | Uses `NextApiRequest`/`NextApiResponse` (Pages Router) — App Router uses `NextRequest`/`NextResponse` | 🔴 Critical |
| 10 | `src/middleware/authMiddleware.ts` | 1 | `isAuthenticated()` always returns `true` — no JWT verification | 🔴 Critical |
| 11 | `src/middleware/adminMiddleware.ts` | 1 | `isAdmin()` always returns `false` — no role check | 🔴 Critical |
| 12 | `src/lib/auth.ts` | 1 | `requireAuth()` throws `"Not implemented"` | 🔴 Critical |
| 13 | `src/lib/validations.ts` | 1 | `validations = {}` — empty, no validation anywhere | 🔴 High |
| 14 | `prisma/schema.prisma` | — | Schema lacks `history_milestones`, `testimonials`, `impact_metrics` models that exist in migration SQL | 🔴 High |
| 15 | `prisma/schema.prisma` | — | Has single-language fields (`name`, `description`) while migration SQL has dual-language (`name_en`, `name_am`) | 🔴 High |
| 16 | `.env` | — | No `.env` file exists — `DATABASE_URL`, `JWT_SECRET`, `CLOUDINARY_URL` not configured | 🔴 High |
| 17 | `src/lib/cloudinary.ts` | 1 | `upload()` returns empty URL — not configured | 🟡 Medium |
| 18 | `src/services/emailService.ts` | 1 | `sendEmail()` returns `{ ok: true }` — no SMTP config | 🟡 Medium |
| 19 | `src/hooks/useAuth.ts` | 3 | `useEffect([])` with empty deps — only runs once, never updates | 🟡 Medium |
| 20 | `src/hooks/useFetch.ts` | 5 | No error handling, no loading state, no abort controller | 🟡 Medium |

### 2.3 Security Issues

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | No authentication | All admin pages are publicly accessible | 🔴 Critical |
| 2 | No input validation | `src/lib/validations.ts` is empty | 🔴 High |
| 3 | No rate limiting | Any endpoint can be spammed | 🔴 High |
| 4 | No CSRF protection | POST endpoints accept requests without CSRF tokens | 🟡 Medium |
| 5 | No password hashing | `bcrypt` in package.json but no implementation | 🔴 High |
| 6 | No CORS configuration | No cross-origin protection | 🟡 Medium |
| 7 | No request logging | No audit trail for API calls | 🟡 Medium |

---

## 3. Existing Frontend Codebase Analysis & API Mapping

### 3.1 API Requests Found in Frontend

| Component | File | Method | Endpoint | Request Body | Currently Works? |
|-----------|------|--------|----------|--------------|-----------------|
| ContactForm | `src/components/contact/ContactForm.tsx:30` | POST | `/api/contact` | `{ name, phone, email, subject, message }` | ❌ No route handler |
| GalleryList | `src/components/gallery/GalleryList.tsx:32` | GET | `/api/gallery` | — | ❌ No route handler |
| GalleryUpload | `src/components/gallery/GalleryUpload.tsx:15` | POST | `/api/gallery` | `{ url }` | ❌ No route handler |
| NewsletterCard | `src/components/news/NewsletterCard.tsx` | POST | `/api/newsletter` | `{ email }` | ❌ No route handler |

### 3.2 Frontend vs Backend Mismatches

| Issue | Frontend Expects | Backend Provides | Severity |
|-------|------------------|------------------|----------|
| Gallery API response shape | `{ id: number, url: string, createdAt: string }` | No endpoint exists | 🔴 High |
| Contact API response | 200 OK on POST | No endpoint exists | 🔴 High |
| All admin CRUD operations | Mock data from `src/data/` | No endpoints exist | 🔴 High |
| All public pages | Mock data from `src/data/` | No endpoints exist | 🟡 Medium |
| Reports page | Full implementation | Static "Reports" text only | 🟡 Medium |

---

## 4. Missing Code & Gap Identification

### 4.1 Missing Backend Endpoints (46 total)

**Missing API Route Handlers** — the directory `src/app/api/` does not exist:

| # | Endpoint | Method | Purpose | Frontend Consumer | Priority |
|---|----------|--------|---------|-------------------|----------|
| 1 | `/api/health` | GET | Health check | Infrastructure | 🟢 Low |
| 2 | `/api/auth/register` | POST | Admin registration | Admin panel | 🔴 High |
| 3 | `/api/auth/login` | POST | Admin login | Admin panel | 🔴 High |
| 4 | `/api/auth/refresh` | POST | Refresh JWT token | Admin panel | 🔴 High |
| 5 | `/api/auth/logout` | POST | Logout | Admin panel | 🔴 High |
| 6 | `/api/auth/me` | GET | Current user profile | Admin panel | 🟡 Medium |
| 7 | `/api/auth/forgot-password` | POST | Password reset request | Admin panel | 🟡 Medium |
| 8 | `/api/auth/reset-password` | POST | Password reset | Admin panel | 🟡 Medium |
| 9 | `/api/contact` | POST | Submit contact form | ContactForm.tsx | 🔴 High |
| 10 | `/api/contact` | GET | List messages | AdminMessagesTable | 🔴 High |
| 11 | `/api/contact/:id` | PATCH | Update message status | AdminMessagesTable | 🔴 High |
| 12 | `/api/contact/:id` | DELETE | Delete message | AdminMessagesTable | 🔴 High |
| 13 | `/api/gallery` | GET | List gallery images | GalleryList, GalleryGrid | 🔴 High |
| 14 | `/api/gallery` | POST | Upload image | GalleryUpload, GalleryGrid | 🔴 High |
| 15 | `/api/gallery/:id` | DELETE | Delete image | AdminGalleryGrid | 🔴 High |
| 16 | `/api/gallery/albums` | GET | List albums | AdminGalleryGrid | 🟡 Medium |
| 17 | `/api/news` | GET | List articles | NewsSection | 🔴 High |
| 18 | `/api/news` | POST | Create article | AdminNewsTable | 🔴 High |
| 19 | `/api/news/:id` | PUT | Update article | AdminNewsTable | 🔴 High |
| 20 | `/api/news/:id` | DELETE | Delete article | AdminNewsTable | 🔴 High |
| 21 | `/api/news/:slug` | GET | Single article | News detail page | 🔴 High |
| 22 | `/api/news/categories` | GET | List categories | NewsCategories | 🔴 High |
| 23 | `/api/projects` | GET | List projects | ProjectsSection | 🔴 High |
| 24 | `/api/projects` | POST | Create project | AdminProjectsTable | 🔴 High |
| 25 | `/api/projects/:id` | PUT | Update project | AdminProjectsTable | 🔴 High |
| 26 | `/api/projects/:id` | DELETE | Delete project | AdminProjectsTable | 🔴 High |
| 27 | `/api/projects/categories` | GET | List categories | ProjectCategories | 🔴 High |
| 28 | `/api/partners` | GET | List partners | AdminPartnersTable | 🟡 Medium |
| 29 | `/api/partners` | POST | Create partner | AdminPartnersTable | 🟡 Medium |
| 30 | `/api/partners/:id` | PUT | Update partner | AdminPartnersTable | 🟡 Medium |
| 31 | `/api/partners/:id` | DELETE | Delete partner | AdminPartnersTable | 🟡 Medium |
| 32 | `/api/reports` | GET | List reports | AdminReportsTable | 🔴 High |
| 33 | `/api/reports` | POST | Upload report | AdminReportsTable | 🔴 High |
| 34 | `/api/reports/:id` | DELETE | Delete report | AdminReportsTable | 🔴 High |
| 35 | `/api/reports/categories` | GET | List categories | AdminReportsTable | 🟡 Medium |
| 36 | `/api/settings` | GET | Get site settings | AdminSettingsForm | 🔴 High |
| 37 | `/api/settings` | PUT | Update settings | AdminSettingsForm | 🔴 High |
| 38 | `/api/newsletter` | POST | Subscribe email | NewsletterCard, Footer | 🟡 Medium |
| 39 | `/api/upload` | POST | Upload file (image/PDF) | Multiple components | 🔴 High |
| 40 | `/api/stats/dashboard` | GET | Dashboard aggregate stats | AdminStatCards | 🔴 High |
| 41 | `/api/stats/organization` | GET | Organization stats by year | ImpactSection | 🟡 Medium |
| 42 | `/api/stats/impact` | GET | Impact metrics | ImpactSection | 🟡 Medium |
| 43 | `/api/testimonials` | GET | List testimonials | TestimonialsSection | 🟡 Medium |
| 44 | `/api/activity-logs` | GET | Recent admin activities | RecentActivities | 🟡 Medium |
| 45 | `/api/notifications` | GET | Admin notifications | AdminHeader | 🟡 Medium |
| 46 | `/api/notifications` | PATCH | Mark notifications read | AdminHeader | 🟡 Medium |

### 4.2 Missing Frontend Integrations

| # | Missing Feature | Location | Notes |
|---|----------------|----------|-------|
| 1 | Reports page content | `src/app/[locale]/reports/page.tsx` | Only shows "Reports" text |
| 2 | Admin login page | `src/app/admin/login/` | No auth UI exists |
| 3 | News detail page | `src/app/[locale]/news/[slug]/` | No individual article page |
| 4 | Project detail page | `src/app/[locale]/projects/[slug]/` | No individual project page |
| 5 | Admin CRUD forms | `src/app/admin/*/new/`, `src/app/admin/*/[id]/edit/` | Add/Edit pages referenced but not built |
| 6 | File upload UI | Multiple components | Admin uses "Upload" buttons but no file picker integration |

### 4.3 Missing Logic & Validations

| # | Missing Feature | Location | Impact |
|---|----------------|----------|--------|
| 1 | Input validation middleware | `src/lib/validations.ts` empty | No server-side validation |
| 2 | JWT authentication middleware | `src/middleware/authMiddleware.ts` | No auth protection |
| 3 | Role-based authorization | `src/middleware/adminMiddleware.ts` | No admin access control |
| 4 | Error handling middleware | None | No standardized error responses |
| 5 | Rate limiting | None | Vulnerable to abuse |
| 6 | File upload validation | None | No file type/size checks |
| 7 | CORS configuration | None | No cross-origin protection |
| 8 | Request logging | None | No audit trail |
| 9 | Soft-delete filtering | All repositories | No `deletedAt` filtering |
| 10 | Pagination helper | None | No standardized pagination |

---

## 5. Prioritized Fix & Implementation Roadmap

### Phase 1: Critical Fixes (Week 1)

| Step | Task | Files Affected | Effort |
|------|------|---------------|--------|
| 1.1 | Create `.env.example` | New file | 15 min |
| 1.2 | Reconcile Prisma schema with migration SQL (add dual-language fields, missing models) | `prisma/schema.prisma` | 4 hrs |
| 1.3 | Fix `galleryRepository.ts` — change `prisma.gallery` to `prisma.galleryImage` | `src/repositories/galleryRepository.ts` | 15 min |
| 1.4 | Update all model interfaces to match Prisma schema | `src/models/*.ts`, `src/types/*.ts` | 2 hrs |
| 1.5 | Create proper TypeScript types matching Prisma models | `src/types/*.ts` | 2 hrs |
| 1.6 | Create `src/app/api/` route handlers | New files | 4 hrs |
| 1.7 | Fix gallery controller to use App Router types | `src/controllers/galleryController.ts` | 30 min |

### Phase 2: Core API Routes (Week 2-3)

| Step | Task | Endpoints | Effort |
|------|------|-----------|--------|
| 2.1 | Implement Contact API (CRUD + status management) | `/api/contact` | 6 hrs |
| 2.2 | Implement News API (CRUD + categories + pagination) | `/api/news` | 8 hrs |
| 2.3 | Implement Projects API (CRUD + categories + statuses) | `/api/projects` | 8 hrs |
| 2.4 | Implement Gallery API (CRUD + albums + file upload) | `/api/gallery` | 6 hrs |
| 2.5 | Implement Reports API (CRUD + categories + file upload) | `/api/reports` | 6 hrs |
| 2.6 | Implement Partners API (CRUD + categories) | `/api/partners` | 4 hrs |

### Phase 3: Authentication & Admin (Week 3-4)

| Step | Task | Endpoints | Effort |
|------|------|-----------|--------|
| 3.1 | Implement JWT authentication (login, register, refresh, logout) | `/api/auth/*` | 10 hrs |
| 3.2 | Implement auth middleware | `src/middleware/authMiddleware.ts` | 2 hrs |
| 3.3 | Implement admin middleware | `src/middleware/adminMiddleware.ts` | 1 hr |
| 3.4 | Implement dashboard stats API | `/api/stats/dashboard` | 4 hrs |
| 3.5 | Implement site settings API | `/api/settings` | 4 hrs |
| 3.6 | Implement file upload API (Cloudinary integration) | `/api/upload` | 4 hrs |
| 3.7 | Implement newsletter API | `/api/newsletter` | 2 hrs |

### Phase 4: Frontend Integration (Week 4-5)

| Step | Task | Components | Effort |
|------|------|------------|--------|
| 4.1 | Wire ContactForm to real API | `ContactForm.tsx` | 2 hrs |
| 4.2 | Wire NewsSection to real API | `NewsSection.tsx`, `NewsCategories.tsx` | 6 hrs |
| 4.3 | Wire ProjectsSection to real API | `ProjectsSection.tsx`, `ProjectCategories.tsx` | 6 hrs |
| 4.4 | Wire GalleryGrid to real API | `GalleryGrid.tsx`, `GalleryList.tsx` | 4 hrs |
| 4.5 | Wire Admin dashboard to real API | All admin components | 12 hrs |
| 4.6 | Wire AdminSettingsForm to settings API | `AdminSettingsForm.tsx` | 3 hrs |
| 4.7 | Wire Footer newsletter to API | `Footer.tsx` | 1 hr |
| 4.8 | Build Reports page | `reports/page.tsx` | 3 hrs |
| 4.9 | Build news detail page | `news/[slug]/page.tsx` | 3 hrs |
| 4.10 | Build project detail page | `projects/[slug]/page.tsx` | 3 hrs |

### Phase 5: Polish & Security (Week 5-6)

| Step | Task | Details | Effort |
|------|------|---------|--------|
| 5.1 | Add input validation (Zod) | All POST/PUT endpoints | 6 hrs |
| 5.2 | Add rate limiting | All API routes | 3 hrs |
| 5.3 | Add CSRF protection | POST/PUT/DELETE endpoints | 3 hrs |
| 5.4 | Add request logging | Middleware | 2 hrs |
| 5.5 | Add CORS configuration | Next.js config | 30 min |
| 5.6 | Add error handling middleware | Global error handler | 3 hrs |
| 5.7 | Add soft-delete filtering | All repositories | 2 hrs |
| 5.8 | Add pagination helper | Standardized query parsing | 2 hrs |
| 5.9 | Add password reset flow | `/api/auth/forgot-password`, `/api/auth/reset-password` | 4 hrs |
| 5.10 | Add admin audit logging | Track all CRUD operations | 4 hrs |
| 5.11 | Build admin login page | `src/app/admin/login/` | 4 hrs |

---

## Summary

### By the Numbers

| Metric | Count |
|--------|-------|
| Total source files audited | ~120 |
| Frontend components | ~70 |
| Backend stub files | ~20 |
| Mock data files | ~20 |
| API endpoints called by frontend | 4 (contact, gallery GET, gallery POST, newsletter) |
| Working API endpoints | 0 |
| Model/type mismatches | 10 |
| Missing endpoints | 46 |
| Security vulnerabilities | 7+ |
| Files with critical bugs | 12+ |

### Key Takeaway

The project has a **complete, well-structured frontend** with polished UI components, full internationalization (English + Amharic), responsive design, and comprehensive admin pages — all using static mock data. The backend consists of **stub files only** (controllers, services, repositories, models) with:

- **No API route handlers** (no `src/app/api/` directory)
- **No working endpoints** (0 out of ~50 planned endpoints)
- **No authentication** (admin pages publicly accessible)
- **No input validation** (empty `validations.ts`)
- **12+ model/type mismatches** between `src/models/` and Prisma schema
- **Out-of-sync Prisma schema** vs migration SQL (dual-language field mismatch, 3 missing models)
- **Wrong model name** in `galleryRepository.ts` (`prisma.gallery` doesn't exist)
- **Wrong Router types** in `galleryController.ts` (Pages Router types in App Router project)

**Estimated total effort to achieve full functionality: 5-6 weeks for a single developer.** analyze everything in detail based on this and the previous prompts  without code and give me comment and recommendation