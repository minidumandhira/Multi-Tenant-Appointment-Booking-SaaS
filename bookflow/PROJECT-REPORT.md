# BookFlow Project Report

**Project:** BookFlow - Appointment Booking SaaS  
**Technology:** Next.js, React, TypeScript, Tailwind CSS, Supabase  
**Report date:** 6 October 2026  
**Repository:** `minidumandhira/Multi-Tenant-Appointment-Booking-SaaS`

## 1. Executive summary

BookFlow is a web-based appointment operations platform for businesses that manage scheduled services. The application provides an authenticated workspace in which an owner can create and manage one or more businesses, configure operating hours, maintain services, staff, and customer records, and create or update appointments.

The project is implemented as a Next.js App Router application. Supabase provides authentication, session persistence, and the PostgreSQL-backed data API. The interface uses React client components and Tailwind CSS utility classes, with a dark, responsive visual style.

The current codebase represents a functional application foundation and an end-to-end management workflow. Production readiness would require additional hardening, automated tests, database migration documentation, and completion of several user-experience and operational features described in this report.

## 2. Problem statement

Appointment-based businesses commonly manage their availability, staff, services, and customer information across disconnected tools. This creates duplicate data, scheduling conflicts, and limited visibility into upcoming work.

BookFlow addresses this problem by bringing the principal appointment-management records into one workspace:

- Businesses and their contact information
- Weekly operating hours
- Services and service details
- Staff members
- Customers
- Appointments and their status

## 3. Objectives

The project is designed to:

1. Provide secure account registration and sign-in.
2. Support owner-scoped management of multiple businesses.
3. Centralize operational records in a dashboard.
4. Prevent appointments outside business hours.
5. Detect overlapping appointments for the same staff member.
6. Offer a responsive interface for desktop and smaller screens.
7. Use a managed backend that can scale independently from the frontend.

## 4. Implemented features

### 4.1 Authentication

- Account creation at `/signup`.
- Email-and-password sign-in at `/login`.
- Supabase Auth integration through `@supabase/ssr`.
- Redirect from protected dashboard routes to the login page when no authenticated claims are available.
- Authenticated login redirects to `/dashboard`.
- User metadata supports storing a full name during registration.

### 4.2 Dashboard

The dashboard provides an operational summary for the signed-in owner:

- Number of businesses
- Number of services
- Number of staff members
- Number of customers
- Up to five upcoming, non-cancelled appointments
- Customer, service, and staff names resolved for appointment display
- Responsive sidebar navigation and mobile menu state

### 4.3 Business management

The application supports:

- Listing businesses owned by the current user
- Creating a business
- Viewing a business workspace
- Editing business details
- Capturing description, phone, email, website, address, city, and country

### 4.4 Operating hours

Business-specific hours can be configured through the hours route. Appointment validation uses the configured day-of-week opening status and opening/closing times.

### 4.5 Services

The route structure supports service management for each business:

- Service list
- Create service
- View service details
- Edit service

### 4.6 Staff

The route structure supports staff management for each business:

- Staff list
- Add staff member
- View staff details
- Edit staff member

### 4.7 Customers

The route structure supports customer management for each business:

- Customer list
- Add customer
- View customer details
- Edit customer

### 4.8 Appointments

The route structure supports:

- Appointment list
- Create appointment
- View appointment details
- Edit appointment
- Filtering appointment records by business and date/status through Supabase queries

Appointment availability validation checks that:

1. The business is open on the selected day.
2. The requested time is inside business hours.
3. The selected staff member has no overlapping non-cancelled appointment.
4. The appointment currently being edited can be excluded from the overlap check.

## 5. Technical architecture

### Frontend

- **Next.js 16 App Router:** routing, page composition, and production build.
- **React 19:** interactive forms, loading state, error state, and client-side navigation.
- **TypeScript:** strict type checking for application code.
- **Tailwind CSS 4:** responsive layout and visual styling.
- **React Compiler:** enabled in `next.config.ts`.

### Backend and data

- **Supabase Auth:** email/password authentication and session claims.
- **Supabase PostgreSQL:** business, service, staff, customer, appointment, and business-hours records.
- **Supabase SSR helpers:** separate browser and server clients for cookie-aware sessions.

### Request/session protection

The application proxy creates a server Supabase client, refreshes session cookies, and redirects unauthenticated requests whose path begins with `/dashboard` to `/login`.

### Project structure

```text
bookflow/
├── src/
│   ├── app/
│   │   ├── login/
│   │   ├── signup/
│   │   └── dashboard/
│   │       └── business/
│   ├── lib/
│   │   ├── appointments/
│   │   └── supabase/
│   ├── proxy.ts
│   └── app/globals.css
├── public/
├── package.json
├── next.config.ts
└── tsconfig.json
```

## 6. Data model represented by the application

The frontend currently uses the following Supabase tables:

| Table | Purpose | Important relationships |
|---|---|---|
| `businesses` | Stores business profiles | `owner_id` references the authenticated user |
| `business_hours` | Stores weekly opening configuration | Belongs to a business and uses `day_of_week` |
| `services` | Stores bookable services | Belongs to a business |
| `staff` | Stores staff members | Belongs to a business |
| `customers` | Stores customer records | Belongs to a business |
| `appointments` | Stores scheduled appointments | References a business, customer, service, and staff member |

