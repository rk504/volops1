# Cursor Memory File

## Project Architecture

### Frontend Framework
- Next.js 14.2.23
- React with TypeScript
- Client-side components marked with 'use client'

### UI Components
- Custom UI components in `app/components/ui/*`
- Shadcn/ui for base components
- Header component for navigation
- Dynamic map components for location selection

### Authentication & Database
- Supabase for authentication and database
- User sessions managed through AuthContext
- Row Level Security (RLS) policies implemented

### Routing & API
- Next.js App Router for page routing
- Netlify Functions for API endpoints
- API routes moved from Next.js to Netlify Functions

### Map Integration
- Leaflet for maps with OpenStreetMap
- Client-side only rendering to avoid SSR issues
- Components:
  - `Map.tsx`: Base map component
  - `DynamicMap.tsx`: Dynamic wrapper for SSR compatibility
  - Location search using OpenStreetMap's Nominatim service

## What Has Worked Well

### Architecture Decisions
1. Moving from Google Maps to OpenStreetMap/Leaflet
   - Eliminated API key requirements
   - Simplified deployment
   - Free tier suitable for our needs

2. Using Netlify Functions instead of Next.js API routes
   - Better handling of authentication
   - Simplified deployment process
   - More reliable in production

3. Implementing client-side-only components
   - Solved SSR issues with interactive components
   - Better user experience with loading states
   - Cleaner error handling

4. Database Design
   - Views for computed fields (participant counts)
   - RLS policies for security
   - Clear separation of concerns in table structure

### Development Practices
1. Using TypeScript for type safety
2. Implementing proper error handling and user feedback
3. Breaking down complex components into smaller, focused ones
4. Using dynamic imports for client-side components

## What Hasn't Worked

### Architecture Issues
1. Initial attempt at using Next.js API routes
   - Authentication issues in production
   - Complicated deployment process
   - Hard to debug in Netlify environment

2. Direct use of Leaflet without SSR consideration
   - Caused "window is not defined" errors
   - Required multiple refactoring iterations
   - Initial implementation was too tightly coupled

3. Database Challenges
   - Multiple RLS policies causing conflicts
   - Initial participant counting implementation was inefficient
   - Duplicate unique constraints causing registration issues

### Development Pain Points
1. Using `@` aliases in imports
   - Caused build failures in Netlify
   - Required switching to relative imports
   - Inconsistent behavior between dev and prod

2. Initial registration system
   - Separate endpoints for register/deregister were overcomplicated
   - Simplified to single toggle endpoint
   - Better handling of registration states

3. Environment Variables
   - Initial setup didn't account for all deployment needs
   - Required multiple deployments to get right
   - Some variables were missing in production

## Lessons Learned

### Best Practices
1. Always consider SSR implications when using browser APIs
2. Use dynamic imports with `ssr: false` for interactive components
3. Implement proper loading states and error boundaries
4. Test deployment early and often
5. Keep database queries simple and efficient
6. Use views for computed fields instead of triggers
7. Implement proper error handling on both client and server

### Future Considerations
1. Consider implementing proper test coverage
2. Plan for scaling database operations
3. Document API endpoints and database schema
4. Consider implementing monitoring and logging
5. Plan for backup and recovery procedures

## Recent Changes
- Implemented organization event creation
- Added map integration for location selection
- Moved API routes to Netlify Functions
- Fixed SSR issues with map components
- Added success dialogs and form validation
- Simplified location input to use ZIP codes
- Fixed import path issues in Netlify builds

## Recent Issues and Resolutions

### Import Path Resolution (2024-03-xx)
1. Problem:
   - Build failed in Netlify due to `@/components/Header` import path
   - Error: "Module not found: Can't resolve '@/components/Header'"
   - Part of ongoing issues with `@` alias imports in production

2. Solution:
   - Replaced `@/components/Header` with relative path `../../../components/Header`
   - Maintains consistency with previous fixes for alias imports
   - Follows pattern documented in "Development Pain Points"

3. Lessons Reinforced:
   - Always use relative imports for component paths
   - Test builds before deployment
   - Keep import patterns consistent across the codebase
   - Consider documenting a style guide for imports

### Future Considerations
1. Import Path Standardization:
   - Consider using a path alias configuration that works in all environments
   - Document import conventions for the team
   - Add path resolution tests to CI/CD pipeline
   - Consider using TypeScript path mappings with proper build configuration 