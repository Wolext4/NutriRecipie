import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    preferences: {
      likedIngredients: { type: [String], default: [] },
      dislikedIngredients: { type: [String], default: [] },
      allergies: { type: [String], default: [] },
      preferredCategories: { type: [String], default: [] }
    },
    notifications: {
      mealPlanEmail: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
);

export const User = model("User", userSchema);
