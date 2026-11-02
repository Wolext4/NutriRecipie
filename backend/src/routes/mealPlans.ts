import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { MealPlan } from "../models/MealPlan";
import { Recipe } from "../models/Recipe";
import { User } from "../models/User";
import { sendMealPlanEmail } from "../services/email";

const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const plan = await MealPlan.findOne({ user: req.authUserId }).populate("days.recipe");
    res.json(plan ?? { days: [] });
  } catch (error) { next(error); }
});

router.post("/generate", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.authUserId).select("name email preferences notifications");
    if (!user) { res.status(401).json({ message: "Account not found." }); return; }
    const preferences = (user.preferences ?? {}) as {
      preferredCategories?: string[];
      allergies?: string[];
      dislikedIngredients?: string[];
      likedIngredients?: string[];
    };
    const query: Record<string, unknown> = {};
    if (preferences.preferredCategories?.length) query.category = { $in: preferences.preferredCategories };
    if (preferences.allergies?.length) {
      query.ingredients = { $not: { $elemMatch: { $regex: preferences.allergies.join("|"), $options: "i" } } };
    }
    if (preferences.dislikedIngredients?.length) {
      query.ingredients = { $not: { $elemMatch: { $regex: preferences.dislikedIngredients.join("|"), $options: "i" } } };
    }
    let recipes = await Recipe.find(query).limit(100);
    if (!recipes.length) recipes = await Recipe.find({}).limit(100);
    if (!recipes.length) { res.status(400).json({ message: "Add recipes before generating a meal plan." }); return; }
    const liked = preferences.likedIngredients ?? [];
    recipes.sort((a, b) => {
      const score = (recipe: typeof a) => recipe.ingredients.reduce((total, item) => total + (liked.some((like) => item.toLowerCase().includes(like.toLowerCase())) ? 1 : 0), 0);
      return score(b) - score(a);
    });
    const days = Array.from({ length: 14 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() + index);
      return { date: date.toISOString().slice(0, 10), recipe: recipes[index % recipes.length]._id };
    });
    const plan = await MealPlan.findOneAndUpdate({ user: user._id }, { user: user._id, days }, { upsert: true, new: true }).populate("days.recipe");
    if (user.notifications?.mealPlanEmail) {
      await sendMealPlanEmail(user.email, user.name, days.map((day) => ({ date: day.date, recipeName: recipes.find((recipe) => String(recipe._id) === String(day.recipe))?.name ?? "Recipe" })));
    }
    res.json(plan);
  } catch (error) { next(error); }
});

export default router;
