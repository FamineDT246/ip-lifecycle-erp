# IP-Lifecycle-ERP

A B2B Enterprise Resource Planning (ERP) platform designed to manage the end-to-end lifecycle of intellectual property, from initial registration to commercial licensing and deal negotiation.

## Overview

IP-Lifecycle-ERP streamlines complex business transactions by providing distinct, role-based portals for Buyers, Creators, Sales Representatives, and Operations Administrators. The platform eliminates offline friction by moving negotiations, contract drafting, and asset delivery into secure, centralized Deal Rooms.

## Key Features

- **Multi-Tenant Architecture:** Secure, role-based access control (RBAC) ensuring data isolation between buyers, creators, and administrators.
- **Interactive Sales Pipeline:** A drag-and-drop Kanban board for sales representatives to track leads and update deal stages in real-time.
- **Secure Deal Rooms:** Dedicated negotiation workspaces featuring dynamic contract generation, clause amendment tracking, and financial quoting.
- **Digital Asset Vault:** Secure upload and storage for both internal legal documentation and deliverable commercial assets.
- **Dynamic Access Control:** Database-level Row Level Security (RLS) policies to ensure strict data governance.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Frontend:** React.js, Tailwind CSS
- **Backend & Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Form Management & Validation:** React Hook Form, Zod
- **State Management:** Zustand

## Getting Started

1. Clone the repository:
   ```bash
   git clone [https://github.com/FamineDT246/ip-lifecycle-erp.git](https://github.com/your-username/ip-lifecycle-erp.git)