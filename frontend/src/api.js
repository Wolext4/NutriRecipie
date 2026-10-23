const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers }
    });
  } catch {
    throw new Error("Can't reach the recipe server. Make sure MongoDB and the API are running.");
  }
  if (!response.ok) {
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
