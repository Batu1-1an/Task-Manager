# Task Manager Application

A web-based application for managing your daily tasks, featuring integration with Google Generative AI for enhanced productivity (e.g., task suggestions, summarization - *adjust based on actual AI features*).

## Features

*   Create, Read, Update, and Delete (CRUD) tasks.
*   Mark tasks as complete/incomplete.
*   User authentication (via Supabase).
*   AI-powered features (*specify actual features here*).
*   Simple and intuitive user interface.

## Tech Stack

*   **Frontend:** HTML, CSS, Vanilla JavaScript
*   **Backend:** Node.js, Express.js
*   **Database & Auth:** Supabase
*   **AI:** Google Generative AI API

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Batu1-1an/Task-Manager.git
    cd Task-Manager
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    *   Create a `.env` file in the root directory.
    *   Add the following variables, replacing the placeholder values with your actual credentials:
        ```env
        SUPABASE_URL=YOUR_SUPABASE_URL
        SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
        GOOGLE_API_KEY=YOUR_GOOGLE_GENERATIVE_AI_API_KEY
        PORT=3000 # Or any port you prefer
        ```
    *   You can find your Supabase URL and Anon Key in your Supabase project settings.
    *   You need to obtain an API key from Google AI Studio for the Generative AI features.

4.  **Run the application:**
    ```bash
    npm start
    ```

5.  **Access the application:**
    Open your web browser and navigate to `http://localhost:3000` (or the port you specified in `.env`).

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for bugs, feature requests, or improvements.

## License

[Specify License Here - e.g., MIT] (If you don't have one, you can omit this section or choose one like MIT).