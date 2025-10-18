# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Navia Document Validator** is a web-based document validation tool for logistics and freight forwarding. It uses Claude AI (Anthropic) to extract and validate key fields from customs and shipping documents (HBL, Commercial Invoices, Packing Lists).

**Tech Stack:**
- **Frontend:** React 18 + TypeScript + Tailwind CSS + Vite
- **Backend:** Netlify Functions (serverless)
- **AI:** Anthropic Claude API (claude-3-5-sonnet-20241022 model)
- **Deployment:** Netlify

## Architecture

### Three-Layer Architecture

1. **Frontend Layer** (`src/`)
   - `App.tsx`: Root component with gradient layout
   - `components/FileUpload.tsx`: Drag-and-drop multi-file uploader with batch processing
   - `components/ValidationResult.tsx`: Structured display of validation results with JSON export
   - `main.tsx`: React app entry point

2. **Serverless Function Layer** (`netlify/functions/`)
   - `validate-document.ts`: Netlify Function handling PDF validation via Claude API
   - Accepts FormData with PDF file
   - Uses Claude's document vision capability with base64-encoded PDFs
   - Returns structured JSON validation results

3. **Configuration Layer**
   - `netlify.toml`: Build config, SPA redirects, esbuild function bundler
   - `vite.config.ts`: Dev server on port 5173
   - `tailwind.config.js` + `postcss.config.js`: Styling pipeline

### Data Flow

```
User uploads PDF(s) → FileUpload component → FormData POST to /.netlify/functions/validate-document
→ Netlify Function receives file → Convert to base64 → Send to Claude API with system prompt
→ Claude extracts fields + validates → JSON response → Display in ValidationResult component
```

### Claude Integration Details

**System Prompt Engineering** (validate-document.ts:4-40):
- Specialized persona: "logistics document validation specialist for Navia"
- Structured field extraction for 7 categories: Shipper, Consignee, Document Numbers, Shipment Details, Cargo, Financial, Dates
- Validation rules: Missing critical fields, cross-document inconsistencies, total verification
- Enforced JSON output format (no markdown)

**API Configuration** (validate-document.ts:91-114):
- Model: `claude-3-5-sonnet-20241022`
- Max tokens: 4096
- Uses `document` content type with base64 source
- Strips markdown code blocks from response (lines 123-128)

**Response Format:**
```json
{
  "documentType": "HBL|Invoice|PackingList",
  "extractedFields": { /* shipper, consignee, hblNumber, etc. */ },
  "validationStatus": "PASS|FAIL|WARNING",
  "issues": [{ "field": "...", "severity": "ERROR|WARNING", "message": "..." }],
  "confidence": 0.95
}
```

## Development Commands

### Local Development
```bash
# Install dependencies
npm install

# Start Vite dev server (frontend only, port 5173)
npm run dev

# Start Netlify Dev (includes serverless functions)
npm run netlify:dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Deployment
```bash
# Deploy to Netlify production
npm run netlify:deploy
```

## Environment Variables

Required in `.env` (see `.env.example`):
```bash
ANTHROPIC_API_KEY=sk-ant-...
```

**Important:** Netlify Functions require environment variables to be set in Netlify dashboard (not just local `.env`).

## TypeScript Configuration

- **Module System:** ESNext with bundler resolution (tsconfig.json:6-8)
- **Target:** ES2020 with DOM types
- **JSX:** react-jsx transform (no React import needed)
- **Strict Mode:** Enabled with noUnusedLocals/Parameters (tsconfig.json:14-17)
- **No Emit:** Vite handles compilation (tsconfig.json:12)

## Component Architecture

### FileUpload Component (src/components/FileUpload.tsx)

**State Management:**
- `files`: Selected PDF files array
- `dragActive`: Drag-and-drop UI state
- `state`: UploadState object tracking upload progress, errors, results

**Key Features:**
- Multi-file drag-and-drop with PDF validation (lines 24-52)
- Sequential batch processing with progress indicator (lines 54-109)
- File size display and validation
- CORS-enabled fetch to `/.netlify/functions/validate-document`

**API Integration Pattern:**
```typescript
const formData = new FormData();
formData.append('file', file);
const response = await fetch('/.netlify/functions/validate-document', {
  method: 'POST',
  body: formData
});
```

### ValidationResult Component (src/components/ValidationResult.tsx)

**Display Logic:**
- Color-coded status badges (PASS=green, WARNING=yellow, FAIL=red)
- Issue severity highlighting (ERROR vs WARNING)
- Confidence score visualization
- Two-column extracted fields grid
- JSON download button

**Fallback Handling:**
- Shows raw response if JSON parsing fails (lines 32-38)
- Gracefully handles missing fields with `N/A`

## Netlify Function Details

### validate-document.ts

**CORS Configuration** (lines 43-48):
- Allows all origins (`*`)
- Handles OPTIONS preflight
- Returns proper Content-Type headers

**Error Handling:**
- API key validation (line 65-67)
- File presence check (line 72-80)
- JSON parse fallback (lines 131-140)
- Comprehensive error response with stack trace (lines 154-165)

**Logging:**
- File metadata: name, size, type (line 82)
- Raw Claude response preview (line 120)
- Parse errors with cleaned text sample (line 135)

## Common Development Patterns

### Adding New Document Types

1. **Update System Prompt** (validate-document.ts:4-40):
   - Add document type to list
   - Define required fields for new type
   - Add validation rules

2. **Update TypeScript Types** (ValidationResult.tsx:4-16):
   - Add document type to union
   - Update `extractedFields` interface if needed

### Modifying Validation Logic

All validation logic is **prompt-based** in the system prompt (validate-document.ts:17-21). No code changes needed for rule adjustments - just update the prompt.

### Debugging Claude Responses

Enable console logs in browser DevTools to see:
- Raw Claude response (first 200 chars): validate-document.ts:120
- JSON parse errors with cleaned text: validate-document.ts:134-135

## Deployment Checklist

1. Set `ANTHROPIC_API_KEY` in Netlify Environment Variables
2. Ensure `netlify.toml` build command is correct (`npm run build`)
3. Verify `dist` folder is set as publish directory
4. Test SPA redirects work (netlify.toml:9-12)
5. Check function bundler is esbuild (netlify.toml:15)

## Known Limitations

- PDF-only support (enforced in FileUpload component)
- Sequential processing (not parallel) to avoid rate limits
- Claude may return markdown-wrapped JSON despite prompt instructions (stripped in lines 123-128)
- No file size limit validation (handled by Netlify/Claude API limits)

## Related Projects

This project is part of Navia Freight's 3PL integration ecosystem:
- **cloflaapicw**: CargoWise integration platform (webhook middleware, D1 database)
- **cwai-3pl-platform**: Multi-tenant Firebase platform for schema mapping
- **GPTvalidator**: FastAPI compliance checker with OCR
- **Integration Form**: Microsoft Teams integration requirements forms

## Business Context

Used for validating logistics documents against customs requirements:
- Packing Declarations (ISPM 15 compliance)
- Commercial Invoices (complete field validation)
- Bills of Lading (shipper/consignee verification)
- Certificates of Origin (certification statements)
