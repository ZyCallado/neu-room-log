# NEU Room Usage Log (NEU Room Log)

A specialized Progressive Web Application (PWA) designed for New Era University (NEU) to streamline classroom utilization tracking. This system allows professors to check into rooms using QR codes and provides administrators with real-time analytics and management tools.

## 🚀 Features

### For Professors
- **Instant Check-in**: Scan a unique QR code located in each classroom to start a session.
- **Session Tracking**: Log subject name and estimated duration for every class.
- **Auto-Cleanup**: Sessions automatically transition to "Available" status after the planned duration to prevent stale "Occupied" indicators.
- **Activity History**: View personal logs of recent classroom usage.
- **PWA Ready**: Install the app on mobile devices for a native-like scanning experience.

### For Administrators
- **Real-time Dashboard**: Monitor active sessions, daily check-ins, and weekly/monthly usage trends.
- **AI Insights**: Generate natural language summaries of room utilization patterns using Genkit (Gemini 2.5 Flash).
- **Room Management**: Create new classrooms and generate permanent, downloadable QR codes.
- **User Management**: Monitor staff accounts and restrict access for specific users.
- **Institutional Security**: Strict `@neu.edu.ph` domain enforcement via Firebase Authentication and Security Rules.

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (Google & Email/Password)
- **AI**: Genkit with Google AI (Gemini)
- **Icons**: Lucide React
- **QR Generation**: `qrcode.react`
- **QR Scanning**: `@yudiel/react-qr-scanner`

## 📁 Project Structure

- `src/app`: Next.js pages and layouts.
    - `/admin`: Administrative portal.
    - `/dashboard`: Professor check-in portal.
    - `/login`: Unified authentication page.
- `src/firebase`: Firebase configuration, providers, and standardized hooks (`useCollection`, `useDoc`).
- `src/ai`: Genkit flow definitions for AI insights.
- `src/components`: Reusable UI components (Shadcn UI).
- `docs/backend.json`: Blueprint for Firestore schema and authentication providers.

## 🔒 Security

Access is strictly controlled via Firestore Security Rules:
- **Domain Lock**: Only accounts with `@neu.edu.ph` emails can read or write to the database.
- **Role-Based Access**: Administrative functions (user blocking, room deletion, global logs) are restricted to verified admins.
- **Ownership**: Professors can only manage their own usage logs.

## 🛠️ Setup

1. **Firebase Project**: Create a project in the Firebase Console.
2. **Authentication**: Enable Google and Email/Password providers.
3. **Firestore**: Provision a Firestore instance in production mode.
4. **Environment**: Ensure `src/firebase/config.ts` contains your web app's configuration.
5. **Admin Setup**: To grant admin access, manually create a document in the `roles_admin` collection with the user's UID or use the `admin@neu.edu.ph` email override.
