-- Create the drugs table
CREATE TABLE IF NOT EXISTS public.drugs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drug_name TEXT NOT NULL,
    generic_name TEXT NOT NULL,
    nafdac_number TEXT UNIQUE NOT NULL,
    manufacturer TEXT NOT NULL,
    aware_category TEXT CHECK (aware_category IN ('ACCESS', 'WATCH', 'RESERVE', 'NOT_ANTIBIOTIC')),
    dosage_forms TEXT[],
    common_dosages TEXT[],
    indication TEXT,
    warnings TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.drugs ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (public reference data)
CREATE POLICY "Allow public read access" ON public.drugs
    FOR SELECT USING (true);

-- Seed Initial Data (from previous Mock Database)
INSERT INTO public.drugs (drug_name, generic_name, nafdac_number, manufacturer, aware_category, dosage_forms, common_dosages, indication, warnings)
VALUES 
    (
        'Amartem Softgel', 
        'Artemether + Lumefantrine', 
        'NAF-2019-12345', 
        'Emzor Pharmaceutical', 
        'NOT_ANTIBIOTIC', 
        ARRAY['Softgel', 'Tablet'], 
        ARRAY['80mg/480mg'], 
        'Uncomplicated malaria', 
        ARRAY[]::TEXT[]
    ),
    (
        'Amoxicillin', 
        'Amoxicillin', 
        'NAF-2020-23456', 
        'Various', 
        'ACCESS', 
        ARRAY['Capsule', 'Suspension', 'Tablet'], 
        ARRAY['250mg', '500mg'], 
        'Bacterial infections - first-line', 
        ARRAY['Check for penicillin allergy']
    ),
    (
        'Ampicillin', 
        'Ampicillin', 
        'NAF-2018-34567', 
        'Various', 
        'ACCESS', 
        ARRAY['Capsule', 'Injection'], 
        ARRAY['250mg', '500mg'], 
        'Respiratory and urinary tract infections', 
        ARRAY[]::TEXT[]
    ),
    (
        'Ciprofloxacin', 
        'Ciprofloxacin', 
        'NAF-2019-45678', 
        'Various', 
        'WATCH', 
        ARRAY['Tablet', 'Suspension', 'IV'], 
        ARRAY['500mg', '750mg'], 
        'Serious bacterial infections', 
        ARRAY['HIGH RESISTANCE in Lagos', 'WHO Watch category - monitor usage', 'Not for routine use']
    ),
    (
        'Azithromycin', 
        'Azithromycin', 
        'NAF-2020-56789', 
        'Various', 
        'WATCH', 
        ARRAY['Tablet', 'Suspension'], 
        ARRAY['250mg', '500mg'], 
        'Respiratory infections, STIs', 
        ARRAY['WHO Watch category', 'Prefer ACCESS alternatives when possible', 'Rising resistance in Nigeria']
    ),
    (
        'Colistin', 
        'Colistin', 
        'NAF-2021-67890', 
        'Hospital supply', 
        'RESERVE', 
        ARRAY['Injection'], 
        ARRAY['1MU', '2MU'], 
        'Multidrug-resistant gram-negative infections', 
        ARRAY['WHO RESERVE - last resort ONLY', 'Hospital use ONLY', 'Requires infectious disease consultation', 'NEVER for community use']
    ),
    (
        'Meropenem', 
        'Meropenem', 
        'Meropenem', 
        'Hospital supply', 
        'RESERVE', 
        ARRAY['Injection'], 
        ARRAY['500mg', '1g'], 
        'Severe hospital-acquired infections', 
        ARRAY['WHO RESERVE category', 'Hospital setting ONLY', 'Culture-guided use']
    ),
    (
        'Paracetamol', 
        'Paracetamol/Acetaminophen', 
        'NAF-2018-11111', 
        'Various', 
        'NOT_ANTIBIOTIC', 
        ARRAY['Tablet', 'Suspension', 'Suppository'], 
        ARRAY['500mg', '1000mg'], 
        'Pain and fever relief', 
        ARRAY['Do not exceed 4g daily - liver damage risk']
    )
ON CONFLICT (nafdac_number) DO NOTHING;
