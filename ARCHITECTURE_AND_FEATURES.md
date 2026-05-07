# Travel Bliss Kashmir - Architecture & Features Detail

This document outlines the complete feature set, data flow, and background connections of the Travel Bliss Kashmir CRM, serving as a technical follow-up to the Master Prompt.

## 1. System Architecture & Background Connections

The current application is built as a highly responsive **Client-Side Single Page Application (SPA)** using React 19, TypeScript, and Vite. 

### Data Flow & Storage
* **Current State:** The application currently relies on a centralized mock data layer (`constants.ts` and `types.ts`). Data structures (Trips, Leads, Hotels, etc.) are strictly typed and loaded securely into React's state management via hooks (e.g., `useState`, `useEffect`, `useMemo`). 
* **Persistence:** Operations occur in memory for rapid UI response. *Note: As this is an MVP/Frontend build, modifying a trip or adding a hotel will reflect in the UI temporarily but reset on a hard page refresh until a backend database (like Firebase or PostgreSQL) is attached.*

### Background External Connections
* **Google Gemini AI (`@google/genai`):**
  * **How it works:** The app connects to Google's Gemini Models via the `geminiService.ts` file. It reads the API key securely injected via environment variables (`process.env.GEMINI_API_KEY`).
  * **Triggers:** When a user clicks "AI Enhance" in the Trip Builder, the app packages the selected Day Title, Activities, and Trip Type into an engineered prompt. It sends this payload to the model (`gemini-3-flash-preview` or similar) asynchronously, and awaits the rich, poetic itinerary text to inject straight into the client notes text box.
* **PDF Export Engine (`html2pdf.js`):**
  * **How it works:** Included globally via `index.html`. When a user requests a PDF download, the app generates a hidden, fully styled HTML structure (the "render zone") populated with the trip's data. `html2pdf` captures this hidden HTML, converts it to a high-resolution canvas using `html2canvas`, and encapsulates it into a downloadable PDF document without disrupting the user's screen.

---

## 2. Feature Breakdown & Mechanics

### Trip Builder & Reactive Costing Engine
* **Mechanics:** The heart of the application (`/pages/TripBuilder.tsx`). Uses React's `useMemo` hook to calculate costs instantly.
* **How it works:** As the user selects a Hotel or Vehicle for a specific day, or changes the Margin percentage, the Costing Engine automatically parses the entire itinerary array. It looks up the base costs in the Master Database (`constants.ts`) and dynamically outputs the Total Cost, Profit, and Selling Price.

### Version History System
* **Mechanics:** Snapshot-based version control inside the Trip object.
* **How it works:** Every time an agent clicks "Save Changes" in the Trip Builder, the application takes a deep clone (`JSON.parse(JSON.stringify)`) of the current itinerary state, timestamps it, and pushes it to a `versions` array. Users can open the History sidebar and restore the application state to any previous timestamp.

### Client PDF & Print View
* **Mechanics:** Dedicated layout route (`/trips/:id/print`) and CSS `@media print` rules.
* **How it works:** Strips away all CRM navigation, sidebars, internal notes, and costings. It applies the Travel Bliss Kashmir branding (colors, logo, fonts) and relies on CSS print rules to ensure page breaks do not awkwardly cut days in half. 

### Authentication & Access Control
* **Mechanics:** Firebase Authentication & React Router `ProtectedRoute`.
* **How it works:** Real sign-in and sign-out are managed via Google's Firebase Auth backend. The `AuthContext` listens for `onAuthStateChanged` to maintain the user's secure session. We intercept unauthenticated users with a `ProtectedRoute` wrapper component and redirect them to the `/login` screen.

### Master Database Management
* **Mechanics:** CRUD (Create, Read, Update, Delete) interfaces for travel components.
* **How it works:** Pages like `/hotels`, `/vehicles`, and `/activities` provide list and card views mapped over our core arrays. This ensures the Itinerary Builder dropdowns are always populated with validated, up-to-date options, preventing typos and incorrect basic costing.

### Lead Pipeline
* **Mechanics:** State-driven Kanban and List views.
* **How it works:** Tracks potential clients through varied statuses (Lead, Quoted, Booked). Integrating with `messagingService.ts`, it allows agents to generate quick WhatsApp template messages with dynamic variables automatically filled in (e.g., Client Name, Destination).

---

## 3. Future Expansion Readiness
The application is architected cleanly with separation of concerns:
* **UI Components** (`Layout.tsx`, standard inputs) are decoupled from business logic.
* **Types** (`types.ts`) define Strict Data Models. Switching to a real database will simply involve replacing the `MOCK_TRIPS` constant imports in the `useEffect` hooks with standard API `fetch()` or Firebase `getDocs()` calls.
