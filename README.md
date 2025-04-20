# Sales Analytics Dashboard

A comprehensive dashboard for tracking sales analytics data, with frontend and backend components.

## Architecture

- **Frontend**: React application with TypeScript
- **Backend**: Node.js with Express
- **Database**: PostgreSQL on Render

## Deployment

### Backend

The backend is deployed on Render and available at:
https://sales-analytics-backend.onrender.com

### Frontend

The frontend is configured for deployment to GitHub Pages:

1. Create a GitHub repository for the project
2. Push the code to the repository
3. The GitHub Actions workflow will automatically deploy the frontend to GitHub Pages

## Local Development

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

## Environment Variables

### Backend

- `DATABASE_URL`: Database connection string
- `PORT`: Port for the server (default: 3001)
- `NODE_ENV`: Environment (development/production)

### Frontend

- `REACT_APP_API_URL`: URL of the backend API

## Deployment to GitHub Pages

1. Update the `homepage` field in `frontend/package.json` with your GitHub Pages URL:
   ```json
   "homepage": "https://yourusername.github.io/sales-analytics"
   ```

2. Push your code to GitHub
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/sales-analytics.git
   git push -u origin main
   ```

3. The GitHub Actions workflow will automatically deploy the app to GitHub Pages. 