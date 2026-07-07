# TsukiNest — Project Structure

> Next.js 15 App Router | React 19 | TypeScript | Tailwind v4 | Firebase | Framer Motion

---

## Directory Overview

> **Update (Pass 2 — structure reorganization):** routes are now grouped with
> Next.js Route Groups (`(name)` folders). Route groups are purely
> organizational — they do **not** appear in the URL. `app/(content)/library`
> still serves `/library`, exactly as before.

```
tsukinest-refactored/
├── app/
│   ├── layout.tsx                # Root layout (fonts, providers, bottom nav)
│   ├── page.tsx                  # Home page → "/"
│   ├── loading.tsx               # Global loading UI
│   ├── error.tsx                 # Global error boundary UI
│   ├── globals.css               # Tailwind base + custom CSS variables
│   ├── favicon.ico
│   ├── robots.ts                 # Robots directives
│   ├── sitemap.ts                # XML sitemap
│   │
│   ├── (marketing)/               # Static / informational pages
│   │   ├── about/page.tsx
│   │   ├── contact/page.tsx
│   │   ├── disclaimer/page.tsx
│   │   ├── dmca/page.tsx
│   │   ├── privacy/page.tsx
│   │   ├── terms/page.tsx
│   │   └── blog/
│   │       ├── page.tsx
│   │       └── [slug]/page.tsx
│   │
│   ├── (auth)/                    # Auth-flow pages
│   │   └── reset-password/page.tsx
│   │
│   └── (content)/                 # Core manga browsing & reading experience
│       ├── all/page.tsx
│       ├── latest/page.tsx
│       ├── popular/page.tsx        + loading.tsx
│       ├── explore/page.tsx        + loading.tsx
│       ├── search/page.tsx         + loading.tsx
│       ├── genre/[genre]/page.tsx   + loading.tsx
│       ├── detail/[slug]/page.tsx   + loading.tsx
│       ├── read/[slug]/page.tsx     + loading.tsx
│       ├── library/page.tsx        + loading.tsx
│       └── profile/page.tsx        + loading.tsx
│
├── components/                   # Shared React components
│   ├── ui/                       # Generic, content-agnostic primitives
│   │   ├── SmartImage.tsx        # Image with AniList fallback
│   │   ├── SkeletonCard.tsx      # Skeleton loading cards
│   │   ├── ErrorState.tsx        # Reusable error display
│   │   ├── FadeIn.tsx            # Fade-in animation wrapper
│   │   └── ScrollToTop.tsx       # FAB scroll-to-top button
│   ├── layout/                   # App shell / chrome (moved out of components/ root)
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── FooterWrapper.tsx     # Hides Footer outside "/"
│   │   ├── BottomNav.tsx
│   │   └── InstallPrompt.tsx     # PWA install popup
│   ├── manga/                    # Domain-specific components
│   │   ├── MangaCard.tsx         # Generic manga card
│   │   ├── SectionHeader.tsx     # Section title + action
│   │   └── HeroCarousel.tsx      # Auto-sliding hero carousel
│   └── reader/                   # Reserved — see note below
│       └── README.md
│
├── constants/
│   └── api.ts                    # API_BASE_URL (single source of truth)
│
├── hooks/                        # Custom React hooks
│   ├── useOnlineStatus.ts        # navigator.onLine status
│   ├── usePullToRefresh.ts       # Touch pull-to-refresh
│   ├── useClickOutside.ts        # Click-outside detector
│   ├── useScrollAnimation.ts     # Scroll-based visibility
│   └── useLocalStorage.ts        # Type-safe localStorage state
│
├── lib/                          # Core libraries
│   ├── api.ts                    # API client (fetch + ISR caching)
│   ├── firebase.ts               # Firebase app + auth + firestore
│   └── accent.ts                 # Accent color theming system
│
├── services/
│   └── manga.ts                  # High-level manga service layer
│
├── types/
│   └── manga.ts                  # MangaItem, ChapterItem interfaces
│
├── utils/                        # Pure utility functions
│   ├── cn.ts                     # className merger (clsx-lite)
│   ├── image.ts                  # Image URL cleaners + proxy
│   └── manga.ts                  # formatMangaType, transformBasicItem
│
├── public/                       # Static assets
│   ├── no-image.png
│   └── no-avatar.png
│
├── package.json
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs             # Tailwind v4 is CSS-config only — no tailwind.config.ts
└── eslint.config.mjs
```

