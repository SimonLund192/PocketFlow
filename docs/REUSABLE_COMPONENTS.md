# Reusable UI Components

This document describes the reusable components created for PocketFlow AI.

## Components

### 1. Header Component (`/components/Header.tsx`)

A unified header component used across all pages with consistent branding.

**Props:**
- `title` (string, required): Page title
- `subtitle` (string, optional): Subtitle below the title
- `breadcrumb` (string[], optional): Breadcrumb navigation array
- `action` (ReactNode, optional): Custom action element (e.g., dropdowns, buttons)

**Features:**
- PocketFlow AI branding with logo
- Search bar
- Dark mode toggle
- Notification bell with badge
- User avatar
- Flexible action slot for page-specific controls

**Usage:**
```tsx
<Header 
  title="Dashboard" 
  subtitle="Welcome Simon Lund" 
  breadcrumb={["Dashboard"]} 
/>

// With action
<Header 
  title="Budget" 
  subtitle="Welcome Simon Lund" 
  breadcrumb={["Dashboard", "Budget"]}
  action={<select>...</select>}
/>
```

### 2. Tabs Component (`/components/Tabs.tsx`)

A reusable tab navigation component with consistent styling.

**Props:**
- `tabs` (string[], required): Array of tab labels
- `activeTab` (string, required): Currently active tab
- `onTabChange` ((tab: string) => void, required): Callback when tab changes
- `className` (string, optional): Additional CSS classes

**Features:**
- Consistent indigo accent color
- Hover states
- Active indicator line
- Automatic spacing

**Usage:**
```tsx
const [activeTab, setActiveTab] = useState("Analytics");
const tabs = ["Analytics", "Expenses", "Income"];

<Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
```

### 3. KPICard Component (`/components/KPICard.tsx`)

A card component for displaying key performance indicators.

**Props:**
- `title` (string, required): KPI label (uppercase)
- `value` (string | number, required): Main metric value
- `change` (string, optional): Description or change indicator
- `isPositive` (boolean, optional): Color coding for change (green/red/gray)

**Features:**
- Consistent card styling
- Automatic color coding based on sentiment
- Responsive text sizes

**Usage:**
```tsx
<KPICard 
  title="Daily Average" 
  value="$68.00" 
  change="Avg spend per day (last 30 days)" 
/>

<KPICard 
  title="Change" 
  value="+12%" 
  change="Compared to previous 30 days" 
  isPositive={true}
/>
```

### 4. StatCard Component (`/components/StatCard.tsx`)

Similar to KPICard but with trend icons (existing component, documented for completeness).

**Props:**
- `title` (string): Stat label
- `value` (string): Main value
- `change` (string, optional): Change indicator
- `changeValue` (string, optional): Additional context
- `isPositive` (boolean, optional): Trend direction

**Features:**
- Trend icons (up/down arrows)
- Consistent with KPICard styling

## Pages Updated

All pages now use these reusable components:

1. **Dashboard** (`/app/page.tsx`)
   - Uses: Header, StatCard

2. **Budget** (`/app/budget/page.tsx`)
   - Uses: Header (with month selector action)
   - Note: Has custom StatCard inline (could be refactored)

3. **Goals** (`/app/goals/page.tsx`)
   - Uses: Header

4. **Analytics** (`/app/analytics/page.tsx`)
   - Uses: Header, Tabs, KPICard

5. **Account** (`/app/account/page.tsx`)
   - Uses: Header, Tabs

6. **Database** (`/app/database/page.tsx`)
   - Uses: Header, Tabs

## Benefits

1. **Consistency**: All pages have identical header styling and branding
2. **Maintainability**: Changes to header/tabs only need to be made in one place
3. **Reusability**: Easy to add new pages with consistent UI
4. **Flexibility**: Header action prop allows page-specific controls
5. **Clean Code**: Reduced duplication across page components

## Future Improvements

Consider creating additional reusable components for:
- Form inputs with consistent styling
- Button variants
- Modal/dialog components
- Data table component (for Database page)
- Progress indicators (for Goals page)
- Category icon selector
