import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { User } from "../models/User";

const router = Router();
const profileInput = z.object({
  likedIngredients: z.array(z.string().trim().min(1).max(60)).max(50),
  dislikedIngredients: z.array(z.string().trim().min(1).max(60)).max(50),
  allergies: z.array(z.string().trim().min(1).max(60)).max(50),
  preferredCategories: z.array(z.string().trim().min(1).max(40)).max(20),
  mealPlanEmail: z.boolean()
});

router.put("/", requireAuth, async (req, res, next) => {
  try {
    const parsed = profileInput.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid preferences." }); return; }
    const user = await User.findByIdAndUpdate(req.authUserId, {
      preferences: {
        likedIngredients: parsed.data.likedIngredients,
        dislikedIngredients: parsed.data.dislikedIngredients,
        allergies: parsed.data.allergies,
        preferredCategories: parsed.data.preferredCategories
      },
      notifications: { mealPlanEmail: parsed.data.mealPlanEmail }
    }, { new: true, select: "name email preferences notifications" });
    res.json(user);
  } catch (error) { next(error); }
});

export default router;
