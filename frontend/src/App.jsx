import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, BookOpen, Check, ChevronDown, ChevronRight, Clock3,
  Coffee, Filter, Heart, Home, ListPlus, Plus, Search, ShoppingBag,
  ShoppingBasket, SlidersHorizontal, Sparkles, Trash2, UserRound, Utensils,
  X
} from "lucide-react";
import RecipeForm from "./RecipeForm";
import { externalRecipesApi, recipesApi } from "./api";

const FALLBACK_CATEGORIES = ["Breakfast", "Dinner", "Lunch", "Dessert", "Snack", "Drinks"];
const categoryPhotos = {
  Breakfast: "photo-1533089860892-a7c6f0a88666",
  Dinner: "photo-1547592180-85f173990554",
  Lunch: "photo-1512621776951-a57141f2eefd",
  Dessert: "photo-1488477181946-6428a0291777",
  Snack: "photo-1540420773420-3366772f4999",
  Drinks: "photo-1513558161293-cdaf765edfd7"
};
const fallbackPhoto = "photo-1547592180-85f173990554";
const photoUrl = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=850&q=85`;
const categoryIcons = { Breakfast: Coffee, Dinner: Utensils, Lunch: Utensils, Dessert: Sparkles, Snack: Heart, Drinks: Coffee };

function RecipeCard({ recipe, onClick, compact = false }) {
  return (
    <button className={`recipe-card ${compact ? "recipe-card-compact" : ""}`} onClick={onClick}>
      <div className="recipe-photo" style={{ backgroundImage: `url("${recipe.imageUrl || photoUrl(categoryPhotos[recipe.category] || fallbackPhoto)}")` }}>
        <span className="category-pill">{recipe.category}</span>
        <span className="photo-time"><Clock3 size={12} /> {recipe.prepTime + recipe.cookTime}m</span>
      </div>
      <div className="recipe-card-copy"><h3>{recipe.name}</h3><p>{recipe.description}</p><span className="recipe-card-servings"><Utensils size={13} /> Serves {recipe.servings}</span></div>
    </button>
  );
}

function RecipeDetails({ recipe, onClose, onEdit, onDelete, onAddShopping, canManage }) {
  return (
    <div className="sheet-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="recipe-detail-sheet" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <div className="detail-cover" style={{ backgroundImage: `url("${recipe.imageUrl || photoUrl(categoryPhotos[recipe.category] || fallbackPhoto)}")` }}>
          <button className="round-icon detail-back" onClick={onClose} aria-label="Close recipe"><ArrowLeft size={19} /></button>
          <button className="round-icon detail-fav" aria-label="Save recipe"><Heart size={19} /></button>
          <span className="category-pill">{recipe.category}</span>
        </div>
        <div className="detail-sheet-content">
          <div className="detail-title-line"><div><span className="eyebrow">A RECIPE TO KEEP</span><h2 id="detail-title">{recipe.name}</h2></div><button className="icon-soft" aria-label="Close" onClick={onClose}><X size={18} /></button></div>
          <p className="detail-description">{recipe.description}</p>
          <div className="detail-facts"><span><Clock3 size={16} /><b>{recipe.prepTime + recipe.cookTime} min</b><small>Total time</small></span><span><Utensils size={16} /><b>{recipe.servings} servings</b><small>Good for sharing</small></span></div>
          <div className="detail-section-title"><h3>Ingredients <span>{recipe.ingredients.length}</span></h3><button className="text-action" onClick={() => onAddShopping(recipe)}><ListPlus size={15} /> Add to list</button></div>
          <ul className="ingredient-list">{recipe.ingredients.map((item, index) => <li key={`${item}-${index}`}><span className="ingredient-bullet" />{item}</li>)}</ul>
          <h3 className="method-title">Let's make it</h3>
          <ol className="method-list">{recipe.instructions.map((step, index) => <li key={`${step}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><p>{step}</p></li>)}</ol>
          {canManage && <div className="detail-actions"><button className="button button-quiet" onClick={onEdit}>Edit recipe</button><button className="delete-recipe" onClick={onDelete}><Trash2 size={15} /> Remove</button></div>}
        </div>
      </section>
    </div>
  );
}

