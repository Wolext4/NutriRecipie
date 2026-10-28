const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const AUTH_TOKEN_KEY = "nutrirecipie-auth-token";

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token) {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  else localStorage.removeItem(AUTH_TOKEN_KEY);
}

async function request(path, options = {}) {
  let response;
  try {
    const token = getAuthToken();
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    });
  } catch {
    throw new Error("Can't reach the recipe server. Make sure MongoDB and the API are running.");
  }
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith("/auth/")) {
      setAuthToken(null);
      window.dispatchEvent(new Event("nutrirecipie-auth-expired"));
    }
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || `Request failed (${response.status}).`);
  }
  if (response.status === 204) return undefined;
  return response.json();
}

export const recipesApi = {
  list(search = "", category = "All recipes", sort = "recent") {
    const query = new URLSearchParams();
    if (search) query.set("search", search);
    if (category !== "All recipes") query.set("category", category);
    if (sort) query.set("sort", sort);
    return request(`/recipes?${query.toString()}`);
  },
  categories() {
    return request("/recipes/categories");
  },
  create(recipe) {
    return request("/recipes", { method: "POST", body: JSON.stringify(recipe) });
  },
  update(id, recipe) {
    return request(`/recipes/${id}`, { method: "PUT", body: JSON.stringify(recipe) });
  },
  remove(id) {
    return request(`/recipes/${id}`, { method: "DELETE" });
  }
};

export const externalRecipesApi = {
  search(query) {
    const params = new URLSearchParams();
    if (query.search) params.set("search", query.search);
    if (query.ingredients) params.set("ingredients", query.ingredients);
    return request(`/external-recipes/search?${params.toString()}`);
  }
};

export const authApi = {
  register(name, email, password) {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });
  },
  login(email, password) {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },
  me() {
    return request("/auth/me");
  }
};
