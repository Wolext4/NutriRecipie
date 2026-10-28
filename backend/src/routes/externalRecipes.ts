import { Router } from "express";
import { z } from "zod";

const router = Router();
const recipeApiBaseUrl = process.env.RECIPE_API_URL ?? "https://recipeapi.io/api/v1";

const queryInput = z.object({
  search: z.string().trim().max(100).optional(),
  ingredients: z.string().trim().max(300).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1)
}).refine((value) => value.search || value.ingredients, "Enter a recipe name or ingredient.");

function normalizeRecipe(recipe: Record<string, unknown>) {
  const mealType = typeof recipe.meal_type === "string" ? recipe.meal_type : "main";
  const category = mealType === "main" ? "Dinner" : mealType.charAt(0).toUpperCase() + mealType.slice(1).replace("_", " ");
  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients.map((item) => typeof item === "string" ? item : (item as Record<string, unknown>)?.name).filter((item): item is string => Boolean(item))
    : [];
  const instructions = Array.isArray(recipe.instructions)
    ? recipe.instructions.map((item) => typeof item === "string" ? item : (item as Record<string, unknown>)?.step).filter((item): item is string => Boolean(item))
    : [];

  return {
    externalId: String(recipe.id ?? ""),
    name: typeof recipe.name === "string" ? recipe.name : "Imported recipe",
    description: typeof recipe.description === "string" ? recipe.description : "Imported from Recipe API.",
    imageUrl: typeof recipe.image_url === "string" ? recipe.image_url : "",
    category,
    prepTime: Number(recipe.prep_time ?? 0),
    cookTime: Number(recipe.cook_time ?? 0),
    servings: Number(recipe.servings ?? 1),
    ingredients,
    instructions
  };
}

router.get("/search", async (req, res, next) => {
  try {
    const apiKey = process.env.RECIPE_API_KEY;
    if (!apiKey) {
      res.status(503).json({ message: "Recipe API is not configured on the server." });
      return;
    }

    const parsed = queryInput.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Enter a recipe name or ingredient." });
      return;
    }

    const query = new URLSearchParams({
      page: String(parsed.data.page),
      per_page: "10"
    });
    if (parsed.data.search) query.set("search", parsed.data.search);
    if (parsed.data.ingredients) query.set("ingredients", parsed.data.ingredients);

    const response = await fetch(`${recipeApiBaseUrl}/recipes?${query.toString()}`, {
      headers: { Authorization: apiKey, Accept: "application/json" }
    });
    if (!response.ok) {
      res.status(response.status === 401 ? 502 : 503).json({ message: "Recipe API request failed." });
      return;
    }

    const payload = await response.json() as { data?: Record<string, unknown>[] };
    res.json({ recipes: Array.isArray(payload.data) ? payload.data.map(normalizeRecipe) : [] });
  } catch (error) {
    next(error);
  }
});

export default router;
