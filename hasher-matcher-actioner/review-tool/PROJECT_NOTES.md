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
- Issues with importing `Review` from `models.py` were resolved
- PDQ Python module integration is working (path: `/Users/jsroost/ROOST/tx-sandbox/pdq/python`)
- PDQHasher is initialized successfully in routes.py

### Frontend
- Built with Next.js 15.2.1 using the App Router
- Components created:
  - Navigation bar
  - Layout component
  - Image card
  - Review actions
  - Match details
  - Dashboard with filter drawer
  - Tasks page with mock data
  - Reusable UI components (OldestTaskDisplay, PendingCountDisplay)
- Main landing page now redirects directly to the Dashboard
- Using local test images from `/public/test_images/` for development
- Mock data implemented for all components to allow testing without API dependencies
- Comprehensive unit tests added for utilities, hooks, and UI components

## Recent Updates

### 1. Local Test Images Implementation
- Copied test images from demo directory to frontend public folder
- Updated all mock data to use local image paths instead of external URLs
- Modified ImageCard component to handle local image paths correctly
- Eliminated 404 errors by avoiding API calls for images during development

### 2. Dashboard UI Redesign
- Implemented a tabular layout for queue display based on reference design
- Added a functional filter drawer system to filter queues by:
  - Content category
  - Hash algorithm
  - Escalated status
  - Sort order
- Added active filter display with badges showing current filter selections
- Improved visual accessibility with proper color contrast and labeling
- Moved hash algorithm from display to filters for cleaner presentation

### 3. Navigation Improvements
- Changed app title to "Content Moderation Tool"
- Updated navigation to include Dashboard, Tasks, and Review links
- Implemented direct landing on the dashboard without intermediate home page
- Added loading indicator for page transitions

### 4. Mock Data Flow
- Created consistent mock data implementation across all components
- Implemented `useMockData` function in review page
- Created `getMockTasks` function for the tasks page
- Added toast notifications when using mock data

### 5. Code Architecture Improvements
- Created utility modules for formatting and mock data
- Implemented custom hooks (useFilterState, useReviewState) for state management
- Developed reusable UI components for task durations and pending counts
- Updated API service with centralized mock data toggling
- Added comprehensive unit tests for all new components and utilities

### 6. Content Categories Update
- Changed content categories to use humorous alternatives:
  - "fowl_play" (suspicious chicken-related activities)
  - "wild_duckery" (questionable duck behavior)
  - "rotten_eggs" (egg-related offenses)
- Eliminated duplicate category queues
- Updated color schemes and descriptions for the new categories
- Made these changes to clearly indicate this is a demo application

### 7. UI Improvements
- Removed filter components from the review page
- Kept filtering functionality exclusive to the dashboard
- Simplified the review page UI to focus on content evaluation
- Fixed a positioning issue with the 'use client' directive in Tasks page

### 8. Review Tool Demo Enhancements (March 2024)
- Added task state management with three key states:
  - pending (unreviewed tasks)
  - reviewed (tasks with approve/reject/escalate action)
  - escalated (tasks requiring special handling)
- Fixed queue display to ensure only ONE queue per content category
- Modified content category descriptions:
  - Removed "humor" reference from fowl_play category
  - Updated rotten_eggs description to remove breakfast references
- Added a Reset Demo button (green) for clearing all task states 
- Fixed button spacing with proper ButtonGroup component
- Increased task counts (25-75 tasks per category) for substantial demos
- Improved UI with consistent button styling:
  - Filter button now has purple filled style
  - Removed unnecessary Create Queue button
- Set image publish dates to align with task ages
- Made similar content section open task details in new tab

### 9. Additional UI and State Management Enhancements (March 2024)
- Implemented persistent state tracking across pages using localStorage
- Fixed task count display to properly show all 13 tasks distributed across categories
- Added automatic state updates when tasks are completed (removed from pending counts)
- Improved reset functionality to properly restore tasks to pending state
- Made descriptive IDs for matches with tooltips explaining their purpose
- Removed redundant metadata display from image cards
- Implemented proper formatting for category names in match details
- Fixed hover effects on queue cards to prevent unintended color changes
- Ensured consistency between task counts in review tool and dashboard

