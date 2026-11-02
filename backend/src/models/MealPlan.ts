import { Schema, model } from "mongoose";

const mealPlanSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    days: [{
      date: { type: String, required: true },
      recipe: { type: Schema.Types.ObjectId, ref: "Recipe", required: true }
    }]
  },
  { timestamps: true }
);

export const MealPlan = model("MealPlan", mealPlanSchema);
