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

## Recent Changes and Learnings

### Event Registration and Data Handling

#### Problems Encountered
1. Registration data access error
   - Error: `TypeError: e.registrations is undefined`
   - Root cause: Attempting to access registrations without proper table joins and null checks
   - Impact: Broke the org dashboard view after event registration

2. Event creation schema mismatch
   - Previous schema used day_of_week but database expects proper date field
   - Missing fields in event creation form compared to database schema

#### Solutions Implemented
1. Fixed registration data handling:
   - Updated Supabase query to properly join registrations table:
   ```typescript
   .select('*, registrations:registrations(user:profiles(email, name), status)')
   ```
   - Added null checks and default empty arrays for registrations
   - Improved error handling for missing user data

2. Updated event creation form:
   - Replaced day_of_week with proper date field
   - Added missing fields: commitment, duration, recurring, image
   - Improved date/time handling with proper timezone consideration
   - Added validation for required fields

#### Key Learnings
1. Data Relationships:
   - Always verify table relationships before accessing nested data
   - Use proper joins in Supabase queries to get related data
   - Implement null checks for optional relationships

2. Schema Evolution:
   - Keep form fields in sync with database schema
   - Use TypeScript interfaces to enforce schema compliance
   - Document schema changes and their impact

3. Best Practices:
   - Always transform data before setting state to ensure consistent structure
   - Use defensive programming with null checks and default values
   - Implement proper error boundaries and user feedback
   - Consider timezone handling in date/time fields

#### Future Considerations
1. Data Integrity:
   - Consider implementing database constraints for required fields
   - Add validation rules at the database level
   - Implement proper cascading deletes for related data

2. Performance:
   - Monitor query performance with joined tables
   - Consider pagination for large datasets
   - Implement caching for frequently accessed data

3. User Experience:
   - Add loading states for data fetching
   - Improve error messages and recovery flows
   - Consider optimistic updates for better responsiveness

### Event Query and Data Structure Issues

#### Problems Encountered
1. Events not showing in organization dashboard
   - Root cause: Querying `events_with_counts` view instead of base `events` table
   - Impact: Organization's created events were not visible in their dashboard
   - Additional complexity: View might not have included all necessary fields

2. Data structure mismatches
   - Interface didn't match actual database schema
   - Missing fields in TypeScript interface
   - Incorrect assumptions about nullable fields

#### Solutions Implemented
1. Fixed event querying:
   - Switched from view to base table query:
   ```typescript
   .from('events')
   .select(`
     *,
     registrations:registrations(
       user:profiles(email, name),
       status
     )
   `)
   ```
   - Added proper logging for debugging
   - Calculate participant count in the transform function

2. Updated data structures:
   - Added all fields from database schema to interface
   - Made nullable fields explicit in types
   - Added proper handling for optional relationships
   - Improved type safety throughout the component

#### Key Learnings
1. Database Structure:
   - Views may not always include all necessary fields
   - Base tables should be queried when full data access is needed
   - Document view definitions and their purposes

2. Type Safety:
   - Keep interfaces in sync with database schema
   - Make nullable fields explicit in TypeScript
   - Add proper null checks in component logic

3. Data Transformation:
   - Transform data immediately after fetching
   - Calculate derived fields consistently
   - Document data transformation logic

#### Future Considerations
1. Database Views:
   - Consider creating specific views for different use cases
   - Document view purposes and limitations
   - Add tests for view queries

2. Type Generation:
   - Consider using Supabase's type generation
   - Keep type definitions in a central location
   - Add validation for data transformations

3. Error Handling:
   - Add more detailed error logging
   - Improve error messages for users
   - Consider adding error boundaries

### Events View and Registration Data Structure

#### Problems Encountered
1. Events not showing in organization dashboard
   - Root cause: Using wrong data source (base events table instead of events_with_registrations view)
   - Impact: Missing registration data and incorrect data structure
   - Additional complexity: Flattened view structure vs nested JSON

2. Data structure mismatches
   - Previous interface assumed nested registration data
   - View provides flattened data with registration fields at root level
   - Multiple rows per event (one per registration)

#### Solutions Implemented
1. Updated data source:
   - Switched to `events_with_registrations` view:
   ```typescript
   .from('events_with_registrations')
   .select('*')
   .eq('organizer_id', user.id)
   ```
   - Added proper data transformation to handle flattened structure
   - Implemented grouping logic to combine multiple registrations

2. Improved data handling:
   - Created separate interfaces for event and registration data
   - Added proper null handling for optional fields
   - Implemented grouping logic to reconstruct relationships:
   ```typescript
   const eventMap = new Map<string, EventWithRegistrations & { registrations: EventRegistration[] }>()
   eventsData?.forEach((event: EventWithRegistrations) => {
     if (!eventMap.has(event.id)) {
       eventMap.set(event.id, { ...event, registrations: [] })
     }
     if (event.registration_id) {
       eventMap.get(event.id)!.registrations.push({
         registration_id: event.registration_id,
         registration_status: event.registration_status,
         user_id: event.user_id,
         user_email: event.user_email,
         user_name: event.user_name
       })
     }
   })
   ```

#### Key Learnings
1. View Structure:
   - Database views can provide flattened data structures
   - Need to transform flattened data back to nested structure for UI
   - Consider data shape when designing interfaces

2. Data Relationships:
   - Views can duplicate event data for each registration
   - Need to group data by event ID to reconstruct relationships
   - Consider memory usage with large datasets

3. Type Safety:
   - Make all fields from view explicit in interface
   - Handle null values appropriately
   - Document data transformation logic

#### Future Considerations
1. Performance:
   - Monitor memory usage with large datasets
   - Consider pagination for events with many registrations
   - Cache transformed data structure

2. Data Consistency:
   - Add validation for transformed data
   - Consider adding error boundaries
   - Add loading states during transformation

3. Code Organization:
   - Move data transformation logic to utility functions
   - Add unit tests for transformation logic
   - Document view structure and transformation process

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