### 10. Batch Image Processing Feature (March 2024)
- Added a new tab to the dashboard for batch processing multiple images
- Implemented file upload functionality with support for multiple images
- Created an interface to select hash algorithms to apply to uploaded images
- Added mock processing with deterministic results to demonstrate matching
- Displayed comprehensive results with category, algorithm and match information
- Implemented "View in Queue" button to link processed images to their respective review queues
- Integrated with existing QueueAPI rather than creating a separate HashAPI
- Made the component client-side only to avoid hydration errors
- Removed category selection requirement to simplify the user experience

## Issues Encountered

### 1. Chakra UI Integration Issues

#### Problem:
- Error when importing `extendTheme` from `@chakra-ui/react`:
  ```
  Export extendTheme doesn't exist in target module
  ```

#### Root Cause:
- Initially suspected the issue was due to using Chakra UI v3.11.0 where `extendTheme` was moved to a different package
- Attempted to import from `@chakra-ui/theme` and `@chakra-ui/theme-utils`
- After further investigation, the actual issue is that Next.js 15's App Router uses React Server Components, and `extendTheme` is a client-side function that can't be called directly in server components

#### Solutions Attempted:
1. Tried importing `extendTheme` from various Chakra UI packages:
   - `@chakra-ui/react`
   - `@chakra-ui/theme`
   - `@chakra-ui/theme-utils`
   
2. Downgraded from Chakra UI v3.11.0 to v2.8.0 for better compatibility

3. Created a client component wrapper (`src/app/components/ChakraProvider.tsx`) with the `'use client'` directive to handle theme creation on the client side

4. Updated `layout.tsx` to use the client component wrapper

### 2. PDQ Module Integration

#### Problem:
- Initially encountered issues with the `pdqhash` module installation
- User emphasized the importance of using the existing PDQ implementation from the codebase

#### Solution:
- Successfully added the PDQ Python module to the path 
- Confirmed that PDQHasher was initialized correctly in `routes.py`

### 3. Backend Model Import Errors

#### Problem:
- ImportError: cannot import name 'Review' from 'models'

#### Solution:
- The issue was resolved, and the server is now running without errors
- "PDQ hasher initialized successfully in routes.py"

### 4. Port Management

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

### 5. Image Loading and 404 Errors

#### Problem:
- The application was trying to load images through API endpoints that don't exist
- This resulted in 404 errors for URLs like `/api/images/3/data`

#### Solution:
- Modified the ImageCard component to use image URLs directly instead of trying to construct API URLs
- Implemented direct paths to local test images in the public folder
- Added proper handling for URLs that start with "/" to avoid API calls

### 6. 'use client' Directive Placement Issues

#### Problem:
- Encountered an error with the Tasks page:
  ```
  The "use client" directive must be placed before other expressions.
  ```

#### Solution:
- Moved the 'use client' directive to the very top of the file, before any other code
- Ensured that all client components have the directive properly positioned
- Added validation checks to prevent similar issues in other components

### 7. Circular Dependencies in React Hooks

#### Problem:
- Encountered an error: "Cannot access 'useMockData' before initialization"
- This occurred because a function reference was included in a dependency array before it was defined

#### Root Cause:
- The issue happened due to a naming conflict between:
  - An imported constant `useMockData` from api.ts
  - A locally defined callback function also named `useMockData`
- When the local function tried to reference itself in a dependency array, it created a circular dependency

#### Solution:
- Renamed the local function to `loadMockData` to avoid the naming conflict
- Ensured proper order of function definitions to prevent circular references
- Added comments to highlight the reason for the name change

### 8. Task Count Synchronization Issues

#### Problem:
- Dashboard was showing fixed/hardcoded task counts regardless of actual state
- Completed tasks weren't being reflected in the dashboard view when returning from the review page
- Reset functionality didn't properly restore tasks to pending state

#### Root Cause:
- Dashboard was using hardcoded counts based on indices instead of actual data
- No state persistence mechanism between pages to track task completions
- No proper tracking of which tasks belonged to which category

#### Solution:
- Implemented localStorage to persist task state across different pages:
  - `completedTasks` array to track which tasks have been completed
  - `dashboardStats` object to track counts by category
- Updated dashboard to display actual task counts from localStorage
- Modified the reset function to properly clear all stored state
- Added initialization logic to set up proper counts when first loading

### 9. UI Consistency and Layout Issues

#### Problem:
- Redundant metadata display showing the same information twice
- Inconsistent formatting of category names in different parts of the app
- Queue items changed color on hover, creating an unintended UI effect

