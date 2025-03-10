# HMA Review Tool - Project Notes

## Project Overview
- Full-stack review tool for the Hasher-Matcher-Actioner (HMA) system
- Working on the `review-tool` branch
- Frontend: Next.js 15.2.1 with Chakra UI
- Backend: FastAPI with PDQ hashing functionality
- Purpose: Content moderation review tool for hash-based image matching

## Current Status

### Backend
- Server is running at http://localhost:8000
- PDQ Python module integration is working (path: `/Users/jsroost/ROOST/tx-sandbox/pdq/python`)
- PDQHasher is initialized successfully in routes.py

### Frontend
- Built with Next.js 15.2.1 using the App Router
- Components created:
  - Navigation bar with left side menu
  - Layout component
  - Image card
  - Review actions
  - Match details
  - Dashboard with filter drawer
  - Tasks page with mock data
  - Demo features for image comparison and similarity search
- Using local test images from `/public/test_images/` for development
- Mock data implemented for all components to allow testing without API dependencies

## Recent Updates

### 1. Demo Features Integration (March 2024)
- Added image comparison demo using PDQ, MD5, and SHA1 algorithms
- Implemented similarity search using PDQ for comparing and ranking images
- Created a left side menu with links to dashboard, image comparison, and similarity search
- Developed a landing page that explains the demo tool
- Added functionality to index images from all sources for similarity search
- Fixed validation and error handling in the image comparison component
- Added Docker configuration for both frontend and backend services

### 2. Dashboard UI Redesign
- Implemented a tabular layout for queue display based on reference design
- Added a functional filter drawer system to filter queues by:
  - Content category
  - Hash algorithm
  - Escalated status
  - Sort order
- Added active filter display with badges showing current filter selections
- Improved visual accessibility with proper color contrast and labeling

### 3. Content Categories Update
- Changed content categories to use humorous alternatives:
  - "fowl_play" (suspicious chicken-related activities)
  - "wild_duckery" (questionable duck behavior)
  - "rotten_eggs" (egg-related offenses)
- Updated color schemes and descriptions for the new categories
- Made these changes to clearly indicate this is a demo application

### 4. Review Tool Demo Enhancements
- Added task state management with three key states:
  - pending (unreviewed tasks)
  - reviewed (tasks with approve/reject/escalate action)
  - escalated (tasks requiring special handling)
- Fixed queue display to ensure only ONE queue per content category
- Added a Reset Demo button (green) for clearing all task states 
- Improved UI with consistent button styling
- Made similar content section open task details in new tab

### 5. Batch Image Processing Feature
- Added a new tab to the dashboard for batch processing multiple images
- Implemented file upload functionality with support for multiple images
- Created an interface to select hash algorithms to apply to uploaded images
- Added mock processing with deterministic results to demonstrate matching
- Displayed comprehensive results with category, algorithm and match information
- Implemented "View in Queue" button to link processed images to their respective review queues

## Issues Encountered

### 1. Chakra UI Integration Issues

#### Problem:
- Error when importing `extendTheme` from `@chakra-ui/react`:
  ```
  Export extendTheme doesn't exist in target module
  ```

#### Solution:
- Created a client component wrapper (`src/app/components/ChakraProvider.tsx`) with the `'use client'` directive to handle theme creation on the client side
- Updated `layout.tsx` to use the client component wrapper

### 2. Port Management

#### Problem:
- The development servers sometimes fail to start when ports are already in use
- Frontend: Next.js automatically tries other ports (e.g., 3001) when port 3000 is in use
- Backend: uvicorn fails with "[Errno 48] Address already in use" when port 8000 is in use

#### Solution:
- Before starting the frontend development server, check if port 3000 is already in use:
  ```bash
  # On macOS/Linux
  lsof -i :3000 | grep LISTEN
  
  # If a process is found, terminate it
  kill -9 <PID>
  ```
  
- Before starting the backend development server, check if port 8000 is already in use:
  ```bash
  # On macOS/Linux
  lsof -i :8000 | grep LISTEN
  
  # If a process is found, terminate it
  kill -9 <PID>
  ```
  
- Combined command to check, kill, and start in one go:
  ```bash
  # For frontend
  cd path/to/frontend && for pid in $(lsof -t -i:3000); do echo "Killing process $pid on port 3000"; kill -9 $pid; done && npm run dev
  
  # For backend
  cd path/to/backend && for pid in $(lsof -t -i:8000); do echo "Killing process $pid on port 8000"; kill -9 $pid; done && uvicorn main:app --reload
  ```

