# Anuraj Store — Start Phase 1

## Backend (PowerShell)
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload

## Frontend (new terminal)
cd frontend
npm install
npm run dev

Open http://localhost:5173

## MongoDB
Make sure MongoDB is running locally, or change MONGODB_URL in backend/.env to your MongoDB Atlas connection string.

## Next
Google/Apple OAuth credentials, forgot-password email/OTP, product APIs, cart, orders, payments and admin dashboard will be added in the next phases.
