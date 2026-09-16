# Advanced Authentication

Added:
- Email + password registration/login
- Mobile + password login
- Forgot password OTP
- OTP expiration (10 minutes)
- Password reset
- Protected customer profile
- Customer dashboard
- Google/Apple UI placeholders

## Start
Backend:
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload

Frontend:
cd frontend
npm install
npm run dev

Open http://localhost:5173

## OTP warning
For development the forgot-password endpoint returns `dev_otp` so you can test locally.
DO NOT return OTP in production. Connect an email/SMS provider and remove `dev_otp` from the response.

## Google/Apple
Create OAuth/OpenID credentials with Google Cloud Console and Apple Developer, then implement callback/token verification on the FastAPI backend. Never trust profile data supplied only by the browser.