### 3. Next.js Hydration Errors with Client-Side Components

#### Problem:
- Encountered hydration errors when implementing the batch image processing feature:
  ```
  Hydration failed because the server rendered HTML didn't match the client
  ```
- This occurred because the component was using non-deterministic functions like `Math.random()` and `Date.now()`

#### Solutions:
1. Made the component client-only using the `dynamic` import with `{ ssr: false }`:
   ```typescript
   const BatchHashCheck = dynamic(
     () => import('../components/dashboard/BatchHashCheck'),
     { ssr: false }
   );
   ```

2. Created a dedicated client component file with the `'use client'` directive at the top

3. Used conditional rendering to only render the component on the client side

4. Made non-deterministic operations deterministic by using fixed values

## Environment Information
- OS: macOS Darwin 24.3.0
- Node.js: Supporting Next.js 15.2.1
- Python: 3.11.7 (using pyenv)
- Shell: /bin/zsh
- Workspace path: /Users/jsroost/ROOST/tx-sandbox 

## Lessons Learned & Development Insights

### Key Issues & Their Solutions

1. **Component-to-API Coupling Issues**
   - **Problem**: The ImageCard component was tightly coupled to expected API endpoints, causing 404 errors during development
   - **Solution**: Decoupled the component by accepting direct image URLs and implementing path-based detection
   - **Lesson**: Components should be designed with loose coupling to backend services, especially during early development

2. **Client/Server Component Confusion**
   - **Problem**: Encountered issues with 'use client' directive placement and client-side operations in server components
   - **Solution**: Created clear separation and proper directive placement in all components
   - **Lesson**: Understand Next.js's App Router architecture and client/server boundaries before starting development

3. **Port Configuration and Management**
   - **Problem**: Frequent issues with ports 3000 and 8000 being in use, causing server startup failures
   - **Solution**: Implemented port checking and process killing before starting servers
   - **Lesson**: Always use standard ports (3000 for frontend, 8000 for backend) and ensure they're free before starting servers

4. **API Integration Challenges**
   - **Problem**: Difficulty connecting frontend components to backend API endpoints
   - **Solution**: Created consistent API service layer with proper error handling
   - **Lesson**: Design API services with clear error handling and consistent response formats

### Development Strategies for Future Projects

1. **Frontend Development Without Backend Dependencies**
   - Use local resources (images, data files) instead of expecting API endpoints during initial development
   - Implement toggles to easily switch between mock and real data
   - Create dedicated mock data generators that match API response formats

2. **Next.js App Router Best Practices**
   - Keep client-side functionality clearly separated with 'use client' directives at the top of files
   - Consider server-side vs. client-side rendering implications early in component design
   - Use layout components strategically to avoid duplicate code
   - Implement page transitions and loading states for better user experience

3. **API Design Principles**
   - Extend existing APIs rather than creating new ones when adding related functionality
   - Maintain consistent patterns across API methods for predictability
   - Mock data should closely match the expected structure from the real API

## Reminders for Future Development

1. **Port Configuration**
   - **Always use standard ports**: 3000 for frontend, 8000 for backend
   - **Check if ports are in use** before starting servers: `lsof -i :3000` and `lsof -i :8000`
   - **Kill processes** using these ports if necessary: `kill -9 $(lsof -t -i:3000)` and `kill -9 $(lsof -t -i:8000)`
   - **Don't change port numbers in code**: If a different port is needed temporarily, use command-line arguments instead
   - **Verify CORS settings** when connecting frontend to backend to ensure proper communication

2. **Hydration Error Prevention**
   - Always use `'use client'` directive at the top of files with client-side code
   - Avoid `Math.random()`, `Date.now()`, and locale-specific formatting in server components
   - Use deterministic mock data when testing server-rendered components

3. **Branch Management**
   - Create dedicated branches for specific features (e.g., "upload", "altogether")
   - Commit changes with descriptive messages that explain the purpose of changes
   - Push changes regularly to ensure work is backed up

4. **HMA Integration**
   - Use only APIs and components that are compatible with hasher-matcher-actioner
   - Avoid creating separate APIs that duplicate existing functionality
   - Follow the existing patterns for content categories and hash algorithms

These reminders will help ensure smooth development and integration of future features. 