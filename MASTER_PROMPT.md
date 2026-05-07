# Travel Bliss Kashmir - Master Project Prompt

Build a comprehensive, web-based internal software CRM for a luxury travel agency called **Travel Bliss Kashmir** to create, manage, cost, and share client itineraries.

## 🎯 Goal
Create a responsive React application for the Travel Bliss Kashmir team to:
- Capture and manage leads and pipelines
- Create complex client trips and day-wise itineraries
- Auto-calculate trip costing, total margins, and profitability
- Generate branded, print-ready PDF itineraries for clients
- Utilize internal databases for reuse of Hotels, Vehicles, and Activities
- Leverage AI (Google Gemini) to auto-generate beautiful itinerary descriptions

## 🧩 Core Modules

### 1. Dashboard & Pipeline Management
- High-level overview of active trips, lead conversions, and recent revenue.
- Kanban-style pipeline tracking leads from "New" to "Quote Sent" to "Converted".

### 2. Client & Trip Management
- Create new client trips capturing: Client Name, Phone, Email, Source, Trip Name, Trip Type (Honeymoon, Family, Group, Corporate), Pax, Budget Range, Salesperson, and Status.

### 3. Itinerary Builder (Main Feature)
- Dedicated day-wise drag-and-drop editable builder.
- For each day, allow the operator to specify:
  - Day Title
  - Accommodation (select from verified Hotels DB)
  - Transport (select from Vehicles DB)
  - Activities (multi-select from Activities DB)
  - Client-facing description (with AI Magic generation)
  - Internal operational notes (hidden from the client)
- Include Version History to track modifications and jump back to older iterations.

### 4. Internal Databases (Master Data)
- **Hotels**: Name, Location (Srinagar, Gulmarg, Pahalgam, etc.), Category (Budget/Deluxe/Luxury/Houseboat), Rate Per Night, Contact details.
- **Vehicles**: Type (Sedan, Innova, Tempo), Capacity, Rate Per Day.
- **Activities**: Name, Cost per pax, Description.
- **Add-ons**: Fixed-cost or per-pax items (Candlelight dinner, Bonfire, Photography).

### 5. Real-Time Costing Engine
- Automatically calculate in a sticky side-panel:
  - Hotel cost = nights × room rate
  - Vehicle cost = days × daily rate
  - Activities = pax × per person cost
  - Add-ons = fixed or calculated per pax
- Apply dynamic Profit Margin percentages.
- Show live Selling Price, Cost Price, and net Profit.

### 6. Client-Facing Output (Print & PDF)
- Generate a beautifully formatted, branded itinerary explicitly made for high-end clients.
- Includes: Brand Logo, agency details, elegant day-by-day plan, hotel/transport highlights.
- Clear breakdown of 'Inclusions' and 'Exclusions'.
- Built-in "One-Click PDF/Print" integration stripping out all internal operational notes, pricing details, and CRM navigation menus.

### 7. AI Assistant Integration (Gemini)
- "Magic Enhance" buttons throughout the Itinerary Builder where Gemini analyzes the selected day's activities and auto-writes a poetic, high-end travel description for the client.

## 🧱 Technical Architecture
- Frontend Framework: React 18+ & Vite
- Styling: Tailwind CSS & Lucide Icons for clean UI
- Routing: React Router DOM (HashRouter)
- File Structure: Modular components, dedicated pages for each view, and a centralized `constants.ts` / `types.ts` for unified state structure.
- PDF Generation: html2pdf.js / window.print CSS media queries.

## 🎨 UI/UX Guidelines
- Professional, minimalistic, data-dense but readable operational design.
- Sidebar navigation with clear icons.
- Luxury aesthetic for client-facing PDF outputs.
