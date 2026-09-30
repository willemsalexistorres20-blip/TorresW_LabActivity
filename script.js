// API Endpoint
const API = "https://jsonplaceholder.typicode.com/posts";

let recipes = [];

function saveToLocalStorage() {
  localStorage.setItem("saved_recipes", JSON.stringify(recipes));
}

function setStatus(msg, type) {
  const box = document.getElementById("status-box");
  box.innerText = msg;
  box.className = type;
  box.style.display = "block";
  if (type !== "loading") {
    setTimeout(() => { box.style.display = "none"; }, 3500);
  }
}

async function loadRecipes() {
  setStatus("Loading recipes...", "loading");

  const localData = localStorage.getItem("saved_recipes");
  if (localData) {
    recipes = JSON.parse(localData);
    renderRecipes();
    setStatus("Recipes loaded from local storage!", "success");
    return;
  }

  try {
    let res = await fetch(API + "?_limit=4");
    if (!res.ok) throw new Error("Failed to load recipes");

    recipes = [
      { id: 1, name: "Adobo", steps: "Ingredients: Chicken, soy sauce, vinegar, garlic, bay leaves, peppercorns.\nSteps: Marinate chicken, simmer until tender, and reduce sauce." },
      { id: 2, name: "Garlic Fried Rice (Sinangag)", steps: "Ingredients: Day-old rice, minced garlic, oil, salt.\nSteps: Sauté garlic until golden brown, add rice, season with salt, and toss thoroughly." },
      { id: 3, name: "Pancit Canton", steps: "Ingredients: Flour noodles, sliced pork, vegetables, soy sauce, broth.\nSteps: Stir-fry pork and veggies, add broth and seasonings, drop noodles until liquid absorbs." }
    ];

    saveToLocalStorage();
    renderRecipes();
    setStatus("Recipes loaded successfully from API!", "success");
  } catch (err) {
    setStatus("Error loading recipes: " + err.message, "error");
  }
}

function renderRecipes() {
  const container = document.getElementById("recipes-container");
  container.innerHTML = "";

  recipes.forEach(recipe => {
    let card = document.createElement("div");
    card.className = "recipe-card";
    card.innerHTML = `
      <h3>${recipe.name}</h3>
      <p style="white-space: pre-line;">${recipe.steps}</p>
      <button class="btn-edit" onclick="editRecipe(${recipe.id})">Edit</button>
      <button class="btn-delete" onclick="deleteRecipe(${recipe.id})">Delete</button>
    `;
    container.appendChild(card);
  });
}

document.getElementById("recipe-form").addEventListener("submit", async function(e) {
  e.preventDefault();

  let id = document.getElementById("edit-id").value;
  let name = document.getElementById("recipe-name").value;
  let steps = document.getElementById("recipe-steps").value;
  let btn = document.getElementById("save-btn");

  btn.disabled = true;

  if (id) {
    setStatus("Updating recipe via API...", "loading");
    try {
      let res = await fetch(`${API}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id, title: name, body: steps })
      });
      if (!res.ok) throw new Error("Update failed");

      let index = recipes.findIndex(r => r.id == id);
      if (index !== -1) {
        recipes[index] = { id: Number(id), name: name, steps: steps };
      }

      saveToLocalStorage();
      renderRecipes();
      clearForm();
      setStatus("Recipe updated successfully (PUT)!", "success");
    } catch (err) {
      setStatus("Error updating recipe: " + err.message, "error");
    }
  } else {
    // POST (Create)
    setStatus("Adding recipe via API...", "loading");
    try {
      let res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: name, body: steps })
      });
      if (!res.ok) throw new Error("Create failed");

      let data = await res.json();
      
      recipes.unshift({
        id: data.id || Date.now(),
        name: name,
        steps: steps
      });

      saveToLocalStorage();
      renderRecipes();
      clearForm();
      setStatus("Recipe added successfully (POST)!", "success");
    } catch (err) {
      setStatus("Error adding recipe: " + err.message, "error");
    }
  }

  btn.disabled = false;
});

async function deleteRecipe(id) {
  if (!confirm("Delete this recipe?")) return;

  setStatus("Deleting recipe via API...", "loading");
  try {
    let res = await fetch(`${API}/${id}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error("Delete failed");

    // Remove from local array & persist
    recipes = recipes.filter(r => r.id !== id);
    saveToLocalStorage();
    renderRecipes();
    setStatus("Recipe deleted successfully (DELETE)!", "success");
  } catch (err) {
    setStatus("Error deleting recipe: " + err.message, "error");
  }
}

function editRecipe(id) {
  let recipe = recipes.find(r => r.id === id);
  if (!recipe) return;

  document.getElementById("edit-id").value = recipe.id;
  document.getElementById("recipe-name").value = recipe.name;
  document.getElementById("recipe-steps").value = recipe.steps;

  document.getElementById("form-title").innerText = "Edit Recipe (PUT)";
  document.getElementById("save-btn").innerText = "Update Recipe";
  document.getElementById("cancel-btn").style.display = "block";
}

function clearForm() {
  document.getElementById("edit-id").value = "";
  document.getElementById("recipe-name").value = "";
  document.getElementById("recipe-steps").value = "";

  document.getElementById("form-title").innerText = "Add New Recipe";
  document.getElementById("save-btn").innerText = "Add Recipe (POST)";
  document.getElementById("cancel-btn").style.display = "none";
}

document.getElementById("cancel-btn").addEventListener("click", clearForm);

// Start initial load
loadRecipes();
