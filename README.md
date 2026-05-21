# IP-Lifecycle-ERP

A B2B Enterprise Resource Planning (ERP) platform designed to manage the end-to-end lifecycle of intellectual property, from initial registration to commercial licensing and deal negotiation.

## Overview
IP-Lifecycle-ERP streamlines complex business transactions by providing distinct, role-based portals for Buyers, Creators, Sales Representatives, and Operations Administrators. The platform eliminates offline friction by moving negotiations, contract drafting, and asset delivery into secure, centralized Deal Rooms.

## Features
- **Role-Based Access (RBAC):** Secure data isolation between stakeholders.
- **Kanban Pipeline:** Real-time sales stage tracking for deal management.
- **Secure Deal Rooms:** Workspace for contract generation and clause amendments.
- **IP Vault:** Secure cloud storage for internal legal docs and commercial assets.

## Quick Setup
1. **Clone & Install:**
   ```bash
   git clone [https://github.com/FamineDT246/ip-lifecycle-erp.git](https://github.com/FamineDT246/ip-lifecycle-erp.git)
   cd ip-lifecycle-erp
   npm install
   
2.Configure: Create a .env.local file with your Supabase credentials:
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

3.Launch:
    npm run dev
