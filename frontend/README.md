# Yggdrasil Commander - Frontend

Beautiful, sovereign interface for Yggdrasil network management built with Next.js 14, TypeScript, and Tailwind CSS.

## Architecture

```
Next.js 14 (App Router)
    ↓
TypeScript API Client (src/lib/api.ts)
    ↓
Flask Backend (/api/*)
    ↓
Yggdrasil Node
```

## Features

✅ **Zero-Config Wizard**
- First-run modal overlay
- One-click bootstrap with public peers
- Confetti celebration on success
- Manual peer addition option

✅ **Real-Time Dashboard**
- Live status updates (2s polling)
- Connection status hero card
- Peer count and statistics
- Active peer list with traffic stats

✅ **Invite System**
- QR code generation for easy peering
- Copy-to-clipboard functionality
- Base64-encoded images (no file storage)

✅ **Exit Node Management**
- Simple toggle switch
- Optimistic UI updates
- Warning messages for safety
- Real-time status display

✅ **Peer Management**
- Live peer list with statistics
- Uptime tracking
- Traffic monitoring (sent/received)
- Sortable table view

## Design System

### Colors (Sovereign Simplicity)

```typescript
// Background
slate-50: #f8fafc

// Surfaces
white: #ffffff
slate-100: #f1f5f9
slate-200: #e2e8f0

// Text
slate-900: #0f172a (primary)
slate-600: #475569 (secondary)
slate-500: #64748b (tertiary)

// Accent (Active States Only)
emerald-500: #10b981
emerald-600: #059669

// Status
emerald-500: Active/Success
slate-400: Inactive
red-500: Error
```

### Typography

```css
/* Headings */
.heading-1 { @apply text-3xl font-light text-slate-900; }
.heading-2 { @apply text-xl font-medium text-slate-900; }
.heading-3 { @apply text-lg font-medium text-slate-900; }

/* Body */
.body { @apply text-base text-slate-700; }
.body-secondary { @apply text-sm text-slate-600; }

/* Code */
.code { @apply font-mono text-sm text-slate-700; }
```

### Components

**StatusCard** - Status display with animated indicator
```tsx
<StatusCard 
  title="Node Status"
  status="active" // 'active' | 'inactive' | 'error'
  details="Coordinates: [1 2 3]"
/>
```

**Wizard** - First-run onboarding modal
```tsx
<Wizard onComplete={() => window.location.reload()} />
```

**InviteModal** - QR code sharing dialog
```tsx
<InviteModal 
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
/>
```

## Installation

```bash
cd frontend
npm install
```

## Development

```bash
# Start development server
npm run dev
# Visit http://localhost:3000

# Build for production
npm run build

# Lint code
npm run lint
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout with Sidebar
│   │   ├── globals.css         # Global styles + Tailwind
│   │   ├── page.tsx            # Dashboard (/)
│   │   ├── peers/
│   │   │   └── page.tsx        # Peer management
│   │   └── settings/
│   │       └── page.tsx        # Exit node settings
│   │
│   ├── components/             # Reusable components
│   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   ├── StatusCard.tsx      # Status display card
│   │   ├── Wizard.tsx          # First-run wizard
│   │   └── InviteModal.tsx     # Invite QR code modal
│   │
│   └── lib/
│       └── api.ts              # Strongly-typed API client
│
├── public/                     # Static assets
├── next.config.js              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies
```

## API Client Usage

### Importing

```typescript
import { 
  getStatus, 
  getNodeInfo, 
  getPeers, 
  bootstrap,
  type NodeInfo,
  type Peer
} from '@/lib/api';
```

### Fetching Data

```typescript
// Get node information
const nodeInfo = await getNodeInfo();
console.log(nodeInfo.address); // "200:1234::1"

// Get connected peers
const { peers } = await getPeers();
console.log(`Connected to ${peers.length} peers`);

// Bootstrap with public peers
const result = await bootstrap();
console.log(`Added ${result.peers_added.length} peers`);

// Toggle exit node
const exitResult = await setExitNode(true);
console.log(`Exit node enabled: ${exitResult.enabled}`);
```

### Error Handling

```typescript
try {
  const nodeInfo = await getNodeInfo();
  // Use data
} catch (error) {
  if (error instanceof Error) {
    console.error('API Error:', error.message);
  }
}
```

### Polling Hook

```typescript
import { usePolling } from '@/lib/api';

const [data, error, isLoading] = usePolling(
  () => getNodeInfo(),
  2000 // Poll every 2 seconds
);
```

## Components Guide

### Wizard Component

**Purpose**: First-run onboarding experience

**When it appears**: Automatically when `peers.length === 0`

**Features**:
- One-click bootstrap with public peers
- Loading state with spinner
- Confetti celebration on success
- Manual peer addition option (future)

**Usage**:
```tsx
const [showWizard, setShowWizard] = useState(true);

<Wizard onComplete={() => {
  setShowWizard(false);
  window.location.reload();
}} />
```

