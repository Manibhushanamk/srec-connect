# Design.md — Visual Identity & Design System

> **Aesthetic Philosophy:** Familiar, polished blend of Instagram's modern social dynamics and LinkedIn's academic credibility.  
> **Brand Identity:** Santhiram Engineering College (SREC) — CSE (Artificial Intelligence & Machine Learning).  
> **Theme Support:** Dynamic Light, Dark, and System theme with instant persistence.

---

## 1. Visual Theme & Personality

- **Design Tone:** Scholarly, sleek, trustworthy, modern, and uncluttered.
- **Visual References:**
  - *Instagram Inspiration:* Feed card hierarchy, story/highlight avatar circles, clean icon buttons, post image carousels, mobile bottom navigation bar.
  - *LinkedIn Inspiration:* Professional profile banners, credential verification badges, categorized skills, publication cards, structured activity timeline.
- **Zero AI-Slop Guarantee:**
  - No bloated 3D gradient cards with blurry dropshadows.
  - Crisp 1px borders (`border-border`), subtle elevations, tactile interaction feedback (`active:scale-[0.98]`).
  - Standardized Lucide icons with uniform 20px / 16px bounding boxes. No emojis used as primary UI navigation.

---

## 2. Color Tokens & Semantic Theme Palette

Implemented via Tailwind CSS variables in `globals.css`:

| Token | Light Theme (`:root`) | Dark Theme (`.dark`) | UI Purpose |
|---|---|---|---|
| `--background` | `hsl(0, 0%, 100%)` (#FFFFFF) | `hsl(224, 71%, 4%)` (#020617) | App background canvas |
| `--foreground` | `hsl(222.2, 84%, 4.9%)` (#020817) | `hsl(210, 40%, 98%)` (#F8FAFC) | Primary text and headings |
| `--card` | `hsl(0, 0%, 100%)` (#FFFFFF) | `hsl(222.2, 84%, 6.5%)` (#090D1A)| Cards, feed items, dialog containers |
| `--card-foreground`| `hsl(222.2, 84%, 4.9%)` (#020817) | `hsl(210, 40%, 98%)` (#F8FAFC) | Card titles and body |
| `--primary` | `hsl(221.2, 83.2%, 53.3%)` (#2563EB)| `hsl(217.2, 91.2%, 59.8%)` (#3B82F6)| SREC Royal Blue — Primary buttons, badges |
| `--primary-foreground`| `hsl(210, 40%, 98%)` (#FFFFFF) | `hsl(222.2, 47.4%, 11.2%)` (#0F172A)| Text on primary buttons |
| `--secondary` | `hsl(210, 40%, 96.1%)` (#F1F5F9) | `hsl(217.2, 32.6%, 17.5%)` (#1E293B)| Secondary action pills, tags |
| `--muted` | `hsl(210, 40%, 96.1%)` (#F1F5F9) | `hsl(217.2, 32.6%, 17.5%)` (#1E293B)| Muted sections, tab tracks |
| `--muted-foreground` | `hsl(215.4, 16.3%, 46.9%)` (#64748B)| `hsl(215, 20.2%, 65.1%)` (#94A3B8)| Timestamps, captions, metadata |
| `--accent` | `hsl(210, 40%, 96.1%)` (#F1F5F9) | `hsl(217.2, 32.6%, 17.5%)` (#1E293B)| Hover backgrounds, active highlights |
| `--destructive` | `hsl(0, 84.2%, 60.2%)` (#EF4444) | `hsl(0, 62.8%, 30.6%)` (#7F1D1D)| Incident flags, deletions, warnings |
| `--border` | `hsl(214.3, 31.8%, 91.4%)` (#E2E8F0)| `hsl(217.2, 32.6%, 17.5%)` (#1E293B)| Subtle dividers and boundaries |
| `--verified-badge` | `hsl(221.2, 83.2%, 53.3%)` (#2563EB)| `hsl(217.2, 91.2%, 59.8%)` (#3B82F6)| Official verified checkmark badge |

---

## 3. Typography Hierarchy

Primary font stack: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.

- **Page / Hero Titles (`h1`):** `text-2xl font-bold tracking-tight md:text-3xl`
- **Section Headers (`h2`):** `text-lg font-semibold tracking-tight md:text-xl`
- **Component Subheadings (`h3`):** `text-base font-medium`
- **Body Text:** `text-sm leading-relaxed text-foreground`
- **Captions & Metadata:** `text-xs font-normal text-muted-foreground`
- **Badges & Roll Numbers:** `text-xs font-mono font-medium tracking-wide uppercase`

---

## 4. Layout Architecture & Responsive Breakpoints

### 4.1 Mobile-First Navigation Pattern (< 768px)
- **Top Header:** College/App Logo, Department Tag (`CSE - AIML`), Notifications Icon (with badge counter), and Theme Toggle.
- **Main Viewport:** Single-column feed or profile view with max-w-lg centered layout.
- **Fixed Bottom Navigation:** 5 core tabs:
  1. `Home / Feed` (Home icon)
  2. `Events` (Calendar icon)
  3. `Create Post / Submit` (+ icon in rounded pill)
  4. `Achievements` (Award icon)
  5. `Profile` (User avatar / User icon)

### 4.2 Desktop Navigation Pattern (>= 768px)
- **Left Sidebar:** Pinned navigation menu with role-aware administrative items (`Discipline`, `Verification Queue`, `Bulk Import`).
- **Main Feed / Content Column:** Centered `max-w-2xl` reading stream with optimal line length.
- **Right Context Rail (>= 1024px):** Quick Department Notices, Upcoming Events widget, and Faculty Highlights.

---

## 5. Component Specifications & Micro-Interactions

### 5.1 Feed Card
- **Header:** Author avatar, full name, role badge (`Student [3rd Year]` or `Faculty [AIML]`), timestamp, context menu.
- **Content:** Clean typography with hashtag highlighting (`#hackathon`, `#paper`).
- **Media:** 1 or 2 images rendered in an adaptive responsive grid with rounded corners (`rounded-xl overflow-hidden`).
- **Footer:** Action bar with Like (heart with scale pop), Comment (message bubble), Bookmark, and Share button.

### 5.2 Verification Badges
- **Verified Official Achievement:** Royal blue badge with SVG checkmark icon + tooltip stating "Verified by Faculty on [Date]".
- **Self-Reported / Pending Item:** Subtle amber pill with "Under Review".
- **Rule:** Unverified items NEVER display the verified badge under any circumstances.

### 5.3 Loading & Empty States
- Skeletons with subtle shimmer (`animate-pulse bg-muted rounded`) matching the exact geometry of feed cards and profile banners.
- Empty states featuring contextual Lucide icons, helpful explanatory copy, and a clear call-to-action button.
