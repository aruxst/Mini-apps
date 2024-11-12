// API and DOM element references
const apiKey = '081beff07cd8762e0e31a0e7be071d5d'; 
const accessToken = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwODFiZWZmMDdjZDg3NjJlMGUzMWEwZTdiZTA3MWQ1ZCIsIm5iZiI6MTczMTQyNDIyOC41NzQ2MzQsInN1YiI6IjY3MzM0NDUzNzlhMzJlNGE2YTUwMTZmNSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.uDxwfbr7n643ZxXWm81ALwQcjh0nrNu59PBY72Ed_Vo'
const baseUrl = 'https://api.themoviedb.org/3';
const searchInput = document.getElementById('search');
const autoSuggestBox = document.getElementById('auto-suggest');
const movieSection = document.getElementById('movies');
const watchlistContent = document.getElementById('watchlist-content');
const movieDetailsModal = document.getElementById('movie-details');
const closeModalBtn = document.getElementById('close-btn');
const watchlistModal = document.getElementById('watchlist-modal');
const closeWatchlistBtn = document.getElementById('close-watchlist-btn');

// Retrieve watchlist from localStorage or initialize an empty array
let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

// Save the watchlist to localStorage
function saveWatchlist() {
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
}

// Event listener to show movie suggestions as the user types in the search box
searchInput.addEventListener('input', async () => {
    const query = searchInput.value.trim();
    if (query.length < 2) { // Show suggestions only if input length is at least 2
        autoSuggestBox.innerHTML = '';
        autoSuggestBox.style.display = 'none';
        return;
    }

    // Get suggestions based on search input and display up to 5 unique titles
    const suggestions = await getMoviesByName(query);
    const uniqueSuggestions = Array.from(new Set(suggestions.map(film => film.title))).slice(0, 5);

    autoSuggestBox.innerHTML = uniqueSuggestions.map(title => `<div onclick="selectMovie('${title}')">${title}</div>`).join('');
    autoSuggestBox.style.display = uniqueSuggestions.length > 0 ? 'block' : 'none';
});

// Perform a search when the Enter key is pressed
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault(); // Prevent form submission
        searchMovies();
        autoSuggestBox.style.display = 'none';
    }
});

// Set the selected movie title in the search box and display results
function selectMovie(movieTitle) {
    searchInput.value = movieTitle;
    searchMovies();
    autoSuggestBox.style.display = 'none';
}

// Search for movies based on the input value and display results
async function searchMovies() {
    const query = searchInput.value.trim();
    if (!query) return;
    const films = await getMoviesByName(query);
    displayMovies(films);
    autoSuggestBox.style.display = 'none';
}

// Fetch movies by name from TMDb API
async function getMoviesByName(name) {
    const url = `${baseUrl}/search/movie?query=${name}&include_adult=false&language=en-US&page=1`;
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${accessToken}`
        }
    };
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        return data.results;
    } catch (err) {
        console.error(err);
        return [];       
    }
}

// Display movies in a grid layout on the page
function displayMovies(films) {
    movieSection.innerHTML = films.map(film => `
        <div class="filmCard">
            <img class="filmCardImg" src="https://image.tmdb.org/t/p/w500${film.poster_path}" alt="${film.title} Poster">
            <div class="filmCardInfo">
                <h2 class="filmCardTitle">${film.title}</h2>
                <p class="release-date">Release Date: ${film.release_date || 'N/A'}</p>
                <p class="rating">Rating: ${film.vote_average}</p>
                <button class="show-btn" onclick="showMovieDetails(${film.id})">Show</button>
                <button class="add-watchlist-btn" onclick="addToWatchlist(${JSON.stringify(film).replace(/"/g, '&quot;')})">Add to Watchlist</button>
            </div>
        </div>
    `).join('');
}

// Fetch detailed movie information and cast by movie ID
async function getFilmAllInfoById(id) {
    const url = `${baseUrl}/movie/${id}?append_to_response=credits&language=en-US`;
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${accessToken}`
        }
    };

    try {
        const res = await fetch(url, options);
        return await res.json();
    } catch (err) {
        console.error(err);
        return null;
    }
}

// Display movie details in a modal when "Show" button is clicked
async function showMovieDetails(movieId) {
    const film = await getFilmAllInfoById(movieId);

    if (film) {
        document.getElementById('movie-title').textContent = film.title;
        document.getElementById('synopsis').textContent = film.overview;
        document.getElementById('rating').textContent = film.vote_average;
        document.getElementById('runtime').textContent = `${film.runtime} minutes`;
        document.getElementById('movie-poster').src = `https://image.tmdb.org/t/p/w500${film.poster_path}`;
        document.getElementById('cast').textContent = film.credits.cast.slice(0, 5).map(actor => actor.name).join(', ');

        movieDetailsModal.style.display = 'flex';
    } else {
        console.error("Failed to fetch movie details.");
    }
}

// Close the movie details modal when clicking outside or on the close button
movieDetailsModal.addEventListener('click', (e) => {
    if (e.target === movieDetailsModal || e.target === closeModalBtn) {
        movieDetailsModal.style.display = 'none';
    }
});

// Add a movie to the watchlist and save it to localStorage
function addToWatchlist(film) {
    if (!watchlist.some(item => item.id === film.id)) {
        watchlist.push(film);
        saveWatchlist();
    }
}

// Display the watchlist in a modal
function showWatchlist() {
    watchlistContent.innerHTML = watchlist.length === 0 ? `<p>Your watchlist is empty.</p>` : watchlist.map(film => `
        <div class="filmCard">
            <img class="filmCardImg" src="https://image.tmdb.org/t/p/w500${film.poster_path}" alt="${film.title} Poster">
            <div class="filmCardInfo">
                <h2 class="filmCardTitle">${film.title}</h2>
                <p class="release-date">Release Date: ${film.release_date || 'N/A'}</p>
                <p class="rating">Rating: ${film.vote_average}</p>
                <button class="show-btn" onclick="showMovieDetails(${film.id})">Show</button>
                <button class="remove-watchlist-btn" onclick="removeFromWatchlist(${film.id})">Remove</button>
            </div>
        </div>
    `).join('');
    watchlistModal.style.display = 'flex';
}

// Remove a movie from the watchlist and update localStorage
function removeFromWatchlist(movieId) {
    watchlist = watchlist.filter(film => film.id !== movieId);
    saveWatchlist();
    showWatchlist();
}

// Close the watchlist modal when clicking outside or on the close button
watchlistModal.addEventListener('click', (e) => {
    if (e.target === watchlistModal || e.target === closeWatchlistBtn) {
        watchlistModal.style.display = 'none';
    }
});

// Close auto-suggestions when clicking outside the search area
document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !autoSuggestBox.contains(e.target)) {
        autoSuggestBox.style.display = 'none';
    }
});