#### Root Cause:
- Multiple components displaying the same metadata independently
- Lack of shared formatting utilities across components
- CSS hover effect added to table rows without being requested

#### Solution:
- Removed duplicate metadata display from ImageCard component
- Added a `formatCategory` utility function to standardize category name display
- Removed the hover effect on queue items in the dashboard
- Made match/reference IDs more descriptive with tooltips explaining their purpose

### 10. Next.js Hydration Errors with Client-Side Components

#### Problem:
- Encountered hydration errors when implementing the batch image processing feature:
  ```
  Hydration failed because the server rendered HTML didn't match the client
  ```
- This occurred because the component was using non-deterministic functions like `Math.random()` and `Date.now()`

#### Root Cause:
- Next.js performs server-side rendering first, generating HTML with initial values
- When the client then tries to hydrate this HTML, any non-deterministic functions produce different values
- The mismatch between server and client renders causes hydration failures

#### Solutions:
1. Made the component client-only using the `dynamic` import with `{ ssr: false }`:
   ```typescript
   const BatchHashCheck = dynamic(
     () => import('../components/dashboard/BatchHashCheck'),
     { ssr: false }
   );
   ```

2. Created a dedicated client component file with the `'use client'` directive at the top

3. Used conditional rendering to only render the component on the client side:
   ```typescript
   {isClient && (
     <BatchHashCheck 
       // props
     />
   )}
   ```

4. Made non-deterministic operations deterministic by:
   - Using deterministic values based on index instead of random numbers
   - Using fixed string formats instead of locale-dependent date formatting
   - Avoiding direct use of `Date.now()` in component rendering

### 11. API Design Considerations and Integration

#### Problem:
- Initially created a separate `HashAPI` for the batch processing feature, which didn't align with the HMA architecture
- This approach introduced unnecessary complexity and potential maintenance issues

#### Solution:
- Integrated the new functionality into the existing `QueueAPI` instead
- Added a new `submitBatchImages` method to maintain consistent API design
- Ensured the implementation followed the same patterns as other API methods
- Used simulated mock data that matches the expected structure from HMA

## User Feedback & Requirements

1. The user expressed a preference for using Chakra UI for the HMA Review Tool UI framework

2. The user emphasized the importance of the `pdqhash` package for testing:
   - "Removing `pdqhash` could hinder testing efforts"
   - Preferred to use the existing PDQ functionality from the codebase rather than creating a dummy implementation

3. The user shared error messages and logs to help troubleshoot issues

4. The user has been actively involved in testing and providing feedback on implementation challenges

5. The user prefers not to hardcode configuration values like port numbers in config files

6. The user requested a dashboard layout similar to a reference moderation dashboard design:
   - Tabular view of moderation queues
   - Easily accessible "Start Reviewing" buttons
   - Clean, accessible design with proper contrast

7. The user requested that the content categories be updated to clearly indicate this is a demo app:
   - Changed to humorous bird-themed categories 
   - Requested that filter UI only appear on the dashboard, not on the review page

## Next Steps

### Frontend
1. Continue refining UI based on user feedback
2. Implement additional features for the review process
3. Prepare for API integration when backend is ready
4. Run and fix any failing unit tests

### Backend
1. Ensure all API endpoints are functioning properly
2. Test the complete flow from frontend to backend
3. Verify the queue system's functionality

### Testing
1. Continue building out the test suite for full coverage
2. Test the complete flow from the dashboard to the review page
3. Verify PDQ hash computation and matching functionality
4. Test the review actions (approve, reject, escalate, skip)

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

2. **Shared Styling Challenges**
   - **Problem**: Inconsistent styling between components and poor visibility in dark mode
   - **Solution**: Implemented `useColorModeValue` hooks consistently and created color utilities for badges
   - **Lesson**: Plan for both light and dark themes from the beginning with a consistent approach

3. **UI Accessibility Oversights**
   - **Problem**: Initial dashboard design had poor contrast and hard-to-read text, especially for content labels
   - **Solution**: Added proper color contrast, increased font weights, and used badges to improve visual hierarchy
   - **Lesson**: Prioritize accessibility alongside aesthetics from the beginning of UI development

4. **Mock Data Inconsistencies**
   - **Problem**: Different components used different mock data formats, causing unexpected behaviors
   - **Solution**: Standardized mock data functions across components and added proper typing
   - **Lesson**: Create consistent mock data utilities early in the development process

