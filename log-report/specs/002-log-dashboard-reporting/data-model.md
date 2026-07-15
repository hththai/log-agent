# Data Model: Log Dashboard Reporting

## Entities

### SessionUser
- id: string
- email: string
- role: string
- provider: string

**Purpose**: Represents the authenticated user for the protected dashboard experience.

### ReportFilter
- service: string | null
- reportType: string
- timeRange: string
- searchTerm: string | null

**Purpose**: Captures the user-selected dashboard filters for cross-report views.

### ReportView
- key: string
- label: string
- description: string

**Purpose**: Represents the different report experiences available in the dashboard, such as traffic, IP, or service summaries.

### DemoCard
- title: string
- description: string
- highlight: string

**Purpose**: Supports the public demo section shown to unauthenticated visitors.

## Relationships
- A SessionUser can access the protected dashboard and apply ReportFilter selections.
- A ReportFilter affects which ReportView content is shown to the user.
- The public landing experience can show multiple DemoCard entries without requiring authentication.
