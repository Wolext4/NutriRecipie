import { Schema, model } from "mongoose";

const recipeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    imageUrl: { type: String, trim: true, default: "" },
    category: { type: String, required: true, trim: true, maxlength: 40 },
    prepTime: { type: Number, required: true, min: 0 },
    cookTime: { type: Number, required: true, min: 0 },
    servings: { type: Number, required: true, min: 1 },
    ingredients: {
      type: [{ type: String, trim: true }],
      required: true,
      validate: {
        validator: (ingredients: string[]) => ingredients.length > 0,
        message: "Add at least one ingredient."
      }
    },
    instructions: {
      type: [{ type: String, trim: true }],
      required: true,
      validate: {
        validator: (instructions: string[]) => instructions.length > 0,
        message: "Add at least one instruction."
      }
    }
  },
  { timestamps: true }
);

export const Recipe = model("Recipe", recipeSchema);
