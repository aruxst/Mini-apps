// API key for Spoonacular API
const apiKey = '512304e633c649169e077e3e89f0a9f4';

// Get references to HTML elements for easier access
const recipeGrid = document.getElementById('recipe-grid');
const favoriteRecipesContainer = document.getElementById('favorite-recipes');
const recipeModal = document.getElementById('recipe-modal');
const closeModalButton = document.getElementById('close-button');
const favoritesModal = document.getElementById('favorites-modal');
const closeFavoritesButton = document.getElementById('close-favorites-button');
const searchInput = document.getElementById('search-input');
const suggestionsBox = document.getElementById('suggestions');
const searchButton = document.getElementById('search-button');
const showFavoritesButton = document.getElementById('show-favorites-button');

// Initialize favorites from localStorage or an empty array if none
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// Save the current favorites to localStorage
function saveFavorites() {
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

// Debounce timer for search suggestions
let debounceTimer;
searchInput.addEventListener('input', function () {
  clearTimeout(debounceTimer); // Clear previous timer
  const query = this.value.trim(); // Get the trimmed query
  
  // Set debounce delay for search suggestions
  debounceTimer = setTimeout(async () => {
    if (query.length > 2) {
      const recipes = await fetchRecipes(query); // Fetch recipes for the query
      const uniqueSuggestions = [...new Set(recipes.map(recipe => recipe.title))].slice(0, 5); // Unique top 5 suggestions
      suggestionsBox.innerHTML = uniqueSuggestions.map(title => `<div onclick="selectRecipe('${title}')">${title}</div>`).join('');
      suggestionsBox.style.display = 'block'; // Show suggestions box
    } else {
      suggestionsBox.style.display = 'none'; // Hide suggestions box if query is too short
    }
  }, 300); // Delay of 300ms for debounce
});

// Event listener for the search button
searchButton.addEventListener('click', searchRecipes);
// Event listener to trigger search on pressing "Enter"
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    searchRecipes();
  }
});

// Set selected recipe title in input and search for it
function selectRecipe(title) {
  searchInput.value = title;
  searchRecipes();
  suggestionsBox.style.display = 'none';
}

// Search recipes based on query entered
async function searchRecipes() {
  const query = searchInput.value.trim();
  if (query.length < 3) return; // Ignore if query is too short
  const recipes = await fetchRecipes(query); // Fetch recipes
  displayRecipes(recipes); // Display the recipes
  suggestionsBox.style.display = 'none';
}

// Fetch recipes from Spoonacular API based on query
async function fetchRecipes(query) {
  const response = await fetch(`https://api.spoonacular.com/recipes/complexSearch?query=${query}&apiKey=${apiKey}`);
  const data = await response.json();
  return data.results; // Return recipe results
}

// Display fetched recipes in the recipe grid
function displayRecipes(recipes) {
  recipeGrid.innerHTML = recipes.map(recipe => `
    <div class="recipe-card">
      <img src="https://spoonacular.com/recipeImages/${recipe.id}-312x231.jpg" alt="${recipe.title}">
      <h3>${recipe.title}</h3>
      <button onclick="showRecipeDetails(${recipe.id})">View Recipe</button>
      <button onclick="addToFavorites(${recipe.id})">Add to Favorites</button>
    </div>
  `).join('');
}

// Show detailed recipe information in a modal window
async function showRecipeDetails(recipeId) {
  favoritesModal.style.display = 'none'; // Hide favorites modal if open
  const recipe = await fetchRecipeDetails(recipeId); // Fetch recipe details
  if (recipe) {
    // Populate modal with recipe details
    document.getElementById('recipe-image').src = recipe.image;
    document.getElementById('recipe-title').textContent = recipe.title;
    document.getElementById('recipe-description').innerHTML = recipe.summary || 'Description not available.';
    document.getElementById('recipe-ingredients').innerHTML = recipe.extendedIngredients.map(ing => `<li>${ing.original}</li>`).join('');
    document.getElementById('recipe-instructions').textContent = recipe.instructions || 'Instructions not available.';
    document.getElementById('calories').textContent = recipe.nutrition?.nutrients.find(n => n.name === 'Calories')?.amount || 'N/A';
    document.getElementById('protein').textContent = recipe.nutrition?.nutrients.find(n => n.name === 'Protein')?.amount || 'N/A';
    document.getElementById('fat').textContent = recipe.nutrition?.nutrients.find(n => n.name === 'Fat')?.amount || 'N/A';
    
    recipeModal.style.display = 'flex'; // Show recipe modal
  }
}

// Fetch detailed recipe information with nutrition included
async function fetchRecipeDetails(recipeId) {
  const response = await fetch(`https://api.spoonacular.com/recipes/${recipeId}/information?includeNutrition=true&apiKey=${apiKey}`);
  return await response.json();
}

// Close recipe modal on close button click
closeModalButton.addEventListener('click', () => {
  recipeModal.style.display = 'none';
});

// Close modal when clicking outside of modal content
recipeModal.addEventListener('click', (e) => {
  if (e.target === recipeModal) {
    recipeModal.style.display = 'none';
  }
});

// Show favorites modal with saved recipes
showFavoritesButton.addEventListener('click', () => {
  loadFavorites(); // Load favorites
  favoritesModal.style.display = 'flex'; // Show favorites modal
});

// Close favorites modal on close button click
closeFavoritesButton.addEventListener('click', () => {
  favoritesModal.style.display = 'none';
});

// Close favorites modal when clicking outside of modal content
favoritesModal.addEventListener('click', (e) => {
  if (e.target === favoritesModal) {
    favoritesModal.style.display = 'none';
  }
});

// Add a recipe to the favorites list
function addToFavorites(recipeId) {
  if (!favorites.includes(recipeId)) {
    favorites.push(recipeId); // Add to favorites if not already included
    saveFavorites(); // Save to localStorage
    loadFavorites(); // Refresh favorites list
  }
}

// Load favorite recipes and display them in favorites modal
function loadFavorites() {
  favoriteRecipesContainer.innerHTML = '';
  favorites.forEach(async (recipeId) => {
    const recipe = await fetchRecipeDetails(recipeId); // Fetch each favorite recipe details
    const favoriteCard = document.createElement('div');
    favoriteCard.classList.add('recipe-card');
    favoriteCard.innerHTML = `
      <img src="${recipe.image}" alt="${recipe.title}">
      <h3>${recipe.title}</h3>
      <button onclick="showRecipeDetails(${recipeId})">View Recipe</button>
      <button onclick="removeFromFavorites(${recipeId})">Remove</button>
    `;
    favoriteRecipesContainer.appendChild(favoriteCard);
  });
}

// Remove a recipe from the favorites list
function removeFromFavorites(recipeId) {
  favorites = favorites.filter(id => id !== recipeId); // Remove recipe from favorites
  saveFavorites(); // Update localStorage
  loadFavorites(); // Refresh favorites list
}

// Hide suggestions box when clicking outside search input or suggestions box
document.addEventListener('click', (e) => {
  if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
    suggestionsBox.style.display = 'none';
  }
});

// Load favorites on page load
window.onload = loadFavorites;