### InviteModal Component

**Purpose**: Generate and share peering invites

**Features**:
- QR code generation
- Copy-to-clipboard
- Node address display
- Loading and error states

**Usage**:
```tsx
const [showModal, setShowModal] = useState(false);

<button onClick={() => setShowModal(true)}>
  Share Invite
</button>

<InviteModal 
  isOpen={showModal}
  onClose={() => setShowModal(false)}
/>
```

### StatusCard Component

**Purpose**: Display status with animated indicator

**Props**:
```typescript
interface StatusCardProps {
  title: string;
  status: 'active' | 'inactive' | 'error';
  details?: string;
}
```

**Usage**:
```tsx
<StatusCard
  title="Node Status"
  status={isOnline ? 'active' : 'inactive'}
  details="Coordinates: [1 2 3]"
/>
```

## State Management

### Dashboard Page State

```typescript
// Node information
const [nodeInfo, setNodeInfo] = useState<NodeInfo | null>(null);

// Peer list
const [peers, setPeers] = useState<Peer[]>([]);

// UI state
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [showWizard, setShowWizard] = useState(false);
const [showInviteModal, setShowInviteModal] = useState(false);
```

### Settings Page State

```typescript
// Exit node toggle
const [exitNodeEnabled, setExitNodeEnabled] = useState(false);

// Operation state
const [isSaving, setIsSaving] = useState(false);
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState<string | null>(null);
```

## Optimistic UI Updates

The Settings page uses optimistic UI updates for the exit node toggle:

```typescript
const handleExitNodeToggle = async (enabled: boolean) => {
  // Update UI immediately
  setExitNodeEnabled(enabled);
  
  try {
    await setExitNode(enabled);
    // Success - UI already updated
  } catch (error) {
    // Revert on error
    setExitNodeEnabled(!enabled);
    setError('Failed to update');
  }
};
```

## Polling Strategy

All data fetching uses 2-second polling for real-time updates:

```typescript
useEffect(() => {
  let cancelled = false;

  const fetchData = async () => {
    const data = await getNodeInfo();
    if (!cancelled) {
      setNodeInfo(data);
    }
  };

  fetchData(); // Initial fetch
  const interval = setInterval(fetchData, 2000); // Poll

  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}, []);
```

## Animations

### Confetti (Bootstrap Success)

```typescript
import confetti from 'canvas-confetti';

confetti({
  particleCount: 100,
  spread: 70,
  origin: { y: 0.6 },
  colors: ['#10b981', '#059669', '#047857'], // Emerald shades
});
```

### Pulsing Indicators

```tsx
{/* Active status */}
<div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />

{/* Loading spinner */}
<Loader2 className="w-5 h-5 animate-spin" />
```

## Icons

Using **lucide-react** for beautiful, consistent icons:

```typescript
import { 
  Wifi, 
  WifiOff, 
  Users, 
  Share2, 
  UserPlus,
  Shield,
  AlertTriangle,
  Loader2
} from 'lucide-react';
```

## Responsive Design

All components are mobile-responsive using Tailwind's responsive prefixes:

```tsx
{/* Grid: 1 col mobile, 2 cols tablet, 3 cols desktop */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* ... */}
</div>

{/* Hide on mobile, show on desktop */}
<div className="hidden lg:block">
  {/* Desktop-only content */}
</div>
```

## Accessibility

### Keyboard Navigation

All interactive elements are keyboard-accessible:
- Buttons have proper focus states
- Modals trap focus
- ESC key closes modals (TODO)

### Screen Readers

```tsx
{/* Accessible button */}
<button aria-label="Close modal" onClick={onClose}>
  <X className="w-5 h-5" />
</button>

{/* Status indicator */}
<div role="status" aria-live="polite">
  {isLoading ? 'Loading...' : 'Loaded'}
</div>
```

## Performance

### Code Splitting

Next.js automatically splits code by route:
- `/` - Dashboard bundle
- `/peers` - Peers bundle  
- `/settings` - Settings bundle

### Image Optimization

QR codes use base64 data URIs (no separate HTTP requests):

```typescript
<img src="data:image/png;base64,..." alt="QR Code" />
```

## Future Enhancements

- [ ] WebSocket for real-time updates (no polling)
- [ ] Dark mode support
- [ ] Peer search/filter
- [ ] Network topology visualization
- [ ] Bandwidth usage charts
- [ ] Export configuration
- [ ] Multi-language support

## Troubleshooting

### API calls fail with CORS errors

**Solution**: Flask backend has CORS enabled. Check that backend is running.

### Wizard doesn't appear

**Solution**: Check that `peers.length === 0` and Yggdrasil socket is responsive.

### QR code doesn't load

**Solution**: Verify `/api/invite` endpoint returns valid base64 data URI.

### Styles not applying

**Solution**: Run `npm run build` to regenerate Tailwind CSS.

## License

MIT

---

**Vibed with [Shakespeare](https://shakespeare.diy)**
