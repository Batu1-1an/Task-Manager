# Plan to Add Sign-in and Sign-up Functionality

This document outlines the plan to integrate sign-in and sign-up functionality into the Notion-style Todo App using Supabase authentication.

Based on the current project structure (`index.html`, `script.js`, `style.css`) and the existing Supabase client initialization in `script.js`, the authentication logic will be primarily implemented on the frontend, interacting directly with the Supabase Auth API. The `server.js` is currently used for AI suggestions and will not be modified for authentication.

**Goal 1: Add HTML Structure for Authentication Forms**
- Add a new `div` element in `index.html` that will contain the sign-up and sign-in forms. This `div` will initially be hidden.
- Inside this `div`, create two `<form>` elements: one for sign-up and one for sign-in.
- Each form will include input fields for email and password, and a submit button.
- Add links or buttons to switch between the sign-up and sign-in forms.

**Goal 2: Add CSS Styles for Authentication Forms**
- Add styles to `style.css` for the new authentication `div`, forms, input fields, and buttons to match the existing Notion-style theme.
- Include a CSS class (e.g., `.hidden`) to control the visibility of the authentication `div` and the main application content.

**Goal 3: Implement Authentication Logic in `script.js`**
- Get references to the new form elements, input fields, and buttons.
- Add event listeners to the `submit` event of both the sign-up and sign-in forms. Prevent the default form submission.
- Create an asynchronous function `handleSignUp` that reads email and password from the sign-up form inputs and calls `supabase.auth.signUp({ email, password })`.
- Create an asynchronous function `handleSignIn` that reads email and password from the sign-in form inputs and calls `supabase.auth.signInWithPassword({ email, password })`.
- Implement basic error handling for both functions (e.g., displaying an alert with the error message).
- Add a sign-out button (perhaps in the user profile area) and an event listener that calls `supabase.auth.signOut()`.
- Implement a listener for authentication state changes using `supabase.auth.onAuthStateChange((event, session) => { ... })`. This listener will:
    - If `event` is 'SIGNED_IN', hide the authentication forms and show the main application content. Also, load user-specific data (todos, goals, templates).
    - If `event` is 'SIGNED_OUT', hide the main application content and show the authentication forms. Clear any user-specific data from memory.
- Modify existing data loading (`loadTodos`, `loadGoals`, `loadTemplates`) and saving (`handleAddTodo`, `saveTaskDetails`, `handleAddGoal`, `markGoalComplete`, `deleteGoal`, `saveTemplate`, `deleteTemplate`) functions to include the `user_id` from the current session when interacting with Supabase. This will require updating your Supabase database schema and Row Level Security (RLS) policies later, but for now, we'll focus on passing the `user_id` in the application logic.

**Goal 4: Initial Load and UI State Management**
- On the initial page load (inside the `DOMContentLoaded` listener), check the current authentication state using `supabase.auth.getSession()`.
- Based on the initial session state, either show the authentication forms or the main application content and load the relevant data.

**Authentication Flow Diagram**

```mermaid
graph TD
    A[Page Load] --> B{Check Auth State};
    B -- No Session --> C[Show Auth Forms];
    B -- Session Exists --> D[Show Main App & Load User Data];
    C -- User Submits Sign Up/In Form --> E[Call Supabase Auth API];
    E -- Success --> F[Supabase Auth State Change Event];
    E -- Failure --> C;
    F -- event = 'SIGNED_IN' --> D;
    F -- event = 'SIGNED_OUT' --> C;
    D -- User Clicks Sign Out --> G[Call Supabase Sign Out API];
    G --> F;