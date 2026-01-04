# Ndunari - AI-Driven Medical Safety App

## Setup Instructions

### 1. Add Your Gemini API Key

1. Open the `.env` file in the project root
2. Replace `your_api_key_here` with your actual Gemini API key:
   ```
   GEMINI_API_KEY=AIzaSy...your_actual_key_here
   ```
3. Save the file

### 2. Run the App

```bash
flutter pub get
flutter run
```

### 3. Test Forensic Eye

1. Navigate to Scan screen
2. Capture or select an image of a drug package
3. The app will analyze it using Gemini 3 Flash
4. View real-time authenticity results

## API Configuration

- **Model**: `gemini-2.0-flash-exp`
- **Temperature**: 1.0 (optimized for Gemini 3 reasoning)
- **Resolution**: High (for forensic analysis)

## Features Implemented

✅ **Phase 1: Forensic Eye (Gemini 3 Flash)**
- Real-time drug package authentication
- Typography error detection
- Hologram pattern analysis
- NAFDAC batch number extraction
- GPS location tracking
- Loading states and error handling

🔲 **Phase 2: Stewardship Brain (Gemini 3 Pro)** - Coming next
- Antibiotic stewardship assessment
- Multilingual patient counseling
- Reserve drug detection
