# Ndunari UI Design Documentation

**Framework:** High‑Trust Clinical Design System
**Version:** 1.0 (PWA Native)
**Reference:** Stitch‑Generated Visual Artifacts

---

## 1. Color System

The palette is centered on **Deep Forest Green** to evoke health authority, trust, and regulatory legitimacy, balanced with high‑contrast neutrals for clinical clarity.

| Role      | Color Name        | Hex Code  | Usage                                                 |
| --------- | ----------------- | --------- | ----------------------------------------------------- |
| Primary   | Deep Forest Green | `#0A4D3C` | App bars, primary buttons, branding elements          |
| Secondary | Mint Leaf         | `#E8F5E9` | Card backgrounds, subtle highlights                   |
| Success   | Access Green      | `#2E7D32` | WHO *Access* drug status, authentic drug verification |
| Warning   | Watch Orange      | `#EF6C00` | WHO *Watch* drug status, suspicious batch warnings    |
| Danger    | Reserve Red       | `#C62828` | WHO *Reserve* drug status, counterfeit alerts         |
| Neutral 1 | Clinical White    | `#FFFFFF` | Main background, text on dark buttons                 |
| Neutral 2 | Slate Gray        | `#455A64` | Body text, unselected navigation icons                |
| Neutral 3 | Soft Border       | `#E0E0E0` | Card borders, dividers                                |

---

## 2. Typography

Ndunari uses **geometric sans‑serif** typefaces to maintain a professional medical aesthetic while ensuring legibility on low‑end devices and under varied lighting conditions.

### Font Stack

* **Primary Font:** Inter (Google Fonts)
* **Secondary Font:** Manrope
  *Used specifically for "Narị" agent dialogue and system responses.*

### Type Scale

| Level        | Size | Weight          | Tracking | Usage                                     |
| ------------ | ---- | --------------- | -------- | ----------------------------------------- |
| H1           | 24px | 700 (Bold)      | -0.02em  | Main page titles (e.g., *Home*)           |
| H2           | 20px | 600 (Semi‑Bold) | 0        | Section headers (e.g., *Verify Medicine*) |
| Body Large   | 16px | 500 (Medium)    | 0        | Action card labels, button text           |
| Body Regular | 14px | 400 (Regular)   | 0        | Description text, drug details            |
| Caption      | 12px | 400 (Regular)   | +0.05em  | NAFDAC registration numbers, metadata     |

---

## 3. Spacing & Layout

Ndunari follows a **4dp baseline grid** to ensure mathematical consistency across all PWA viewports.

### Layout Rules

* **Page Margins:** 20px left/right (mobile‑first gutters)
* **Card Padding:** 16px internal padding for all interactive cards

### Corner Radius

* **12px:** Primary cards and containers
* **8px:** Buttons and small input fields

### Element Spacing

* **Vertical:**

  * 24px between major sections
  * 12px between related elements
* **Horizontal:**

  * 12px between adjacent icons or buttons

---

## 4. Component Specifications

### 4.1 Forensic Scan View

A high‑focus scanning interface designed to convey seriousness, accuracy, and clinical intent.

* **Overlay:** 70% opacity black shroud
* **Focus Window:** Clear central scanning region

#### Feedback Border

* 3px animated border around the focus window
* **Success Green:** Batch successfully detected
* **Reserve Red:** Scan failure or counterfeit detection

#### Thought Signature Pulse

* Small *"Thinking"* indicator at the bottom of the screen
* Typography: 12px Inter, *Italic*

---

### 4.2 Stewardship Dashboard

Provides at‑a‑glance regulatory and safety insights.

* **Indicator Lights:**

  * 12px circular glyphs
  * Uses Success / Warning / Danger color tokens

* **Card Elevation:**

  * Level 1 soft shadow
  * `blurRadius: 4`
  * `offset: (0, 2)`

---

## 5. Accessibility Standards

Ndunari is built to meet **WCAG 2.1 AA** accessibility requirements.

* **Contrast Ratio:** Minimum 4.5:1 for all text
* **Touch Targets:** Minimum size of 48×48px for all interactive elements
* **Font Legibility:**

  * Medical instructions must never use font weights below 400 (Regular)

---

*Ndunari Design System v1.0 — Built for trust, clarity, and public health integrity.*
