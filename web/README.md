# Sarj Modul - Web Admin Dashboard

EV Charging Station Management Platform - B2B SaaS Web Admin Dashboard.

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 + Shadcn/ui (Radix)
- React Router, TanStack Query, Zustand
- Recharts, Leaflet

## Development

```bash
npm install
npm run dev
```

Runs at http://localhost:5173. API requests to `/api` are proxied to the backend (http://localhost:4000).

## Environment

Create `.env`:

```
VITE_API_URL=/api
VITE_OCPP_GATEWAY_URL=http://localhost:3000
```

## Roles & Views

- **Super Admin**: Overview (tenants, CPs, energy, revenue), map, tenants table
- **Admin**: Overview, charge points grid, users table, reports
- **End User**: Charging history, balance, CO2 savings calculator

## Login

- Super Admin: `admin@sarjmodul.com` / `Admin123!` (after seed)
