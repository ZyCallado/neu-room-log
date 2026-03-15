# **App Name**: NEURoomLog

## Core Features:

- Secure Authentication & Role-based Access: Google OAuth login restricted to institutional emails, with user role management (professor/admin) and first-time user setup to ensure access restrictions and routing.
- Professor Check-in/Check-out Workflow: In-app QR scanner for professors to log their time in and out of rooms using unique QR codes, providing real-time feedback on active sessions.
- Admin Room & QR Code Management: An administrative interface for defining rooms and generating scannable QR codes for each room ID to facilitate system setup and room identification.
- Comprehensive Admin Dashboard: A centralized administrative view displaying aggregated room usage statistics (e.g., active users, most used rooms) and a filterable, sortable data table of all room usage logs.
- AI-Driven Usage Analysis Tool: An AI-powered tool for administrators to interpret complex room utilization patterns from log data, generating natural language insights on usage efficiency, trends, and anomalies.
- Admin Professor User Management: Tools for administrators to view and manage all professor accounts, including the ability to selectively block or unblock their access to the room logging system.
- PWA Foundations & Automated Maintenance: Implements core Progressive Web App features for installability and offline support via a service worker, alongside a scheduled function to automatically close overdue check-in sessions.

## Style Guidelines:

- Primary color: A professional and clean deep sky blue (#297AA3) to convey clarity and focus in data presentation. (HSL: 220, 60%, 40%)
- Background color: A subtly cool, desaturated off-white (#F0F3F5) to maintain a bright, spacious feel for the user interface. (HSL: 220, 20%, 95%)
- Accent color: A vibrant yet serene bright cyan (#3CC2DD) for highlighting interactive elements and calls to action, providing clear visual contrast. (HSL: 190, 70%, 55%)
- Headlines will use 'Space Grotesk' (sans-serif) for a modern, tech-inspired appearance. Body text and data tables will utilize 'Inter' (sans-serif) for objective clarity and excellent readability across different contexts.
- Clean, functional line-art icons should be used to visually represent actions and data points, such as QR code scanning, check-in status, user roles, and administrative settings. Prioritize legibility and intuitive understanding.
- Embrace a minimalist and responsive design for all interfaces, ensuring clear content hierarchy and accessibility across devices. Dashboards should feature organized grids and well-defined sections for statistics and tables.
- Subtle, non-intrusive animations and transitions should be used to enhance user feedback for actions like scanning, data loading, or state changes, promoting a fluid user experience without distraction.