function FilterSheet({ categories, category, setCategory, maxTime, setMaxTime, maxPrepTime, setMaxPrepTime, maxCookTime, setMaxCookTime, minServings, setMinServings, sort, setSort, onClose, onApply }) {
  return (
    <div className="sheet-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="filter-sheet" role="dialog" aria-modal="true" aria-labelledby="filter-title">
        <div className="sheet-handle" /><div className="filter-heading"><div><span className="eyebrow">MAKE IT JUST RIGHT</span><h2 id="filter-title">Filters</h2></div><button className="icon-soft" onClick={onClose} aria-label="Close filters"><X size={18} /></button></div>
        <h3>Category</h3><div className="filter-options filter-categories"><button className={category === "All recipes" ? "option-selected" : ""} onClick={() => setCategory("All recipes")}>All</button>{categories.map((item) => <button key={item} className={category === item ? "option-selected" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
        <h3>Total duration</h3><div className="filter-options">{[["Any time", 0], ["Under 30 min", 30], ["Under 60 min", 60], ["Under 90 min", 90]].map(([label, value]) => <button key={label} className={maxTime === value ? "option-selected" : ""} onClick={() => setMaxTime(value)}>{label}</button>)}</div>
        <h3>Preparation time</h3><div className="filter-options">{[["Any prep time", 0], ["Under 15 min", 15], ["Under 30 min", 30], ["Under 60 min", 60]].map(([label, value]) => <button key={label} className={maxPrepTime === value ? "option-selected" : ""} onClick={() => setMaxPrepTime(value)}>{label}</button>)}</div>
        <h3>Cooking time</h3><div className="filter-options">{[["Any cook time", 0], ["Under 15 min", 15], ["Under 30 min", 30], ["Under 60 min", 60]].map(([label, value]) => <button key={label} className={maxCookTime === value ? "option-selected" : ""} onClick={() => setMaxCookTime(value)}>{label}</button>)}</div>
        <h3>Servings</h3><div className="filter-options">{[["Any servings", 0], ["2+ servings", 2], ["4+ servings", 4], ["6+ servings", 6]].map(([label, value]) => <button key={label} className={minServings === value ? "option-selected" : ""} onClick={() => setMinServings(value)}>{label}</button>)}</div>
        <h3>Sort by</h3><div className="filter-options"><button className={sort === "recent" ? "option-selected" : ""} onClick={() => setSort("recent")}>Recently added</button><button className={sort === "name" ? "option-selected" : ""} onClick={() => setSort("name")}>Name A–Z</button></div>
        <button className="apply-filters" onClick={onApply}>Show recipes <ChevronRight size={17} /></button>
      </section>
    </div>
  );
}

function BottomNav({ active, onChange }) {
  const items = [
    ["recipes", "Recipes", Home],
    ["nutri", "Nutri", Sparkles],
    ["menu", "Menu", BookOpen],
    ["purchase", "Purchase", ShoppingBag],
    ["profile", "Profile", UserRound]
  ];
  return <nav className="bottom-nav" aria-label="Main navigation">{items.map(([key, label, Icon]) => <button key={key} className={active === key ? "nav-selected" : ""} onClick={() => onChange(key)}><Icon size={19} strokeWidth={active === key ? 2.4 : 1.8} /><span>{label}</span></button>)}</nav>;
}

export default function App() {
  const [screen, setScreen] = useState("recipes");
  const [recipes, setRecipes] = useState([]);
  const [allRecipes, setAllRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All recipes");
  const [maxTime, setMaxTime] = useState(0);
  const [maxPrepTime, setMaxPrepTime] = useState(0);
  const [maxCookTime, setMaxCookTime] = useState(0);
  const [minServings, setMinServings] = useState(0);
  const [sort, setSort] = useState("recent");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [externalRecipes, setExternalRecipes] = useState([]);
  const [externalLoading, setExternalLoading] = useState(false);
  const [externalError, setExternalError] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [shoppingList, setShoppingList] = useState(() => {
    try { return JSON.parse(localStorage.getItem("gather-shopping-list") || "[]"); }
    catch { return []; }
  });

  const loadRecipes = useCallback(async () => {
    setLoading(true);
    setExternalLoading(true);
    setExternalError("");
    const filters = {
      maxPrep: maxPrepTime,
      maxCook: maxCookTime,
      minServings
    };
    try {
      const [result, categoryList, all] = await Promise.all([
        recipesApi.list(search, activeCategory, sort, filters),
        recipesApi.categories(),
        recipesApi.list("", "All recipes", "recent")
      ]);
      let apiResult = [];
      try {
        const externalResult = await externalRecipesApi.search({
          search,
          category: activeCategory,
          maxPrep: maxPrepTime || undefined,
          maxCook: maxCookTime || undefined,
          minServings: minServings || undefined
        });
        apiResult = externalResult.recipes;
      } catch {
        setExternalError("Recipe API is unavailable right now. Your saved recipes are still available.");
      }
      setExternalRecipes(apiResult);
      setRecipes(result);
      setAllRecipes(all);
      setCategories(categoryList);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Couldn't load recipes.");
    } finally {
      setLoading(false);
      setExternalLoading(false);
    }
  }, [search, activeCategory, sort, maxPrepTime, maxCookTime, minServings]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadRecipes(), 150);
    return () => window.clearTimeout(timer);
  }, [loadRecipes]);

  useEffect(() => {
    localStorage.setItem("gather-shopping-list", JSON.stringify(shoppingList));
  }, [shoppingList]);

  const categoryNames = useMemo(
    () => [...new Set([...FALLBACK_CATEGORIES, ...categories])],
    [categories]
  );
  const visibleRecipes = useMemo(
    () => maxTime ? recipes.filter((recipe) => recipe.prepTime + recipe.cookTime <= maxTime) : recipes,
    [recipes, maxTime]
  );
  const categoryList = showAllCategories ? categoryNames : categoryNames.slice(0, 4);

  function startCreateRecipe() {
    setEditing(null);
    setShowForm(true);
  }

  async function saveRecipe(input) {
    if (editing) await recipesApi.update(editing._id, input);
    else await recipesApi.create(input);
    setShowForm(false);
    setEditing(null);
    await loadRecipes();
  }

  async function searchExternalRecipes() {
    const query = searchInput.trim();
    if (!query) return;
    setExternalLoading(true);
    setExternalError("");
    try {
      const result = await externalRecipesApi.search({
        search: query,
        category: activeCategory,
        maxPrep: maxPrepTime || undefined,
        maxCook: maxCookTime || undefined,
        minServings: minServings || undefined
      });
      setExternalRecipes(result.recipes);
    } catch (externalSearchError) {
      setExternalError(externalSearchError instanceof Error ? externalSearchError.message : "Couldn't search Recipe API.");
    } finally {
      setExternalLoading(false);
    }
  }

  async function importExternalRecipe(recipe) {
    try {
      await recipesApi.create({
        name: recipe.name,
        description: recipe.description,
        imageUrl: recipe.imageUrl,
        category: recipe.category,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions
      });
      await loadRecipes();
      setScreen("recipes");
    } catch (importError) {
      setExternalError(importError instanceof Error ? importError.message : "Couldn't import this recipe.");
    }
  }

  async function deleteRecipe(recipe) {
    if (!window.confirm(`Remove "${recipe.name}" from your recipe book?`)) return;
    try {
      await recipesApi.remove(recipe._id);
      setSelected(null);
      await loadRecipes();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Couldn't remove this recipe.");
    }
  }

  function addToShopping(recipe) {
    setShoppingList((current) => {
      const existing = new Set(current.map((item) => item.name.toLowerCase()));
      const newItems = recipe.ingredients
        .filter((name) => !existing.has(name.toLowerCase()))
        .map((name) => ({ id: `${Date.now()}-${Math.random()}`, name, checked: false, recipe: recipe.name }));
      return [...current, ...newItems];
    });
    setSelected(null);
    setScreen("purchase");
  }

  function toggleShoppingItem(id) {
    setShoppingList((current) => current.map((item) => item.id === id ? { ...item, checked: !item.checked } : item));
  }

  function renderRecipeResults(items) {
    if (loading) return <div className="inline-loading"><span className="loader" />Finding something delicious…</div>;
    if (!items.length) {
      return <div className="no-results"><span className="no-results-icon"><Search size={20} /></span><h3>No recipes found just yet</h3><p>Try another search, choose a different category, or loosen your filters.</p>      <button className="text-action" onClick={() => { setSearchInput(""); setSearch(""); setActiveCategory("All recipes"); setMaxTime(0); setMaxPrepTime(0); setMaxCookTime(0); setMinServings(0); }}>Clear search & filters</button></div>;
    }
    return <div className="vertical-recipes">{items.map((recipe) => <RecipeCard key={recipe._id} recipe={recipe} onClick={() => setSelected(recipe)} />)}</div>;
  }

  function renderExternalResults(items = externalRecipes) {
    if (externalLoading) return <div className="inline-loading"><span className="loader" />Finding recipes from Recipe API…</div>;
    if (externalError) return <p className="form-error" role="alert">{externalError}</p>;
    if (!items.length) return <p className="section-empty">No matching API recipes yet. Try another search or filter.</p>;
    const filteredItems = items.filter((recipe) => !maxTime || recipe.prepTime + recipe.cookTime <= maxTime);
    if (!filteredItems.length) return <p className="section-empty">No API recipes match the selected duration filter.</p>;
    return <div className="horizontal-recipes api-recipe-scroller">{filteredItems.slice(0, 10).map((recipe) => <RecipeCard key={`api-${recipe.externalId}`} recipe={recipe} onClick={() => setSelected(recipe)} compact />)}</div>;
  }

  function renderHome() {
    const featured = (search || activeCategory !== "All recipes" || maxTime) ? visibleRecipes : allRecipes;
    return <>
      <header className="home-header"><div><span className="home-greeting">GOOD FOOD, GOOD MOOD <span>✳</span></span><h1>What do you want<br />to <em>cook?</em></h1></div><button className="profile-bubble" aria-label="Profile" onClick={() => setScreen("profile")}><UserRound size={19} /></button></header>
      <form className="search-bar" onSubmit={(event) => { event.preventDefault(); setSearch(searchInput.trim()); }}><Search size={18} /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search for a recipe" aria-label="Search recipes" /><button className="filter-trigger" type="button" aria-label="Open filters" onClick={() => setShowFilters(true)}><SlidersHorizontal size={17} /></button></form>
      {(search || activeCategory !== "All recipes") && <div className="search-context"><span>{activeCategory === "All recipes" ? "Search results" : activeCategory}{search ? ` for “${search}”` : ""}</span><button onClick={() => { setSearchInput(""); setSearch(""); setActiveCategory("All recipes"); setMaxTime(0); }}>Clear <X size={13} /></button></div>}
      {!(search || activeCategory !== "All recipes") && <section className="assistant-banner"><div className="assistant-banner-top"><span className="assistant-spark"><Sparkles size={16} /></span><span className="assistant-label">A LITTLE KITCHEN INSPIRATION</span><span className="assistant-new">IDEAS</span></div><h2>Not sure what to make?</h2><p>Search your saved recipes by name or ingredient.</p><button className="assistant-input" onClick={() => setScreen("nutri")}><span>Tell us what’s in your fridge…</span><ChevronRight size={17} /></button></section>}
      <section className="content-section"><div className="section-heading"><div><span className="eyebrow">FIND YOUR NEXT FAVORITE</span><h2>Categories</h2></div><button className="show-all" onClick={() => setShowAllCategories(!showAllCategories)}>{showAllCategories ? "Show less" : "Show all"} <ChevronRight size={15} /></button></div><div className="category-scroller">{categoryList.map((category) => { const Icon = categoryIcons[category] || Utensils; const count = allRecipes.filter((recipe) => recipe.category === category).length; return <button key={category} className={`category-card ${activeCategory === category ? "category-card-active" : ""}`} onClick={() => { setActiveCategory(activeCategory === category ? "All recipes" : category); setScreen("recipes"); }}><img src={photoUrl(categoryPhotos[category] || fallbackPhoto)} alt="" /><span className="category-image-shade" /><span className="category-icon"><Icon size={16} /></span><span className="category-name">{category}</span><span className="category-count">{count} {count === 1 ? "recipe" : "recipes"}</span></button>; })}</div></section>
      <section className="content-section new-section"><div className="section-heading"><div><span className="eyebrow">{search || activeCategory !== "All recipes" ? "YOUR SEARCH" : "FRESH FROM YOUR KITCHEN"}</span><h2>{search || activeCategory !== "All recipes" ? "Saved recipes" : "Your recipes"}</h2></div><button className="show-all" onClick={() => setScreen("menu")}>Show all <ChevronRight size={15} /></button></div>{renderRecipeResults(featured)}</section>
      <section className="content-section api-section"><div className="section-heading"><div><span className="eyebrow">RECIPE API</span><h2>More ideas for you</h2></div><button className="show-all" onClick={() => setScreen("nutri")}>Explore all <ChevronRight size={15} /></button></div>{renderExternalResults()}</section>
    </>;
  }

  function renderNutri() {
    const suggestions = ["chicken", "tomato", "pasta", "vegetarian"];
    return <><header className="subpage-header"><span className="eyebrow">A LITTLE INSPIRATION</span><h1>Let's find<br /><em>something good.</em></h1><p>What ingredients do you have on hand?</p></header><form className="search-bar nutri-search" onSubmit={(event) => { event.preventDefault(); setSearch(searchInput.trim()); setActiveCategory("All recipes"); }}><Search size={18} /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="e.g. chicken, tomatoes…" aria-label="Search by ingredient" /><button type="submit" aria-label="Search"><ChevronRight size={18} /></button></form><div className="suggestion-chips">{suggestions.map((item) => <button key={item} onClick={() => { setSearchInput(item); setSearch(item); }}>{item}</button>)}</div><section className="content-section external-results"><div className="section-heading"><div><span className="eyebrow">RECIPE API</span><h2>Import a recipe</h2></div><button className="show-all" onClick={() => void searchExternalRecipes()} disabled={externalLoading}>{externalLoading ? "Searching…" : "Search API"} <ChevronRight size={15} /></button></div>{externalError && <p className="form-error" role="alert">{externalError}</p>}{externalRecipes.length > 0 && <div className="external-recipe-list">{externalRecipes.map((recipe) => <article className="external-recipe" key={recipe.externalId}><div><h3>{recipe.name}</h3><p>{recipe.description}</p></div><button className="text-action" onClick={() => void importExternalRecipe(recipe)}>Save to my recipes <Plus size={15} /></button></article>)}</div>}</section><section className="content-section nutri-results"><div className="section-heading"><div><span className="eyebrow">FROM YOUR RECIPE BOOK</span><h2>{search ? `With “${search}”` : "Recipes to inspire"}</h2></div></div>{renderRecipeResults(search ? recipes : allRecipes.slice(0, 6))}</section></>;
  }

  function renderMenu() {
    return <><header className="subpage-header menu-header"><span className="eyebrow">YOUR RECIPE COLLECTION</span><div className="menu-title-row"><h1>All <em>recipes.</em></h1><button className="add-round" aria-label="Add recipe" onClick={startCreateRecipe}><Plus size={20} /></button></div><p>Browse, edit, and manage every recipe in your collection.</p></header><div className="search-bar menu-search"><Search size={18} /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search recipes" /><button className="filter-trigger" onClick={() => setShowFilters(true)} aria-label="Filter recipes"><Filter size={17} /></button></div><div className="menu-summary"><BookOpen size={16} /><span>{visibleRecipes.length} {visibleRecipes.length === 1 ? "recipe" : "recipes"}</span><button onClick={() => setShowFilters(true)}>Filters <ChevronDown size={14} /></button></div>{renderRecipeResults(visibleRecipes)}</>;
  }

  function renderPurchase() {
    const remaining = shoppingList.filter((item) => !item.checked);
    return <><header className="subpage-header shopping-header"><span className="eyebrow">YOUR LITTLE SHOPPING HELPER</span><h1>Market <em>list.</em></h1><p>Ingredients from recipes you want to make.</p></header><div className="shopping-summary"><span className="shopping-icon"><ShoppingBasket size={20} /></span><div><strong>{remaining.length} things to pick up</strong><small>{shoppingList.length - remaining.length} already in your basket</small></div>{shoppingList.some((item) => item.checked) && <button className="clear-done" onClick={() => setShoppingList((current) => current.filter((item) => !item.checked))}>Clear done</button>}</div>{shoppingList.length ? <div className="shopping-list">{shoppingList.map((item) => <label className={`shopping-item ${item.checked ? "shopping-checked" : ""}`} key={item.id}><input type="checkbox" checked={item.checked} onChange={() => toggleShoppingItem(item.id)} /><span className="custom-check"><Check size={13} /></span><span className="shopping-item-copy"><strong>{item.name}</strong><small>For {item.recipe}</small></span><button type="button" aria-label={`Remove ${item.name}`} onClick={(event) => { event.preventDefault(); setShoppingList((current) => current.filter((entry) => entry.id !== item.id)); }}><X size={16} /></button></label>)}</div> : <div className="no-results shopping-empty"><span className="no-results-icon"><ShoppingBag size={20} /></span><h3>Your list is looking fresh</h3><p>Open a recipe and tap “Add to list” to bring its ingredients here.</p><button className="text-action" onClick={() => setScreen("recipes")}>Browse recipes <ChevronRight size={15} /></button></div>}</>;
  }

  function renderProfile() {
    const counts = categoryNames.map((category) => ({ category, count: allRecipes.filter((recipe) => recipe.category === category).length })).filter((item) => item.count > 0);
    return <><header className="profile-cover"><div className="profile-avatar-large"><UserRound size={26} /></div><span className="eyebrow">YOUR NUTRIRECIPIE KITCHEN</span><h1>Recipe book</h1><p>Everything you need to plan and make something delicious.</p></header><div className="profile-stats"><div><strong>{allRecipes.length}</strong><span>Recipes</span></div><div><strong>{categories.length}</strong><span>Categories</span></div><div><strong>{shoppingList.length}</strong><span>On your list</span></div></div><section className="profile-section"><div className="section-heading"><div><span className="eyebrow">YOUR COLLECTION</span><h2>Recipe categories</h2></div></div>{counts.length ? counts.map((item) => <button className="profile-category" key={item.category} onClick={() => { setActiveCategory(item.category); setScreen("menu"); }}><span>{item.category}</span><span>{item.count} recipes <ChevronRight size={15} /></span></button>) : <div className="profile-empty">Your categories will show up here once you add recipes.</div>}</section><button className="profile-add" onClick={startCreateRecipe}><Plus size={17} /> Add a recipe</button></>;
  }

  return <main className="app-frame">
    <div className="screen-content" key={screen}>
      {screen === "recipes" && renderHome()}
      {screen === "nutri" && renderNutri()}
      {screen === "menu" && renderMenu()}
      {screen === "purchase" && renderPurchase()}
      {screen === "profile" && renderProfile()}
      {error && <div className="error-banner" role="alert"><span>{error}</span><button onClick={() => void loadRecipes()}>Retry</button></div>}
    </div>
    <button className="floating-add" aria-label="Add a recipe" onClick={startCreateRecipe}><Plus size={22} /></button>
    <BottomNav active={screen} onChange={setScreen} />
    <div className="home-indicator" />
    {showForm && <RecipeForm recipe={editing || undefined} onClose={() => { setShowForm(false); setEditing(null); }} onSave={saveRecipe} />}
    {showFilters && <FilterSheet categories={categoryNames} category={activeCategory} setCategory={setActiveCategory} maxTime={maxTime} setMaxTime={setMaxTime} maxPrepTime={maxPrepTime} setMaxPrepTime={setMaxPrepTime} maxCookTime={maxCookTime} setMaxCookTime={setMaxCookTime} minServings={minServings} setMinServings={setMinServings} sort={sort} setSort={setSort} onClose={() => setShowFilters(false)} onApply={() => { setShowFilters(false); setScreen("recipes"); }} />}
    {selected && <RecipeDetails recipe={selected} onClose={() => setSelected(null)} canManage={!selected.external} onEdit={() => { setEditing(selected); setSelected(null); setShowForm(true); }} onDelete={() => void deleteRecipe(selected)} onAddShopping={addToShopping} />}
  </main>;
}
