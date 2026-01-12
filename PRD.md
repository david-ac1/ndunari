This Product Requirement Document (PRD) is designed for a high-stakes HealthTech environment. It positions Ndunari not just as an app, but as a Life-Saving Agentic Infrastructure.

It prioritizes clinical safety (AMR) and forensic integrity (Counterfeits) while solving the "Infrastructure Gap" (No NAFDAC API) using Gemini 3's high-reasoning capabilities.

Product Requirement Document: Ndunari (Health Shield)
Project Code Name: Health Shield Nigeria

Version: 1.0 (Restart / PWA Native)

Stakeholders: NAFDAC, NCDC, Community Pharmacists, Nigerian Patients

Platform: Flutter Progressive Web App (WasmGC Optimized)

1. Problem Statement
Nigeria faces a dual-threat pharmaceutical crisis:

Counterfeit Proliferation: Substandard/Falsified (SF) medical products account for a significant percentage of the local market, leading to treatment failure and death.

AMR Crisis: The unregulated use of "Reserve" and "Watch" group antibiotics is accelerating Antimicrobial Resistance, projected to kill 10 million people globally by 2050.

2. Value Proposition
Ndunari is a Decentralized Pharmaceutical Surveillance Network. It uses Gemini 3 to provide institutional-grade drug authentication and clinical stewardship directly at the point of care, turning every smartphone into a forensic lab and an expert medical consultant.

3. Functional Requirements
3.1 Tiered Agentic Core (The Engine)
FR-1: Forensic Eye (Vision): Uses Gemini 3 Flash (media_resolution="high") to perform real-time visual audits of packaging. It detects microscopic printing errors, structural NAFDAC number syntax invalidity, and security feature inconsistencies.

FR-2: Stewardship Brain (Reasoning): Uses Gemini 3 Pro (thinking_level="high") to analyze prescriptions. It justifies drug choice against WHO AWaRe categories and Nigerian NCDC guidelines.

FR-3: Agentic Handshake: If the "Flash" model detects a high-risk drug (e.g., Ciprofloxacin) or a suspicious package, it automatically escalates to the "Pro" model for a clinical-grade risk justification.

3.2 Multimodal Verification (Vision + Data)
FR-4: Hybrid Registry Lookup:

Primary: Live check against EMDEX API (15k+ products).

Secondary: Pattern reasoning (AI-led syntax check of NAFDAC Reg Nos).

Fallback: Local Vectorized Index of common Nigerian pharmaceuticals.

FR-5: Batch Surveillance: Captures GPS, Timestamp, and Image on failed scans to create a real-time "Counterfeit Heatmap" for regulatory visibility.

3.3 Patient Engagement & Counseling
FR-6: Narị Multilingual Voice: Provides dosage and adherence guidance in English, Pidgin, Yoruba, Hausa, and Igbo.

FR-7: Safety Scores: A gamified "Health Integrity Score" rewards users for completing antibiotic courses and reporting authentic medications.

4. User Experience & Design (UI/UX)
Design Philosophy: "High-Trust / Low-Complexity."

Visual Anchor: Use the Deep Forest Green theme (Safety & Health).

Thought Signatures: The UI must display the "Agent’s Reasoning" process (e.g., "Analyzing Hologram Structure...") to build user trust in the AI's clinical decisions.

Responsive Layout: Must perform seamlessly on low-end mobile browsers (6" screens) and pharmacist tablet/laptop dashboards.

5. Technical Non-Functional Requirements
NFR-1: Latency: Initial forensic scan must return a "Safe/Unsafe" result in < 3 seconds.

NFR-2: Data Sovereignty: Implementation of Anonymous Authentication. No personally identifiable information (PII) is stored; only de-identified batch and GPS telemetry.

NFR-3: Protocol Compliance: Strict circulation of Thought Signatures in the Dart backend to prevent 400 errors in complex medical loops.

NFR-4: Deployment: Hosted as a PWA on Firebase Hosting for rapid updates and zero-install friction.

6. Roadmap & Success Metrics
Phase 1: Foundation (Weeks 1-2)
Scaffold Flutter PWA.

Implement the Tiered Data Engine (EMDEX + Pattern Reasoning).

Translate Stitch screens to functional widgets.

Phase 2: Intelligence (Weeks 3-4)
Integrate Forensic Eye (Vision) and Stewardship Brain (Thinking).

Implement Multilingual Voice Guides (Narị).

Finalize the De-identified Telemetry Ledger.

KPIs for Judging
Forensic Accuracy: % of structurally invalid NAFDAC numbers identified.

Stewardship Intervention: % of "Reserve" drugs flagged for review.

Accessibility: Loading speed over 3G/Edge Nigerian networks.