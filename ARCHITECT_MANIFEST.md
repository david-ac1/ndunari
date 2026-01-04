1. Project Identity: Ndunari
Name Etymology: Ndụ (Igbo: Life) + Narị (Igbo: Hundred).

Mission: A 100-year health vision for Nigeria. Eliminating counterfeit drugs and antimicrobial resistance (AMR) through Gemini 3’s multimodal forensic and stewardship agents.

2. Agent Architecture (Antigravity Config)
Initialize the following agentic workspaces with specific model configurations:

Workspace A: Forensic Eye (The "Ndụ" Agent)
Model: gemini-3-flash

Configuration: * thinking_level="minimal" (Optimized for real-time mobile latency).

media_resolution="high" (Global setting for granular image forensic analysis).

Primary Tools: OpenCV, MobileCameraStream, NAFDAC_Registry_Lookup.

Task: Analyze unboxing videos and pack photos for typography errors, hologram reflection patterns, and NAFDAC batch validity.

Workspace B: Stewardship Brain (The "Narị" Agent)
Model: gemini-3-pro

Configuration:

thinking_level="high" (Required for medical trade-offs and decision reasoning).

Context Management: Full 1M+ token window. No RAG. Load NCDC_Guidelines_2025.pdf and Nigeria_Resistance_Map_2026.csv directly into system memory.

Primary Duty: Intervene in "Reserve" antibiotic prescriptions. Generate patient counseling in English, Pidgin, Hausa, Igbo, and Yoruba.

3. Mandatory 2026 Technical Protocols
Protocol 1: Stateful Reasoning (Thought Signatures)
Requirement: Every multi-turn interaction must persist the thought_signature.

Validation: If the signature from the model's functionCall turn is missing in the next functionResponse turn, the API will return a 400 error.

Antigravity Instruction: "Implement a state manager that captures the opaque thought_signature string from every Gemini response and injects it into the next turn's content parts."

Protocol 2: Tiered Thinking Logic
Logic: Use Flash for the "Check" (low cost) and hand off to Pro for the "Intervention" (high reasoning).

Code Implementation: If Workspace A detects a probability of counterfeit < 95% OR a "Watch/Reserve" class drug, trigger Workspace B with thinking_level="high" for forensic justification.

Protocol 3: Optimized Temperature
Standard: Keep temperature=1.0. Do not lower it to 0.1 for "accuracy." Gemini 3’s reasoning stack is optimized for 1.0; lowering it causes logic loops in the new thinking engine.

4. Key API Functions to Scaffold
scan_batch(image_bytes, gps_coord): Checks the visual batch against regional distribution maps.

assess_stewardship(prescription_text): Evaluates drug choice against NCDC resistance data.

generate_voice_guide(instructions, language): Uses the new native audio output to explain dosages to patients.