5. **Client/Server Component Confusion**
   - **Problem**: Encountered issues with 'use client' directive placement and client-side operations in server components
   - **Solution**: Created clear separation and proper directive placement in all components
   - **Lesson**: Understand Next.js's App Router architecture and client/server boundaries before starting development

6. **Test-Driven Component Development**
   - **Problem**: Initial components lacked test coverage and had implicit assumptions about behavior
   - **Solution**: Implemented comprehensive tests for utilities, hooks, and components
   - **Lesson**: Writing tests helps clarify component behavior and requirements, reducing bugs and refactoring complexity

### Development Strategies for Future Projects

1. **Frontend Development Without Backend Dependencies**
   - Use local resources (images, data files) instead of expecting API endpoints during initial development
   - Implement toggles to easily switch between mock and real data
   - Create dedicated mock data generators that match API response formats

2. **UI Component Design**
   - Start with accessibility as a requirement, not an afterthought
   - Implement filter systems in dedicated drawers/modals rather than cluttering main views
   - Use color-coding systems consistently across the application
   - Show active filters visually to improve user understanding of current view

3. **Next.js App Router Best Practices**
   - Keep client-side functionality clearly separated with 'use client' directives at the top of files
   - Consider server-side vs. client-side rendering implications early in component design
   - Use layout components strategically to avoid duplicate code
   - Implement page transitions and loading states for better user experience

4. **Collaborative Development Process**
   - Frequent feedback cycles with visual references helped align expectations
   - Small, focused commits with descriptive messages improved project tracking
   - Maintaining detailed project notes facilitated knowledge sharing

5. **Testing Best Practices**
   - Write tests for normal cases, edge cases, and invalid inputs
   - Mock dependencies to isolate components under test
   - Test hooks with `renderHook` and UI components with `render` from testing-library
   - Use test-driven development for critical functionality

These insights will be valuable for future development work on this and other projects. 

### Next.js Hydration with Server Components
- Avoid non-deterministic functions in components that are server-rendered
- Use the `'use client'` directive for components with browser-only APIs
- Consider using `dynamic` imports with `ssr: false` for components that can't be hydrated properly

### API Design Principles
- Extend existing APIs rather than creating new ones when adding related functionality
- Maintain consistent patterns across API methods for predictability
- Mock data should closely match the expected structure from the real API

### UI/UX Improvements
- Simplify the user interface by removing unnecessary steps (like category selection)
- Provide clear feedback during async operations (loading states, toasts)
- Ensure responsive design works across different device sizes

### Code Organization
- Separate client-side logic into dedicated files with clear naming
- Use TypeScript interfaces to ensure type safety across component boundaries
- Share utility functions like color selectors across components

### Hydration Error Prevention
- Always use `'use client'` directive at the top of files with client-side code
- Avoid `Math.random()`, `Date.now()`, and locale-specific formatting in server components
- Use deterministic mock data when testing server-rendered components

### Branch Management
- Create dedicated branches for specific features (e.g., "upload", "altogether")
- Commit changes with descriptive messages that explain the purpose of changes
- Push changes regularly to ensure work is backed up

### Testing Considerations
- Test both with and without mock data to ensure API integration works correctly
- Check UI responsiveness across different screen sizes
- Verify that state persists correctly between page navigations

### HMA Integration
- Use only APIs and components that are compatible with hasher-matcher-actioner
- Avoid creating separate APIs that duplicate existing functionality
- Follow the existing patterns for content categories and hash algorithms

## Reminders for Future Development

1. **Hydration Error Prevention**
   - Always use `'use client'` directive at the top of files with client-side code
   - Avoid `Math.random()`, `Date.now()`, and locale-specific formatting in server components
   - Use deterministic mock data when testing server-rendered components

2. **Branch Management**
   - Create dedicated branches for specific features (e.g., "upload", "altogether")
   - Commit changes with descriptive messages that explain the purpose of changes
   - Push changes regularly to ensure work is backed up

3. **Testing Considerations**
   - Test both with and without mock data to ensure API integration works correctly
   - Check UI responsiveness across different screen sizes
   - Verify that state persists correctly between page navigations

4. **HMA Integration**
   - Use only APIs and components that are compatible with hasher-matcher-actioner
   - Avoid creating separate APIs that duplicate existing functionality
   - Follow the existing patterns for content categories and hash algorithms

These reminders will help ensure smooth development and integration of future features. 