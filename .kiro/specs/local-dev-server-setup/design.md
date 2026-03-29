# Local Dev Server Setup Bugfix Design

## Overview

The Med Pulse PWA cannot run locally using the file:// protocol due to browser security restrictions that block CORS requests, ServiceWorker registration, and manifest loading. This design provides a local development server solution that serves the application over HTTP/HTTPS, enabling full PWA functionality during development while maintaining compatibility with GitHub Pages deployment.

The fix involves adding a lightweight development server configuration with npm scripts, ensuring developers can test locally without deploying to GitHub Pages for every change.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when the application is accessed via file:// protocol instead of HTTP/HTTPS
- **Property (P)**: The desired behavior - PWA features (ServiceWorker, manifest, fetch) work correctly during local development
- **Preservation**: GitHub Pages deployment and production functionality must remain unchanged
- **file:// protocol**: Browser protocol for accessing local files directly, which has security restrictions
- **CORS (Cross-Origin Resource Sharing)**: Browser security mechanism that blocks certain requests from file:// origins
- **ServiceWorker**: PWA feature that requires HTTP/HTTPS protocol to register
- **Development Server**: Local HTTP server that serves files during development

## Bug Details

### Bug Condition

The bug manifests when a developer opens index.html directly from the file system (double-clicking the file or using file:// URL). The browser treats the origin as 'null' and blocks PWA features due to security policies.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type ApplicationAccessMethod
  OUTPUT: boolean
  
  RETURN input.protocol == 'file://'
         AND (input.requiresManifest OR input.requiresServiceWorker OR input.requiresFetch)
         AND browserBlocksFeature(input.protocol, input.feature)
END FUNCTION
```

### Examples

- **Opening index.html directly**: Double-clicking index.html opens it as `file:///C:/Users/.../index.html`, causing manifest.json to fail with "Cross origin requests are only supported for protocol schemes: http, https"
- **ServiceWorker registration**: Attempting to register service-worker.js fails with "The URL protocol of the current origin ('null') is not supported"
- **Fetching data/sources.json**: fetch() call fails with CORS policy error "Cross origin requests are only supported for protocol schemes: http, https"
- **Production deployment**: Opening the app via `https://username.github.io/repo/` works correctly (not a bug condition)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- GitHub Pages deployment must continue to work with all PWA features functional
- RSS feed fetching via the proxy must continue to work as expected
- Article rendering and chart visualization must remain unchanged
- ServiceWorker caching behavior in production must remain unchanged
- All production URLs and paths must continue to resolve correctly

**Scope:**
All production deployment scenarios (GitHub Pages, any HTTP/HTTPS hosting) should be completely unaffected by this fix. This includes:
- Production ServiceWorker registration and caching
- Production manifest loading and PWA installation
- Production resource loading and fetch requests
- User experience on deployed application

## Hypothesized Root Cause

Based on the bug description, the root cause is clear:

1. **Protocol Restriction**: Browsers enforce security policies that prevent file:// protocol from:
   - Loading manifest.json due to CORS restrictions
   - Registering ServiceWorkers (requires secure context: HTTP/HTTPS)
   - Making fetch() requests to local JSON files

2. **Missing Development Infrastructure**: The project lacks:
   - A local development server configuration
   - npm scripts to start a development server
   - package.json with development dependencies
   - Documentation on how to run the app locally

3. **Direct File Access Assumption**: The current setup assumes developers will either:
   - Deploy to GitHub Pages for testing (inefficient workflow)
   - Use browser extensions to bypass security (not a proper solution)

## Correctness Properties

Property 1: Bug Condition - Local Development Server Enables PWA Features

_For any_ development scenario where the application is accessed locally (file:// protocol would be used), the fixed setup SHALL provide a local HTTP/HTTPS server that enables manifest loading, ServiceWorker registration, and fetch requests to work correctly without CORS errors.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 2: Preservation - Production Deployment Unchanged

_For any_ production deployment scenario (GitHub Pages or other HTTP/HTTPS hosting), the fixed code SHALL produce exactly the same behavior as the original code, preserving all PWA functionality, resource loading, and user experience.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

**File**: `package.json` (NEW FILE)

**Purpose**: Define project dependencies and npm scripts for development server

**Specific Changes**:
1. **Create package.json**: Initialize npm project with development dependencies
   - Add `http-server` or `live-server` as devDependency
   - Define `start` script to launch development server
   - Define `dev` script as alias for convenience
   - Set appropriate metadata (name, version, description)

2. **Development Server Configuration**: Configure server to:
   - Serve files from project root
   - Use appropriate port (e.g., 8080 or 3000)
   - Enable CORS headers if needed
   - Support live reload for better DX (optional enhancement)

**File**: `README.md` (MODIFY)

**Purpose**: Document local development setup instructions

**Specific Changes**:
1. **Add Local Development Section**: Include instructions for:
   - Installing dependencies (`npm install`)
   - Starting development server (`npm start`)
   - Accessing the application (http://localhost:8080)

2. **Update Deployment Section**: Clarify that GitHub Pages is for production, local server is for development

**File**: `.gitignore` (NEW FILE - OPTIONAL)

**Purpose**: Exclude node_modules from version control

**Specific Changes**:
1. **Add node_modules/**: Prevent committing dependencies
2. **Add package-lock.json**: Optional, depending on team preference

### Implementation Strategy

The fix will use `http-server` as the development server because:
- Zero configuration required
- Lightweight and fast
- Widely used in the community
- No build step needed (serves static files directly)
- Compatible with GitHub Pages deployment structure

Alternative considered: `live-server` (provides auto-reload but adds complexity)

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, demonstrate the bug on the current setup (file:// protocol), then verify the fix works correctly with the development server while preserving production deployment.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm the root cause analysis.

**Test Plan**: Open the application using file:// protocol and observe console errors. Document all failures related to CORS, ServiceWorker, and manifest loading.

**Test Cases**:
1. **Manifest Loading Test**: Open index.html via file://, check console for manifest.json CORS error (will fail on unfixed code)
2. **ServiceWorker Registration Test**: Open index.html via file://, check console for ServiceWorker registration error (will fail on unfixed code)
3. **Fetch Request Test**: Open index.html via file://, check console for data/sources.json fetch error (will fail on unfixed code)
4. **Browser DevTools Application Tab**: Verify that manifest and ServiceWorker sections show errors (will fail on unfixed code)

**Expected Counterexamples**:
- Console error: "Cross origin requests are only supported for protocol schemes: http, https"
- Console error: "Failed to register a ServiceWorker: The URL protocol of the current origin ('null') is not supported"
- Console error: "Failed to load resource: net::ERR_FAILED" for manifest.json
- Application tab shows "No manifest detected" or similar warnings

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds (local development), the fixed setup produces the expected behavior (PWA features work).

**Pseudocode:**
```
FOR ALL developmentScenario WHERE isBugCondition(developmentScenario) DO
  result := runWithDevServer(developmentScenario)
  ASSERT manifestLoads(result)
  ASSERT serviceWorkerRegisters(result)
  ASSERT fetchSucceeds(result)
  ASSERT noCORSErrors(result)
END FOR
```

**Test Plan**: After implementing the fix, start the development server and verify all PWA features work correctly.

**Test Cases**:
1. **Manifest Loading**: Access http://localhost:8080, verify manifest.json loads without errors
2. **ServiceWorker Registration**: Check console for successful ServiceWorker registration message
3. **Fetch Requests**: Verify data/sources.json loads and articles render
4. **Application Tab**: Verify manifest details appear in DevTools Application tab
5. **ServiceWorker Tab**: Verify ServiceWorker is registered and active in DevTools

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (production deployment), the fixed code produces the same result as the original code.

**Pseudocode:**
```
FOR ALL productionScenario WHERE NOT isBugCondition(productionScenario) DO
  ASSERT originalDeployment(productionScenario) = fixedDeployment(productionScenario)
END FOR
```

**Testing Approach**: Deploy to GitHub Pages and verify all functionality remains unchanged. No code changes affect production behavior since we're only adding development tooling.

**Test Plan**: Deploy the application to GitHub Pages after adding package.json and verify identical behavior to pre-fix deployment.

**Test Cases**:
1. **GitHub Pages Deployment**: Deploy to GitHub Pages, verify application loads and functions correctly
2. **PWA Installation**: Verify the app can still be installed as a PWA from GitHub Pages
3. **ServiceWorker Caching**: Verify offline functionality works on GitHub Pages deployment
4. **RSS Feed Fetching**: Verify articles load correctly from RSS feeds
5. **Chart Rendering**: Verify keyword and timeline charts render correctly

### Unit Tests

- Test that package.json contains correct scripts and dependencies
- Test that development server starts without errors
- Test that all resources are accessible via HTTP on localhost
- Test that manifest.json is served with correct MIME type

### Property-Based Tests

Not applicable for this bugfix - the fix is infrastructure/tooling rather than algorithmic logic. Manual testing and integration testing are more appropriate.

### Integration Tests

- Test full development workflow: install dependencies → start server → access application → verify PWA features
- Test that changes to source files are reflected when server is running
- Test that production deployment workflow remains unchanged
- Test that both development and production environments work correctly
