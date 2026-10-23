# NutriRecipie — Recipe manager

A mobile-first recipe app built with React and JavaScript, a Node.js/TypeScript API, and MongoDB. Browse recipes by category, search by name or ingredient, apply filters, manage your own recipes, and make a shopping list from recipe ingredients. This project is set up for local development only; it has not been deployed.

## Requirements

- Node.js 20 or later
- MongoDB running locally, or a MongoDB connection string

## Run the API

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Set `MONGODB_URI` in `backend/.env` to your MongoDB connection string, then:

```powershell
npm run dev
```

The API runs at `http://localhost:5000`. Health check: `http://localhost:5000/api/health`.

## Run the frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The frontend is JavaScript/JSX (not TypeScript) and uses `http://localhost:5000/api` by default. The responsive interface fills mobile screens and adapts to tablet and desktop widths with wider recipe grids and desktop navigation. To use another API URL, set `VITE_API_URL` in a frontend `.env` file, for example:

Recipe photos can be selected from the device or captured with a camera where the browser supports it. The frontend resizes selected images to JPEG before sending them to the API, which stores the image data with the recipe in MongoDB; existing image URLs are also supported. Starter recipe photos are served by Unsplash and cropped to fill the app's recipe cards; see the [Unsplash License](https://unsplash.com/license).

```dotenv
VITE_API_URL=http://localhost:5000/api
```

## API routes

| Method | Route | Description |
| --- | --- | --- |
| GET | `/api/recipes` | List recipes; supports `search`, `category`, and `sort=name` query parameters |
| GET | `/api/recipes/categories` | List categories used by saved recipes |
| GET | `/api/recipes/:id` | Get one recipe |
| POST | `/api/recipes` | Create a recipe |
| PUT | `/api/recipes/:id` | Update a recipe |
| DELETE | `/api/recipes/:id` | Delete a recipe |
| GET | `/api/health` | API and database status |
