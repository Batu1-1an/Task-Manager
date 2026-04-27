# User Profile Settings Implementation Plan

**Goal:** Allow users to change their display name and password using Supabase authentication.

**Current State:**
*   A placeholder `alert('User profile settings coming soon!');` exists in `script.js` (line 723), triggered by clicking an element with class `.user-profile`.
*   The project uses `@supabase/supabase-js` for authentication and database interactions directly from the frontend (`script.js`).
*   The backend uses `express`, but likely doesn't handle user updates directly.

**Proposed Plan:**

**Phase 1: Planning & Design (Complete)**

1.  **Define UI:**
    *   Replace the `alert()` in `script.js` with logic to show a dedicated settings section or modal.
    *   Add UI structure to `index.html` (e.g., a modal div).
    *   Style the UI using `style.css`.
    *   UI Components:
        *   Input field for "Display Name" (pre-filled).
        *   Input field for "New Password".
        *   Input field for "Confirm New Password".
        *   "Save Changes" button.
        *   "Cancel" or "Close" button.
2.  **Define Logic (`script.js`):**
    *   **Open Settings:** On `.user-profile` click:
        *   Fetch current user data: `supabase.auth.getUser()`.
        *   Populate "Display Name" field (e.g., from `user.user_metadata.display_name`).
        *   Display the settings UI.
    *   **Save Changes:** On "Save Changes" click:
        *   Get input values.
        *   **Validation:**
            *   Check if "New Password" and "Confirm New Password" match (if filled).
            *   *(Optional: Add password complexity rules if desired).*
        *   **Supabase Update:** Call `supabase.auth.updateUser()`:
            *   Include `password` if valid and filled.
            *   Include `data: { display_name: newDisplayName }` if name changed.
        *   **Feedback:** Show success/error messages. Close UI on success.
3.  **Backend (Supabase):**
    *   No changes needed in `server.js`.
    *   Assumes default Supabase setup allows updating `user_metadata`.

**Phase 2: Implementation (Requires switching to Code mode)**

1.  Modify `index.html` to add the settings UI structure.
2.  Modify `style.css` to style the new UI.
3.  Modify `script.js`:
    *   Implement show/hide logic for the UI.
    *   Implement user data fetching and form population.
    *   Implement "Save Changes" logic (validation, `supabase.auth.updateUser()` call).
    *   Replace the `alert()` with the UI opening logic.

**Flow Diagram:**

```mermaid
graph TD
    A[User Clicks Profile Icon] --> B{Fetch User Data (supabase.auth.getUser)};
    B --> C{Display Settings UI (Modal/Section)};
    C -- User Edits --> D[Input Fields (Name, Password)];
    D -- User Clicks Save --> E{Validate Input};
    E -- Valid --> F{Update Supabase (supabase.auth.updateUser)};
    E -- Invalid --> G[Show Validation Error];
    F -- Success --> H[Show Success Message & Close UI];
    F -- Error --> I[Show Supabase Error];
    C -- User Clicks Cancel --> J[Close UI];