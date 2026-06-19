# iNegosyo (MVP Specification)

## Product Name

**iNegosyo**

---

## Goal

Help home-based sellers track:

- Orders
- Customers
- Payments

without using notebooks, spreadsheets, or scrolling through Messenger conversations.

### Target Users

- Home bakers
- Food sellers
- Resellers
- Small online sellers
- Home-based businesses

### Primary Goal

> Know who ordered, how much they owe, and whether the order has been delivered.

---

# Tech Stack

## Frontend

- Next.js 15
- TypeScript
- Tailwind CSS
- shadcn/ui

## Backend

- Supabase

## Hosting

- Vercel

## Authentication

- Supabase Auth

## Database

- PostgreSQL (Supabase)

## UI

- Mobile-first responsive design

---

# MVP Scope

## Authentication

### Features

- Sign up
- Login
- Logout
- Password reset

### Requirements

- Users only see their own data
- Multi-tenant architecture

---

# Database Schema

## Users

Managed by Supabase Auth.

---

## Customers

### Table: `customers`

| Field | Type |
|---------|---------|
| id | uuid |
| user_id | uuid |
| name | text |
| phone_number | text |
| address | text |
| notes | text |
| created_at | timestamp |
| updated_at | timestamp |

---

## Orders

### Table: `orders`

| Field | Type |
|---------|---------|
| id | uuid |
| user_id | uuid |
| customer_id | uuid |
| product_name | text |
| quantity | integer |
| unit_price | numeric |
| total_amount | numeric |
| payment_status | enum |
| delivery_method | enum |
| order_status | enum |
| notes | text |
| created_at | timestamp |
| updated_at | timestamp |

---

# Enums

## Payment Status

```text
UNPAID
PARTIAL
PAID
```

## Delivery Method

```text
PICKUP
LOCAL_RIDER
SELLER_DELIVERY
```

## Order Status

```text
PENDING
PREPARING
READY
DELIVERED
CANCELLED
```

---

# Dashboard

## KPI Cards

- Pending Orders
- Orders Today
- Unpaid Orders
- Total Sales Today

## Recent Orders

Display latest 10 orders.

---

# Customers Module

## Customer List

### Features

- Search customer
- View customer details
- Edit customer
- Delete customer

---

## Add Customer

### Fields

```text
Name
Phone Number
Address
Notes
```

### Validation

- Name required
- Phone optional

---

# Orders Module

## Order List

### Filters

- All
- Pending
- Preparing
- Ready
- Delivered
- Cancelled

### Search

- Customer Name
- Product Name

---

## Add Order

### Fields

```text
Customer
Product Name
Quantity
Unit Price
Total Amount (auto-computed)
Payment Status
Delivery Method
Notes
```

---

## Order Detail Page

### Display

```text
Customer
Product
Quantity
Price
Payment Status
Order Status
Delivery Method
Notes
```

### Actions

- Edit
- Change Status
- Delete

---

# Payments Module

## Payment Summary

Display:

```text
Unpaid Orders Count
Partially Paid Orders Count
Total Receivables
```

---

## Receivables List

Display:

```text
Customer
Amount
Status
```

### Filters

```text
UNPAID
PARTIAL
```

---

# Mobile UX Requirements

Must be optimized for:

```text
Android Phones
iPhones
```

### Requirements

- Large touch targets
- Sticky bottom navigation
- Fast loading
- Responsive layout

---

# Navigation

## Bottom Tabs

```text
Dashboard
Orders
Customers
Payments
```

---

# Security

### Requirements

- Row Level Security enabled
- Users only access their own records
- Validate all inputs
- Use Supabase RLS policies

---

# UI Style

### Theme

```text
Clean
Professional
Business-oriented
Minimalist
```

### Inspiration

- Modern POS systems
- Mobile banking apps

### Components

- Tailwind CSS
- shadcn/ui

---

# Future Features (Not Included in MVP)

Create placeholders only.

```text
Inventory Tracking
Sales Reports
Export PDF
Export Excel
GCash Integration
SMS Notifications
Multi-user Staff Accounts
```

---

# Windsurf Scaffolding Prompt

```text
Build a production-ready SaaS called Mini Negosyo Tracker using Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Supabase Auth, and Supabase PostgreSQL.

The application must be mobile-first and optimized for home-based sellers.

Implement:

- Authentication
- Customers module
- Orders module
- Payments module
- Dashboard

Use Row Level Security so users only access their own data.

Create database migrations, Supabase schema, TypeScript types, API actions, responsive pages, reusable components, form validation, loading states, error handling, and seed data.

Use clean architecture and organize code for future expansion into inventory management and sales analytics.

Generate all code necessary to run locally and deploy on Vercel.
```

---

# Notes for Discovery Session

Before development, observe the seller's actual workflow and answer:

1. How are orders currently tracked?
2. How are payments tracked?
3. What information is frequently forgotten?
4. What takes the most time each day?
5. What causes mistakes or lost sales?
6. Which statuses are actually used in the business?

Update this specification based on real-world usage before final implementation.
