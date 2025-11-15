# Vercel Backend Test

Minimal Vercel serverless backend that uses the OpenAI Assistants Threads API to preserve conversation history per mobile number.

## Environment Variables
- `OPENAI_API_KEY` – OpenAI API key with Assistants access.
- `OPENAI_ASSISTANT_ID` – Identifier of an Assistant configured to use the `gpt-4o-mini` model.

## API Routes
- `POST /api/start-session` → body `{ "mobile": "7990405600" }` creates or returns a thread ID for the mobile number.
- `POST /api/chat` → body `{ "mobile": "7990405600", "message": "Hello" }` appends the message to the existing thread and returns the assistant reply.
- `POST /api/upload-file` → placeholder endpoint for upcoming file uploads.

All routes are CORS enabled for local frontends running on `http://127.0.0.1:5500`.

## Deploy Steps
1. Push this folder to GitHub.
2. Visit https://vercel.com/new and import the repository.
3. Set the environment variables above in the Vercel project settings.
4. Deploy to obtain endpoints such as:
   - https://yourproject.vercel.app/api/start-session
   - https://yourproject.vercel.app/api/chat
   - https://yourproject.vercel.app/api/upload-file
