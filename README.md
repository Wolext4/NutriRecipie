# NutriRecipie

A responsive recipe manager built with React and JavaScript, a Node.js/Express API written in TypeScript, and MongoDB. Browse, search, and filter recipes; add your own recipes with a photo; view ingredients and directions; and create a shopping list.

## Live application

- Frontend: [https://nutri-recipie.vercel.app](https://nutri-recipie.vercel.app)
- Backend health check: [https://nutrirecipie.onrender.com/api/health](https://nutrirecipie.onrender.com/api/health)

## Features

- Responsive layouts for phones, tablets, and desktop computers
- Search recipes by name, description, or ingredient
- Browse recipes by category and filter by total preparation and cooking time
- Add, edit, and delete recipes
- Choose a photo from the device or capture one with a camera where supported
- Automatically resize selected photos before saving them with a recipe
- View recipe descriptions, ingredients, directions, servings, and preparation times
- Create and manage a shopping list from recipe ingredients
- Register and sign in with an email and password
- Manage private recipes while browsing public starter recipes as a guest
- Save the shopping list in the current browser

## Technology

| Part | Technology |
| --- | --- |
| Frontend | React, JavaScript/JSX, Vite |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB, Mongoose |
| Request validation | Zod |

## Project structure

```text
frontend/
  index.html
  src/
    main.jsx          React entry point
    App.jsx           Screens and application behavior
    RecipeForm.jsx    Add/edit recipe form and image picker
    api.js            Frontend API client
    styles.css        Application styles and responsive layouts
backend/
  src/
    index.ts          Express server and MongoDB connection
    middleware/auth.ts Bearer-token authentication
    models/User.ts    User account schema
    models/Recipe.ts  Mongoose recipe schema
    routes/auth.ts    Registration, login, and current-user routes
    routes/recipes.ts Recipe API routes and validation
```

## Run locally

### Requirements

- Node.js 20 or later
- MongoDB running locally, or a MongoDB Atlas connection string

### Start the backend

In PowerShell:

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Set `MONGODB_URI` in `backend/.env`. For a local MongoDB server, the example value is:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/recipe_manager
```

Also set `JWT_SECRET` to a random secret with at least 32 bytes. You can generate one with Node.js:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Keep the generated value private and store it only in `backend/.env` locally and in the backend host's environment settings in production.

Then start the API:

```powershell
npm run dev
```

The API runs at `http://localhost:5000`. Check its status at `http://localhost:5000/api/health`.

### Start the frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The frontend API URL defaults to `http://localhost:5000/api`. To override it, create `frontend/.env` and set:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

### Build checks

```powershell
cd backend
npm run build

cd ..\frontend
npm run build
```

## API

The backend API is mounted at `/api`.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | API and database connection status |
| `POST` | `/api/auth/register` | Register with a name, email, and password (minimum 8 characters) |
| `POST` | `/api/auth/login` | Sign in and receive a bearer token |
| `GET` | `/api/auth/me` | Get the signed-in account; requires a bearer token |
| `GET` | `/api/recipes` | List recipes; supports `search`, `category`, and `sort=name` query parameters |
| `GET` | `/api/recipes/categories` | List categories used by saved recipes |
| `GET` | `/api/recipes/:id` | Get one recipe |
| `POST` | `/api/recipes` | Create a private recipe; requires a bearer token |
| `PUT` | `/api/recipes/:id` | Update your own recipe; requires a bearer token |
| `DELETE` | `/api/recipes/:id` | Delete your own recipe; requires a bearer token |

### Authentication and recipe visibility

- Accounts use email and password. Passwords are hashed with Node.js `scrypt`; the API never stores the original password.
- Successful registration and login return a signed bearer token. The frontend stores that token in browser `localStorage` and sends it in the `Authorization` header.
- Tokens expire after seven days. Signing out removes the token from that browser.
- Public starter recipes are readable without an account. Newly created recipes are private to the account that created them.
- Existing recipe documents without ownership metadata are marked as public starter recipes when the backend starts, preserving the existing recipe collection.
- An account can edit or delete only recipes it owns. Public starter recipes are read-only.
- This is a school-project authentication flow, not a full identity-management system: it does not currently include email verification, password reset, or account deletion.

## Deployment

The frontend is hosted on Vercel and the backend API is hosted on Render. MongoDB Atlas provides the hosted database. Deploy the frontend and backend as separate services from this repository.

### Render backend

Create a Render **Web Service** connected to the repository with:

- **Root Directory:** `backend`
- **Runtime:** Node
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

Set these environment variables in the Render service settings:

| Key | Value |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas connection string, with `recipe_manager` as the database name |
| `CLIENT_ORIGIN` | Exact Vercel frontend origin, for example `https://nutri-recipie.vercel.app` |
| `JWT_SECRET` | A strong random secret used to sign login tokens |

Render provides `PORT` automatically. Do not commit database credentials or add them to this README. In MongoDB Atlas Network Access, allow the Render service's outbound IP ranges. Your personal development IP is separate and is needed only for connections from your own computer.

### Vercel frontend

Import the repository as a Vercel project with:

- **Root Directory:** `frontend`
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

Set this environment variable in Vercel, then deploy or redeploy:

| Key | Value |
| --- | --- |
| `VITE_API_URL` | `https://nutrirecipie.onrender.com/api` |

Recipe API imports are proxied through the backend. Set `RECIPE_API_KEY` privately in Render (and in `backend/.env` locally); never put this secret in a `VITE_*` variable or commit it. The Nutri screen can search Recipe API and authenticated users can save returned recipes to their private collection. Recipe API is read-only, so recipe generation is not currently supported.

Vite embeds `VITE_API_URL` into the frontend at build time, so a new deployment is required after changing it. If the frontend uses a different production domain, update Render's `CLIENT_ORIGIN` to that exact origin and redeploy the backend.

### MongoDB Atlas connection checklist

- Use a MongoDB **database user** for the application; this is separate from the Atlas website account.
- Keep the Atlas connection string in Render's environment settings, not in Git.
- Allow the Render service's outbound IP ranges in Atlas Network Access.
- The API health endpoint should return `{"status":"ok","database":"connected"}` after deployment.
- Recipe documents are stored in the configured Atlas database. A newly created Atlas database does not automatically include recipes from a developer's local MongoDB; export/import the collection if migrating existing data.

## Recipe photos and data storage

Selected photos are resized in the browser and stored as JPEG data with their recipe document in MongoDB. Image capture depends on browser and device support; the file picker remains available. Existing HTTP(S) image URLs are also supported. Starter recipe photos use Unsplash; see the [Unsplash License](https://unsplash.com/license).

Recipes are stored in MongoDB. Public starter recipes are shared for reading; recipes created by signed-in users are private to their owner. Shopping-list items are stored in browser `localStorage`, so they are specific to that browser and device.

## Security

- Never commit `.env` files, database passwords, or complete credential-bearing connection strings.
- Keep `JWT_SECRET` private and use a separate random value for each environment.
- If a database password is exposed, rotate it in Atlas and update the Render `MONGODB_URI` environment variable.
- Use a strong password for the Atlas database user and restrict network access to the required IP ranges where possible.