> Note: earlier drafts of this doc referenced `tailwind.config.ts` and
> `.env.local.example` — neither exists in the repo. Tailwind v4 is
> configured via `@import "tailwindcss"` in `globals.css`, not a JS config
> file. Required env vars are listed further down; create your own
> `.env.local` (git-ignored) with those keys.

### Route group rules — where does a new page go?

| Group | Use for | Example |
|---|---|---|
| `(marketing)` | Static/legal/informational pages, no data fetching from the manga API | `/faq`, `/careers` |
| `(auth)` | Sign-in, sign-up, password flows | `/login`, `/verify-email` |
| `(content)` | Anything that lists, filters, or reads manga; anything behind a Firebase user session | `/bookmarks`, `/history` |
| *(none — app root)* | Root-only special files (`layout.tsx`, `page.tsx`, `sitemap.ts`, `robots.ts`, `loading.tsx`, `error.tsx`) | — |

Route groups (`(name)`) are stripped from the URL by Next.js — moving a page
into a group never changes what path it serves. Don't nest a page in more
than one group, and don't give two groups a route with the same segment name
(e.g. two `.../settings/page.tsx`) — Next.js will throw a route conflict at
build time.

### `components/reader/` — reserved, not yet populated

`app/(content)/read/[slug]/page.tsx` is currently a single ~1,030-line file
(reader UI, chapter navigation, progress tracking, comments all inline).
`components/reader/` exists as the intended home for that page's
sub-components once it's broken up (e.g. `ReaderToolbar`, `ChapterNav`,
`PageViewer`). That extraction touches reader business logic, not just file
layout, so it wasn't done in this pass — see the Recommendations section in
`AI_REFACTOR_REPORT.md`.

---

## Key Files

### Source of Truth

| Concern | File |
|---|---|
| API base URL | `constants/api.ts` → `API_BASE_URL` |
| MangaItem type | `types/manga.ts` |
| API fetcher | `lib/api.ts` |
| Firebase setup | `lib/firebase.ts` |
| Accent themes | `lib/accent.ts` |
| Image utilities | `utils/image.ts` |

### Component Hierarchy

```
layout.tsx
└── BottomNav (navigation)
└── AccentProvider (theme)
    └── page.tsx (routes)
        ├── Header
        ├── HeroCarousel ← components/manga/HeroCarousel.tsx
        ├── MangaCard    ← components/manga/MangaCard.tsx
        ├── SmartImage   ← components/ui/SmartImage.tsx
        └── SectionHeader ← components/manga/SectionHeader.tsx
```

---

## Data Flow

```
Browser → Next.js App Router
         → lib/api.ts (fetch with ISR revalidate: 60)
         → https://nest-network.up.railway.app (external API)
         → transformItem() → MangaItem
         → React state → UI components
```

```
Auth:
Firebase Auth ← lib/firebase.ts
Firestore     ← lib/firebase.ts
             → Library, Profile, Notifications, Comments
```

---

## Environment Variables

```env
# Firebase (required)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# API (set in constants/api.ts, override here if needed)
NEXT_PUBLIC_API_BASE_URL=https://nest-network.up.railway.app
```

---

## Development

```bash
# Install
npm install

# Run dev server
npm run dev

# Build
npm run build

# Type check
npx tsc --noEmit
```

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Runtime | React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Auth + DB | Firebase (Auth + Firestore) |
| Icons | Lucide React |
| Animation | Framer Motion |
| Image | Next.js Image + AniList fallback |
| Deploy | Vercel (recommended) |

---

## Architecture Decisions

1. **App Router only** — No Pages Router. All routes are in `app/`.

2. **ISR caching** — API fetches use `next: { revalidate: 60 }` (1 minute), not `cache: "no-store"`. This reduces API calls while keeping manga chapters reasonably fresh.

3. **SmartImage** — Custom image component that falls back to AniList GraphQL API when the primary image fails. This handles broken CDN images from the manga API.

4. **Module-level caching** — `globalCache` in home page uses a module-level variable for in-memory caching between client-side navigations. This is intentional and safe in Next.js client components.

5. **Firebase on client only** — All Firebase calls are in Client Components (`"use client"`). No server-side Firebase calls to avoid credential exposure.

6. **Accent system** — The `useAccent()` hook provides theme colors. Each color exports `bg`, `text`, `border`, `soft`, `focusRing`, `glow` class strings for consistent theming.

7. **Route groups over a flat `app/`** — `(marketing)`, `(auth)`, `(content)` group pages by concern instead of leaving ~19 route folders flat under `app/`. Zero effect on URLs; the only reason this was safe to do mechanically is that every page in this project imports via the `@/*` root alias, never a relative path — so nesting a page one level deeper never breaks its imports.
