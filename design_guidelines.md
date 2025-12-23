# Design Guidelines - Sistema de Gestão de Concessionária

## Design Approach

**Hybrid Strategy**: 
- **Public Catalog**: Reference-based approach inspired by automotive marketplaces (CarGurus, Webmotors)
- **Admin Area**: Utility-focused design system (Linear/Notion-inspired) prioritizing data clarity and workflow efficiency

## Core Design Principles

1. **Professional Automotive Aesthetic**: Sophisticated, trustworthy visual language befitting a car dealership
2. **Data Clarity**: Information-dense admin interfaces with excellent readability
3. **Dual Identity**: Distinct but cohesive experiences for public vs. admin areas

## Typography

**Font Stack**:
- **Primary**: Inter (Google Fonts) - Headers, UI elements, data displays
- **Secondary**: System fonts for body text and forms

**Hierarchy**:
- Page Titles: text-4xl to text-5xl, font-bold
- Section Headers: text-2xl to text-3xl, font-semibold
- Card Titles: text-lg to text-xl, font-semibold
- Body Text: text-base, font-normal
- Labels/Metadata: text-sm, font-medium
- Captions: text-xs, text-gray-600

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16** (p-2, m-4, gap-6, space-y-8, py-12, px-16)

**Grid System**:
- Public Catalog: 3-column grid on desktop (lg:grid-cols-3), 2-column tablet (md:grid-cols-2), single-column mobile
- Admin Lists: Full-width tables/cards with consistent internal spacing
- Forms: 2-column layout on desktop (lg:grid-cols-2) for efficiency

**Container Widths**:
- Public pages: max-w-7xl centered
- Admin pages: Full-width with internal max-w-7xl for content
- Forms: max-w-4xl for focused data entry

## Public Catalog Design

**Hero Section**:
- Large hero with automotive imagery (showroom/luxury cars)
- Centered search bar with filters (marca, categoria, preço)
- Height: 70vh for impact without forcing full viewport

**Vehicle Cards**:
- Prominent car image (16:9 aspect ratio)
- Clear pricing display (destaque visual)
- Key specs grid: Ano, Quilometragem, Categoria
- Hover state: Subtle elevation increase

**Detail Pages**:
- Image gallery (primary + thumbnails)
- Specifications table with Brazilian regulatory data (Renavam, Placa, Chassi)
- Two-column layout: Images left, details right

## Admin Area Design

**Navigation**:
- Persistent sidebar (w-64) with icon + text labels
- Sections: Dashboard, Veículos, Clientes, Vendas, Configurações
- Active state: Subtle background highlight

**Dashboard**:
- Stats cards in 4-column grid (vendas do mês, estoque total, à vista vs financiado)
- Recent activity table below
- Clean, scannable data presentation

**Data Tables**:
- Striped rows for readability
- Sticky headers
- Action buttons (Editar, Excluir) aligned right
- Search/filter bar above table

**Forms**:
- Clear section groupings (Dados Pessoais, Documentos, Endereço, etc.)
- Consistent label positioning (top-aligned)
- Required field indicators
- Validation feedback inline
- Large, accessible input fields

**Vehicle Management**:
- Image upload area prominent (drag-and-drop zone)
- Marca/Categoria dropdowns
- Brazilian-specific fields clearly labeled (Renavam, Placa)

**Sales Registration**:
- Multi-step form feel with logical sections
- Payment type toggle (À Vista / Financiado)
- Conditional fields (entrada, parcelas shown only for Financiado)
- Client and vehicle selection with search/autocomplete
- Summary panel showing calculated totals

## Component Library

**Buttons**:
- Primary: Solid, prominent for main actions
- Secondary: Outlined for alternative actions
- Sizes: Small (forms), Medium (default), Large (CTAs)

**Cards**:
- Subtle borders, minimal shadows
- Consistent padding (p-6)
- Clear visual separation between sections

**Tables**:
- Clean borders, generous cell padding (px-6 py-4)
- Alternating row backgrounds for scannability
- Compact mode option for dense data

**Form Inputs**:
- Full-width within container
- Clear focus states
- Error states with red accent
- Helper text below fields

**Modals/Dialogs**:
- Centered overlay
- Clear close mechanisms
- Action buttons bottom-right

## Images

**Required Images**:
1. **Hero Section**: High-quality automotive showroom or luxury vehicle (1920x1080)
2. **Vehicle Placeholders**: Generic car silhouettes for inventory without photos
3. **Empty States**: Illustrations for "Nenhum veículo cadastrado", "Sem vendas"

**Image Specifications**:
- Vehicle photos: 16:9 ratio, minimum 800x450px
- Thumbnails: 4:3 ratio, 200x150px
- All images optimized for web (WebP preferred)

## Accessibility

- Form labels properly associated with inputs
- Keyboard navigation throughout
- Clear focus indicators (ring-2 ring-blue-500)
- ARIA labels for icon-only buttons
- Color contrast ratios meeting WCAG AA
- Consistent tab order

## Responsive Behavior

- Mobile: Single column, stacked layouts, hamburger menu for admin
- Tablet: 2-column grids where appropriate
- Desktop: Full multi-column layouts
- Touch-friendly targets (min 44x44px) on all devices

---

**Key Differentiator**: Balance between aspirational public-facing catalog (selling the dream of car ownership) and efficient admin tools (managing complex dealership operations with Brazilian regulatory compliance).