The repository does not currently include a Supabase migration or schema-definition directory. The exact column types, constraints, indexes, and row-level security policies should therefore be maintained and documented in the Supabase project or added to version control.

## 7. Key user workflows

### New owner onboarding

1. User opens the signup page.
2. User submits name, email, password, and confirmation password.
3. Supabase creates the account and stores the full name in user metadata.
4. User signs in and reaches the dashboard.
5. User creates a business profile.
6. User configures hours, services, and staff.
7. User adds customers and begins creating appointments.

### Appointment creation

1. Owner selects a business.
2. Owner selects a customer, service, staff member, date, and time.
3. The application checks business hours.
4. The application checks staff availability.
5. A valid appointment is saved through Supabase.
6. The appointment is visible in the business appointment list and dashboard summary.

### Appointment editing

When an existing appointment is edited, its own ID can be excluded from the overlap query so that an unchanged appointment does not conflict with itself.

## 8. User interface and accessibility observations

The interface uses a consistent dark visual theme with gradient accents and responsive layouts. The login page includes:

- Semantic labels for email and password fields
- Required form fields
- Disabled submit state while authentication is pending
- An alert region for authentication errors
- Mobile and desktop layouts

Several other forms use labels and accessible `role` attributes for status/error messages. A complete accessibility review should still verify keyboard navigation, contrast, focus order, screen-reader announcements, and accessible names for all icon-only controls.

## 9. Security and reliability considerations

Positive implementation points:

- Authentication is delegated to Supabase rather than implemented with custom password handling.
- Dashboard access is guarded by a server-side proxy check.
- Supabase clients use cookie-aware SSR/browser patterns.
- Queries are scoped to the authenticated owner or selected business in the relevant pages.
- Appointment overlap validation excludes cancelled appointments and supports edit exclusions.

Items that should be verified before production:

- Row-level security policies must enforce owner/business isolation at the database layer, not only in client queries.
- Environment variables must be supplied through deployment secrets and must not be committed.
- Supabase schema constraints should validate foreign keys, required fields, appointment statuses, and time ranges.
- Appointment creation should be protected against race conditions if simultaneous bookings are possible.
- Error messages should be reviewed so backend details are not unnecessarily exposed to end users.
- Authentication flows should define email-confirmation, password-reset, sign-out, and expired-session behavior.

## 10. Current limitations and technical debt

The current repository appears to be an active development version rather than a fully documented production release. Notable limitations include:

- The README still contains the default create-next-app text.
- Root metadata still uses the default title and description.
- No automated test suite is present in the project scripts.
- No database migrations or schema documentation are checked into the repository.
- Signup currently reports outcomes with browser alerts rather than an inline, consistent form state.
- Form validation is mostly client-side and is not represented by shared validation schemas.
- No visible role/permission model beyond owner-scoped business access is documented.
- No evidence of email notifications, reminders, calendar synchronization, payment handling, or public customer booking pages is present.
- The dashboard currently loads data from the browser, so loading, retry, and error behavior should be tested against slow or unavailable networks.
- The application uses non-null assertions for required Supabase environment variables; startup validation would provide clearer configuration errors.

## 11. Recommended next steps

### Priority 1 - production foundation

1. Add Supabase migrations for all tables, indexes, foreign keys, and row-level security policies.
2. Add automated tests for authentication guards, CRUD operations, and availability validation.
3. Add server-side or database-level protection against concurrent appointment overlaps.
4. Replace browser alerts with consistent inline validation and feedback.
5. Add environment-variable validation and deployment documentation.

### Priority 2 - product completeness

1. Add password reset, sign-out, and email-confirmation flows.
2. Add appointment status transitions and audit information.
3. Add pagination, search, and filtering for large customer and appointment lists.
4. Add staff-specific working hours and leave/unavailability.
5. Add public booking links for customers.

### Priority 3 - operational scale

1. Add email/SMS reminders and notification preferences.
2. Add calendar integrations.
3. Add reporting and revenue/attendance analytics.
4. Add role-based access for managers and staff.
5. Add observability, structured logging, and error tracking.

## 12. Setup and operation

### Prerequisites

- Node.js compatible with the installed Next.js version
- npm
- A Supabase project
- Supabase URL and publishable key

### Environment variables

Create `bookflow/.env.local` with the project’s Supabase values:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

### Local commands

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Useful verification commands:

```bash
npm run lint
npm run build
```

## 13. Conclusion

BookFlow establishes a clear foundation for a multi-tenant appointment-management SaaS product. Its strongest current capabilities are the Supabase-backed authentication flow, owner-scoped business workspace, structured operational entities, responsive dashboard, and practical appointment availability checks.

The highest-value work before a production launch is to formalize the database schema and row-level security, add automated coverage around scheduling and authorization, improve form feedback, and complete operational features such as notifications, roles, and public booking. With those additions, the current application structure can support a reliable and extensible appointment platform.
