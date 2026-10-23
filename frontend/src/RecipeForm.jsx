import React, { useRef, useState } from "react";
import { Camera, ChevronRight, ImagePlus, Plus, Trash2, X } from "lucide-react";

const categories = ["Breakfast", "Lunch", "Dinner", "Dessert", "Snack", "Drinks"];
const maxImageDataLength = 820_000;
const emptyRecipe = {
  name: "",
  description: "",
  imageUrl: "",
  category: "Dinner",
  prepTime: 15,
  cookTime: 20,
  servings: 2,
  ingredients: [""],
  instructions: [""]
};

function loadImageFile(file) {
  if (typeof createImageBitmap === "function") return createImageBitmap(file);

  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("This image could not be opened. Try a JPEG or PNG photo."));
    };
    image.src = objectUrl;
  });
}

async function prepareImage(file) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file.");
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error("Choose an image smaller than 20 MB.");
  }

  let image;
  try {
    image = await loadImageFile(file);
    let width = image.width;
    let height = image.height;
    const initialScale = Math.min(1, 1200 / Math.max(width, height));
    width = Math.max(1, Math.round(width * initialScale));
    height = Math.max(1, Math.round(height * initialScale));

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare this image.");

    for (let sizeAttempt = 0; sizeAttempt < 5; sizeAttempt += 1) {
      canvas.width = width;
      canvas.height = height;
      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      for (const quality of [0.82, 0.7, 0.58]) {
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        if (dataUrl.length <= maxImageDataLength) return dataUrl;
      }

      width = Math.max(1, Math.round(width * 0.75));
      height = Math.max(1, Math.round(height * 0.75));
    }
  } finally {
    if (image && typeof image.close === "function") image.close();
  }

  throw new Error("This image is too large to save. Choose a smaller photo.");
}

export default function RecipeForm({ recipe, onClose, onSave }) {
  const [form, setForm] = useState(() => recipe ? {
    name: recipe.name,
    description: recipe.description,
    imageUrl: recipe.imageUrl,
    category: recipe.category,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    servings: recipe.servings,
    ingredients: [...recipe.ingredients],
    instructions: [...recipe.instructions]
  } : { ...emptyRecipe, ingredients: [...emptyRecipe.ingredients], instructions: [...emptyRecipe.instructions] });
  const [saving, setSaving] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [error, setError] = useState("");
  const libraryInput = useRef(null);
  const cameraInput = useRef(null);

  async function selectImage(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    setProcessingImage(true);
    setError("");
    try {
      const imageUrl = await prepareImage(file);
      setForm((current) => ({ ...current, imageUrl }));
    } catch (imageError) {
      setError(imageError instanceof Error ? imageError.message : "Couldn't load this image.");
    } finally {
      setProcessingImage(false);
    }
  }

  function updateList(key, index, value) {
    setForm((current) => ({ ...current, [key]: current[key].map((item, itemIndex) => itemIndex === index ? value : item) }));
  }

  function addListItem(key) {
    setForm((current) => ({ ...current, [key]: [...current[key], ""] }));
  }

  function removeListItem(key, index) {
    setForm((current) => ({ ...current, [key]: current[key].filter((_, itemIndex) => itemIndex !== index) }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave({
        ...form,
        ingredients: form.ingredients.map((item) => item.trim()).filter(Boolean),
        instructions: form.instructions.map((item) => item.trim()).filter(Boolean)
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Couldn't save this recipe.");
      setSaving(false);
    }
  }

  return <div className="sheet-backdrop form-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="form-sheet" role="dialog" aria-modal="true" aria-labelledby="form-title">
      <div className="sheet-handle" /><div className="form-heading"><div><span className="eyebrow">YOUR RECIPE BOOK</span><h2 id="form-title">{recipe ? "Edit recipe" : "A new favorite"}</h2></div><button className="icon-soft" type="button" aria-label="Close" onClick={onClose}><X size={18} /></button></div>
      <form onSubmit={submit} className="recipe-form">
        <label className="field">Recipe name<input required maxLength={100} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Sunday lemon pasta" /></label>
        <label className="field">A little about it<textarea required maxLength={500} rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What makes this one special?" /></label>
        <div className="field"><span>Recipe photo</span>
          <div className="image-picker">
            {form.imageUrl ? <img className="image-picker-preview" src={form.imageUrl} alt="Selected recipe" /> : <div className="image-picker-empty"><ImagePlus size={22} /><span>No photo selected</span></div>}
            <div className="image-picker-actions">
              <input ref={libraryInput} className="visually-hidden" type="file" accept="image/*" onChange={selectImage} tabIndex={-1} />
              <input ref={cameraInput} className="visually-hidden" type="file" accept="image/*" capture="environment" onChange={selectImage} tabIndex={-1} />
              <button type="button" className="image-picker-button" onClick={() => libraryInput.current?.click()} disabled={processingImage}><ImagePlus size={15} /> Choose photo</button>
              <button type="button" className="image-picker-button" onClick={() => cameraInput.current?.click()} disabled={processingImage}><Camera size={15} /> Take photo</button>
              {form.imageUrl && <button type="button" className="image-picker-remove" onClick={() => setForm((current) => ({ ...current, imageUrl: "" }))}>Remove</button>}
            </div>
            <span className="image-picker-hint">{processingImage ? "Preparing photo…" : "Photos are resized before saving."}</span>
          </div>
        </div>
        <label className="field">Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
        <div className="form-grid form-grid-small"><label className="field">Prep (min)<input type="number" min="0" max="1440" required value={form.prepTime} onChange={(event) => setForm({ ...form, prepTime: Number(event.target.value) })} /></label><label className="field">Cook (min)<input type="number" min="0" max="1440" required value={form.cookTime} onChange={(event) => setForm({ ...form, cookTime: Number(event.target.value) })} /></label><label className="field">Serves<input type="number" min="1" max="100" required value={form.servings} onChange={(event) => setForm({ ...form, servings: Number(event.target.value) })} /></label></div>
        <div className="field-list"><div className="list-heading"><span className="field-title">Ingredients</span><button type="button" className="add-line" onClick={() => addListItem("ingredients")}><Plus size={14} /> Add</button></div>{form.ingredients.map((item, index) => <div className="list-input" key={`ingredient-${index}`}><input required value={item} onChange={(event) => updateList("ingredients", index, event.target.value)} placeholder={`Ingredient ${index + 1}`} /><button type="button" className="remove-line" aria-label="Remove ingredient" onClick={() => removeListItem("ingredients", index)} disabled={form.ingredients.length === 1}><Trash2 size={15} /></button></div>)}</div>
        <div className="field-list"><div className="list-heading"><span className="field-title">Instructions</span><button type="button" className="add-line" onClick={() => addListItem("instructions")}><Plus size={14} /> Add step</button></div>{form.instructions.map((item, index) => <div className="list-input" key={`step-${index}`}><span className="step-number">{index + 1}</span><input required value={item} onChange={(event) => updateList("instructions", index, event.target.value)} placeholder={`Step ${index + 1}`} /><button type="button" className="remove-line" aria-label="Remove step" onClick={() => removeListItem("instructions", index)} disabled={form.instructions.length === 1}><Trash2 size={15} /></button></div>)}</div>
        {error && <p className="form-error" role="alert">{error}</p>}<button type="submit" className="apply-filters form-submit" disabled={saving || processingImage}>{saving ? "Saving…" : recipe ? "Save changes" : "Save my recipe"} <ChevronRight size={17} /></button>
      </form>
    </section>
  </div>;
}
