# Application Redesign Plan: Dark & Stylistic Theme with Sidebar Layout

## Overview
Transform the D3 React Showcase application from its current light, conventional styling to a modern, dark, and stylistic design while maintaining shadcn components. Additionally, restructure visualization pages to use full-width layouts with sidebar controls.

## Current State Analysis

### Theme & Styling
- **Current theme**: Light mode by default with basic dark mode support
- **Color palette**: Standard blue/grey palette (boring as noted)
- **CSS variables**: Already set up for theming in `globals.css`
- **Theme provider**: Using `next-themes` with ThemeProvider

### Layout Structure
- **Visualization pages**: Currently use container-based layouts with varying widths
- **Controls**: Embedded inline with content (e.g., bump-chart has view mode buttons above the chart)
- **Examples**:
  - `bump-chart/page.tsx`: Container with `mx-auto p-8`, controls inline
  - `heatmap/page.tsx`: Max-width container with inline controls
  - All pages share the same SiteHeader and SiteFooter

### Pages to Redesign
1. `/app/bump-chart/page.tsx` - Technology trends bump chart
2. `/app/animated-choropleth/page.tsx` - Animated map
3. `/app/scatterplot-matrix/page.tsx` - Scatterplot matrix
4. `/app/lineage-explorer/page.tsx` - Greek mythology explorer
5. `/app/heatmap/page.tsx` - Temperature anomaly heatmap

## Design Goals

### 1. Dark & Stylistic Theme
- **Primary approach**: Create a sophisticated dark theme as the default
- **Color scheme**:
  - Deep blacks/dark grays for backgrounds
  - Vibrant accent colors for interactive elements
  - High contrast for data visualizations
  - Subtle gradients and glows for depth
- **Visual style**:
  - Modern glassmorphism effects where appropriate
  - Smooth shadows and subtle borders
  - Rich, saturated accent colors
  - Professional yet distinctive

### 2. Sidebar Layout for Visualizations
- **Layout structure**:
  - Full-width visualization area (main content)
  - Fixed or collapsible sidebar for controls
  - Responsive design for mobile (sidebar becomes drawer/sheet)
- **Sidebar contents**:
  - All interactive controls (switches, buttons, sliders)
  - Configuration options
  - Data information panels
  - Export/download buttons

## Implementation Plan

### Phase 1: Theme Redesign

#### 1.1 Update Color System (`globals.css`)
**File**: `src/app/globals.css`

**Changes**:
- Redesign dark mode color variables with modern, vibrant palette
- Create new accent colors for highlights and interactive elements
- Add gradient variables for stylistic effects
- Set dark mode as default in ThemeProvider
- Consider adding:
  - `--accent-vibrant`: For highlights (cyan/purple)
  - `--glass-bg`: For glassmorphism effects
  - `--glow`: For subtle glows on hover
  - Richer chart colors

**Example dark palette**:
```css
.dark {
  --background: 222 47% 5%;           /* Deep dark background */
  --foreground: 210 40% 98%;          /* Crisp white text */
  --primary: 217 91% 60%;             /* Vibrant blue */
  --accent: 280 85% 65%;              /* Purple accent */
  --accent-vibrant: 180 100% 50%;     /* Cyan highlights */
  --muted: 217 33% 17%;               /* Dark muted */
  --border: 217 33% 17%;              /* Subtle borders */
  /* Add custom variables for gradients, glows, etc. */
}
```

#### 1.2 Update Theme Provider Default
**File**: `src/app/layout.tsx`

**Changes**:
- Change `defaultTheme` from "light" to "dark"
- Consider setting `disableTransitionOnChange` to false for smooth transitions

#### 1.3 Enhance Tailwind Configuration
**File**: `tailwind.config.ts`

**Changes**:
- Add custom utilities for glassmorphism
- Add gradient utilities
- Extend with custom animations (if needed)
- Add custom color tokens beyond shadcn defaults

### Phase 2: Shared Layout Components

#### 2.1 Create Visualization Layout Component
**New file**: `src/components/layouts/VisualizationLayout.tsx`

**Purpose**: Reusable layout wrapper for all visualization pages

**Features**:
- Full-width main area for chart
- Collapsible sidebar for controls
- Responsive (mobile uses sheet/drawer)
- Props:
  - `title`: Page title
  - `description`: Page description
  - `sidebarContent`: React node for controls
  - `children`: Visualization component
  - `sidebarPosition?: 'left' | 'right'`: Default right
  - `sidebarDefaultOpen?: boolean`: Default true

**Structure**:
```tsx
<div className="flex h-full">
  {/* Sidebar - fixed width, scrollable */}
  <aside className="w-80 border-r bg-card/50 backdrop-blur">
    {/* Controls here */}
  </aside>

  {/* Main visualization area - flex-1 */}
  <main className="flex-1 overflow-auto">
    {/* Chart here */}
  </main>
</div>
```

#### 2.2 Create Sidebar Control Panel Component
**New file**: `src/components/layouts/ControlPanel.tsx`

**Purpose**: Styled container for sidebar sections

**Features**:
- Sections with headers
- Collapsible sections (accordion)
- Consistent spacing and styling
- Glassmorphic background

### Phase 3: Update Visualization Pages

For each visualization page, refactor to use the new layout:

#### 3.1 Bump Chart Page
**File**: `src/app/bump-chart/page.tsx`

**Changes**:
- Wrap in VisualizationLayout
- Move controls to sidebar:
  - View mode buttons (Rank Changes / Adoption %)
  - Category tabs → sidebar sections
  - Dataset information cards → sidebar bottom
- Keep chart full-width in main area
- Remove container constraints

