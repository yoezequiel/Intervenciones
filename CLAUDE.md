# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start              # Start Expo dev server
npm run android        # Run on Android (requires emulator or device)
npm run ios            # Run on iOS (macOS only)
npm run web            # Run in browser

npm start -- --clear   # Clear Metro cache (fixes most bundler issues)

# Android native build
cd android && ./gradlew assembleDebug    # Debug APK
cd android && ./gradlew bundleRelease   # Release bundle

# EAS cloud builds
eas build --platform android --profile preview     # Internal APK
eas build --platform android --profile production  # Release bundle
eas update --branch production --message "..."     # OTA JS-only update
```

There are no tests configured in this project.

## Architecture

**Stack:** React Native 0.81.5 + Expo 54, React 19, expo-sqlite, React Navigation (native stack), React Native Paper (Material Design), expo-print + expo-sharing for PDF.

**Entry point flow:** `index.js` → `App.js` wraps everything in `<ErrorBoundary>`, `<PaperProvider theme={firefighterTheme}>`, and `<DatabaseProvider>`. Navigation is a root native stack with a `Main` screen that hosts a bottom tab navigator (Intervenciones / Comunicaciones). All detail/form screens live in the root stack so they're reachable from either tab: `InterventionForm`, `InterventionDetail`, `Report`, `CommunicationForm`, `CommunicationDetail`.

**Global state:** Only one context — `DatabaseContext` (`src/context/DatabaseContext.js`). It holds `interventions[]`, `communications[]`, `isDbReady`, and `error`, plus CRUD functions for both entities. Every screen calls `useDatabase()` to access it. All other state is local to each screen.

**Database:** SQLite via `expo-sqlite`. Two tables in `interventions.db`:
- `interventions` — array fields (`otherServices`, `witnesses`, `victims`, `photos`, `audioNotes`, `sketches`) stored as JSON strings; `communicationId INTEGER` nullable FK to communications.
- `communications` — fields: `callerName`, `callerPhone`, `time`, `address`, `incidentType`, `status` (`recibido` | `reportado` | `desplazamiento`), `notes`, `interventionId INTEGER` nullable FK to interventions.

`DatabaseContext` parses JSON fields on load via `safeJsonParse`. Schema migrations run on startup via `PRAGMA table_info` check — this is the pattern to follow for future column additions.

**Photos:** When a user picks a photo, `src/utils/mediaUtils.js` copies it from the temporary picker URI to `FileSystem.documentDirectory/photos/` for permanent storage. Always call `saveImagePermanently()` before storing a URI in the database.

**AI report generation:** `InterventionDetailScreen` calls the Google Gemini REST API directly via `fetch` (no SDK). The API key is read from `Constants.expoConfig?.extra?.API_KEY` in `env.js` — it is injected at build time from the `API_KEY` environment variable via `app.config.js`'s `extra` field. There is a local fallback report generator if the API call fails.

**PDF generation:** `src/utils/pdfGenerator.js` builds an HTML string and uses `expo-print` to render it to a PDF file, then calls `expo-sharing` to share/save it. No third-party PDF library is used.

**Theme:** Firefighter red palette defined in `src/theme.js` — primary `#d32f2f`, error `#b71c1c`, secondary yellow `#FFC107`.

**Types/constants:** `src/types/index.js` exports `InterventionType` and `ServiceType` enums — use these instead of raw strings when referencing intervention or service types.

## Key non-obvious details

- `env.js` does **not** read from a `.env` file at runtime. The `API_KEY` must be present as an environment variable when running `expo start` or building with EAS, so that `app.config.js` can embed it into `Constants.expoConfig.extra`.
- `getIntervention(id)` and `getCommunication(id)` search the in-memory arrays by ID (no extra DB query). They compare IDs as strings to avoid type mismatch.
- `addIntervention` returns `result.lastInsertRowId` — callers that need the new ID (e.g. creating an intervention from a communication) depend on this.
- **Communication → Intervention flow:** `CommunicationDetailScreen` navigates to `InterventionForm` with `{ communicationId, prefill: { callTime, address, type } }`. On save, `InterventionFormScreen` calls `updateCommunication(communicationId, { status: 'desplazamiento', interventionId: newId })` then replaces itself with `InterventionDetail`.
- The DB init retries up to 3 times with a 500ms delay if the SQLite runtime isn't ready yet.
- `DatabaseContext` does **not** expose the raw `db` instance in its context value — only the CRUD functions.
- `witnesses` in older records may be stored as plain strings; `pdfGenerator.js` handles both string and object formats via `typeof w === "string"` checks.
