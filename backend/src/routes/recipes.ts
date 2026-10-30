import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { z } from "zod";
import { Recipe } from "../models/Recipe";

const router = Router();

const imageUrlInput = z.string().trim().max(820_000).refine(
  (imageUrl) =>
    imageUrl === "" ||
    (imageUrl.length <= 2000 && /^https?:\/\/\S+$/i.test(imageUrl)) ||
    /^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(imageUrl),
  "Use an HTTP(S) image URL or a resized JPEG image."
);

const recipeInput = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(500),
  imageUrl: imageUrlInput.optional().default(""),
  category: z.string().trim().min(1).max(40),
  prepTime: z.coerce.number().int().min(0).max(1440),
  cookTime: z.coerce.number().int().min(0).max(1440),
  servings: z.coerce.number().int().min(1).max(100),
  ingredients: z.array(z.string().trim().min(1)).min(1).max(100),
  instructions: z.array(z.string().trim().min(1)).min(1).max(100)
});

router.get("/", async (req, res, next) => {
  try {
    const query: Record<string, unknown> = {};
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const category = typeof req.query.category === "string" ? req.query.category.trim() : "";
    const minPrep = Number(req.query.minPrep);
    const maxPrep = Number(req.query.maxPrep);
    const minCook = Number(req.query.minCook);
    const maxCook = Number(req.query.maxCook);
    const minServings = Number(req.query.minServings);

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$and = [
        { $or: [
        { name: { $regex: escapedSearch, $options: "i" } },
        { description: { $regex: escapedSearch, $options: "i" } },
        { ingredients: { $regex: escapedSearch, $options: "i" } }
        ] }
      ];
      delete query.$or;
    }
    if (category && category !== "All recipes") query.category = category;
    if (Number.isFinite(minPrep)) query.prepTime = { ...(query.prepTime as object ?? {}), $gte: minPrep };
    if (Number.isFinite(maxPrep)) query.prepTime = { ...(query.prepTime as object ?? {}), $lte: maxPrep };
    if (Number.isFinite(minCook)) query.cookTime = { ...(query.cookTime as object ?? {}), $gte: minCook };
    if (Number.isFinite(maxCook)) query.cookTime = { ...(query.cookTime as object ?? {}), $lte: maxCook };
    if (Number.isFinite(minServings)) query.servings = { $gte: minServings };

    const sort: { name?: "asc"; createdAt?: "desc" } =
      req.query.sort === "name" ? { name: "asc" } : { createdAt: "desc" };
    const recipes = await Recipe.find(query).sort(sort);
    res.json(recipes);
  } catch (error) {
    next(error);
  }
});

router.get("/categories", async (_req, res, next) => {
  try {
    const categories = await Recipe.distinct("category");
    res.json(categories.sort((a, b) => a.localeCompare(b)));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: "Invalid recipe ID." });
      return;
    }
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      res.status(404).json({ message: "Recipe not found." });
      return;
    }
    res.json(recipe);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = recipeInput.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid recipe." });
      return;
    }
    const recipe = await Recipe.create({
      ...parsed.data
    });
    res.status(201).json(recipe);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: "Invalid recipe ID." });
      return;
    }
    const parsed = recipeInput.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid recipe." });
      return;
    }
    const recipe = await Recipe.findOneAndUpdate(
      { _id: req.params.id },
      parsed.data,
      {
      new: true,
      runValidators: true
      }
    );
    if (!recipe) {
      res.status(404).json({ message: "Recipe not found." });
      return;
    }
    res.json(recipe);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: "Invalid recipe ID." });
      return;
    }
    const recipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!recipe) {
      res.status(404).json({ message: "Recipe not found." });
      return;
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