**Before**: Container with inline controls
**After**: Full-width chart + right sidebar with all controls

#### 3.2 Heatmap Page
**File**: `src/app/heatmap/page.tsx`

**Changes**:
- Wrap in VisualizationLayout
- Move to sidebar:
  - Enable Brushing switch
  - Description text
  - Export CSV button (when data selected)
  - Selected data table (when brushed)
- Full-width heatmap in main area

#### 3.3 Animated Choropleth Page
**File**: `src/app/animated-choropleth/page.tsx`

**Changes**:
- Wrap in VisualizationLayout
- Move to sidebar:
  - Color scale selector
  - Age group controls
  - Play/pause controls (if animated)
  - Map legend and info
- Full-width map in main area

#### 3.4 Scatterplot Matrix Page
**File**: `src/app/scatterplot-matrix/page.tsx`

**Changes**:
- Wrap in VisualizationLayout
- Move to sidebar:
  - Measure selection
  - Brush controls
  - Data filters
- Full-width matrix in main area

#### 3.5 Lineage Explorer Page
**File**: `src/app/lineage-explorer/page.tsx`

**Changes**:
- Wrap in VisualizationLayout
- Move to sidebar:
  - Navigation controls
  - Entity information
  - Search/filter
- Full-width explorer in main area

### Phase 4: Visual Enhancements

#### 4.1 Update D3 Visualizations
**Files**: All components in `src/components/d3/`

**Changes**:
- Update color scales to match new dark theme
- Ensure good contrast on dark backgrounds
- Use new accent colors for highlights
- Update hover states with new glow effects
- Adjust text colors for readability

#### 4.2 Enhance UI Components
**Files**: `src/components/ui/*`

**Changes** (if needed):
- Add glassmorphic variants to Card, Button
- Enhance hover/focus states with glows
- Ensure all components look good in dark theme

#### 4.3 Update Home Page
**File**: `src/app/page.tsx`

**Changes**:
- Enhance card styling with new theme
- Add visual flair (gradients, subtle animations)
- Update button styles
- Keep current structure but apply new styling

### Phase 5: Responsive & Polish

#### 5.1 Mobile Responsiveness
- Sidebar becomes Sheet/Drawer on mobile (< 768px)
- Use shadcn Sheet component
- Add hamburger/control button to open sidebar
- Ensure visualizations scale properly

#### 5.2 Accessibility
- Ensure sufficient contrast ratios
- Keyboard navigation for sidebar toggle
- ARIA labels for controls
- Focus indicators visible

#### 5.3 Performance
- Lazy load sidebar content if heavy
- Optimize re-renders when toggling sidebar
- Ensure D3 transitions remain smooth

## File Structure

### New Files
```
src/
├── components/
│   ├── layouts/
│   │   ├── VisualizationLayout.tsx       # Main layout wrapper
│   │   └── ControlPanel.tsx              # Sidebar section component
│   └── ui/
│       └── sidebar.tsx                   # Sidebar primitives (if needed)
```

### Modified Files
```
src/
├── app/
│   ├── globals.css                       # Theme colors
│   ├── layout.tsx                        # Default theme
│   ├── page.tsx                          # Home page styling
│   ├── bump-chart/page.tsx              # Refactor to new layout
│   ├── heatmap/page.tsx                 # Refactor to new layout
│   ├── animated-choropleth/page.tsx     # Refactor to new layout
│   ├── scatterplot-matrix/page.tsx      # Refactor to new layout
│   └── lineage-explorer/page.tsx        # Refactor to new layout
├── components/
│   └── d3/                              # Color/style updates for all charts
└── tailwind.config.ts                    # Extended utilities
```

## Implementation Order

1. **Start with theme** - Update globals.css and layout.tsx
2. **Create layout components** - Build VisualizationLayout and ControlPanel
3. **Refactor one page as prototype** - Start with bump-chart as it has good examples of controls
4. **Apply to remaining pages** - Replicate pattern across all visualization pages
5. **Update D3 charts** - Adjust colors and styles for dark theme
6. **Polish and test** - Responsive, accessibility, visual refinements

## Success Criteria

- [x] Dark mode is default with sophisticated color palette
- [x] All visualization pages use full-width layout with sidebar
- [x] Sidebar contains all controls and information panels
- [x] Layout is responsive (sidebar → drawer on mobile)
- [x] Charts are clearly visible with good contrast
- [x] Visual style is modern and distinctive (not boring)
- [x] Maintains usability and accessibility
- [x] No regressions in functionality

## Design Decisions to Confirm

Before implementation, clarify:

1. **Sidebar position**: Right side (standard for controls) or left side?
2. **Sidebar behavior**:
   - Always visible on desktop?
   - Collapsible/toggleable?
   - Resizable?
3. **Color palette**:
   - Purple/blue accent theme?
   - Cyan/magenta for highlights?
   - Or specific brand colors?
4. **Visual effects**:
   - Glassmorphism on sidebar?
   - Glow effects on interactive elements?
   - Subtle animations/transitions?
5. **Mobile breakpoint**: 768px (md) or 1024px (lg)?

## Risks & Considerations

- **D3 chart readability**: Dark backgrounds may require significant color adjustments
- **Contrast ratios**: Must maintain accessibility standards
- **Layout shifts**: Ensure smooth transitions when toggling sidebar
- **Data density**: Sidebar space is limited, may need scrolling or tabs
- **Existing users**: Sudden dark theme might be jarring (keep light mode available)

## Next Steps

1. Review and approve this plan
2. Confirm design decisions above
3. Begin implementation with Phase 1 (theme)
4. Create prototype with one page
5. Iterate based on feedback
