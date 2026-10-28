import { Router } from "express";
import { isValidObjectId, Types } from "mongoose";
import { z } from "zod";
import { optionalAuth, requireAuth } from "../middleware/auth";
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

router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const visibility: Record<string, unknown>[] = [{ isPublic: true }];
    if (req.authUserId) visibility.push({ owner: new Types.ObjectId(req.authUserId) });
    const query: Record<string, unknown> = { $or: visibility };
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const category = typeof req.query.category === "string" ? req.query.category.trim() : "";

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$and = [
        { $or: visibility },
        { $or: [
        { name: { $regex: escapedSearch, $options: "i" } },
        { description: { $regex: escapedSearch, $options: "i" } },
        { ingredients: { $regex: escapedSearch, $options: "i" } }
        ] }
      ];
      delete query.$or;
    }
    if (category && category !== "All recipes") query.category = category;

    const sort: { name?: "asc"; createdAt?: "desc" } =
      req.query.sort === "name" ? { name: "asc" } : { createdAt: "desc" };
    const recipes = await Recipe.find(query).sort(sort);
    res.json(recipes);
  } catch (error) {
    next(error);
  }
});

router.get("/categories", optionalAuth, async (req, res, next) => {
  try {
    const visibility: Record<string, unknown>[] = [{ isPublic: true }];
    if (req.authUserId) visibility.push({ owner: new Types.ObjectId(req.authUserId) });
    const categories = await Recipe.distinct("category", { $or: visibility });
    res.json(categories.sort((a, b) => a.localeCompare(b)));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: "Invalid recipe ID." });
      return;
    }
    const visibility: Record<string, unknown>[] = [{ isPublic: true }];
    if (req.authUserId) visibility.push({ owner: new Types.ObjectId(req.authUserId) });
    const recipe = await Recipe.findOne({ _id: req.params.id, $or: visibility });
    if (!recipe) {
      res.status(404).json({ message: "Recipe not found." });
      return;
    }
    res.json(recipe);
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const parsed = recipeInput.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid recipe." });
      return;
    }
    const recipe = await Recipe.create({
      ...parsed.data,
      owner: new Types.ObjectId(req.authUserId),
      isPublic: false
    });
    res.status(201).json(recipe);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", requireAuth, async (req, res, next) => {
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
      { _id: req.params.id, owner: new Types.ObjectId(req.authUserId), isPublic: false },
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

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: "Invalid recipe ID." });
      return;
    }
    const recipe = await Recipe.findOneAndDelete({
      _id: req.params.id,
      owner: new Types.ObjectId(req.authUserId),
      isPublic: false
    });
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
