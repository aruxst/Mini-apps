const apiKey = '0370f8fe96526098821530db09713e19';
const searchInput = document.getElementById('search');
const searchButton = document.getElementById('search-button');
const autoSuggestBox = document.getElementById('auto-suggest');
const currentWeatherDiv = document.getElementById('current-weather');
const forecastDiv = document.getElementById('forecast-cards');
const useLocationBtn = document.getElementById('use-location');
const unitToggle = document.getElementById('unit-toggle');

let unit = 'metric'; // Default unit is Celsius

// Fetch weather data using onecall API
async function fetchWeatherData(lat, lon, unit) {
    try {
        const weatherResponse = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&units=${unit}&appid=${apiKey}`);
        const weatherData = await weatherResponse.json();
        return weatherData;
    } catch (error) {
        console.error("Error fetching weather data:", error);
        alert("Failed to retrieve weather data. Please try again.");
    }
}

// Fetch coordinates for a city using the OpenWeatherMap geocoding API
async function fetchCoordinates(city) {
    try {
        const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`);
        const data = await response.json();
        if (data.length === 0) {
            alert("City not found. Please enter a valid city name.");
            return null;
        }
        return { lat: data[0].lat, lon: data[0].lon };
    } catch (error) {
        console.error("Error fetching city coordinates:", error);
        alert("Failed to retrieve city coordinates. Please try again.");
    }
}

// Display current weather and forecast from onecall API response
async function displayCurrentWeather(lat, lon, cityName = '') {
    const data = await fetchWeatherData(lat, lon, unit);

    if (!data || !data.current) {
        console.error("Weather data is missing.");
        alert("Could not retrieve weather data.");
        return;
    }

    const weather = data.current.weather[0];
    document.getElementById('city-name').textContent = cityName || data.timezone || 'Unknown location';
    document.getElementById('weather-icon').src = `http://openweathermap.org/img/wn/${weather.icon}.png`;
    document.getElementById('temperature').textContent = `${data.current.temp}°`;
    document.getElementById('conditions').textContent = weather.description;
    document.getElementById('humidity').textContent = `Humidity: ${data.current.humidity}%`;
    document.getElementById('wind-speed').textContent = `Wind Speed: ${data.current.wind_speed} ${unit === 'metric' ? 'm/s' : 'mph'}`;

    // Display the 5-day forecast
    displayForecast(data.daily);
}

// Display 5-day forecast using daily data from onecall API
function displayForecast(dailyData) {
    forecastDiv.innerHTML = '';
    dailyData.slice(1, 6).forEach(day => {  // Get next 5 days
        const weather = day.weather[0];
        const date = new Date(day.dt * 1000);

        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <p>${date.toLocaleDateString()}</p>
            <img src="http://openweathermap.org/img/wn/${weather.icon}.png" alt="Weather Icon">
            <p>High: ${day.temp.max}°</p>
            <p>Low: ${day.temp.min}°</p>
            <p>${weather.description}</p>
        `;
        forecastDiv.appendChild(card);
    });
}

// Fetch and display weather for a searched city
async function searchCityWeather() {
    const city = searchInput.value.trim();
    if (city === '') {
        alert("Please enter a city name.");
        return;
    }

    const coordinates = await fetchCoordinates(city);
    if (coordinates) {
        displayCurrentWeather(coordinates.lat, coordinates.lon, city);
    }
}

// Handle search suggestions when typing in the search box
let debounceTimer;
searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const query = searchInput.value.trim();
    if (query.length > 2) {
        debounceTimer = setTimeout(() => fetchCitySuggestions(query), 300);
    } else {
        autoSuggestBox.innerHTML = '';
    }
});

// Fetch city suggestions for auto-complete
async function fetchCitySuggestions(query) {
    try {
        const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${apiKey}`);
        const cities = await response.json();
        displayAutoSuggest(cities);
    } catch (error) {
        console.error("Error fetching city suggestions:", error);
    }
}

// Display auto-suggestions for city names
function displayAutoSuggest(cities) {
    autoSuggestBox.innerHTML = '';
    cities.forEach(city => {
        const div = document.createElement('div');
        div.textContent = `${city.name}, ${city.country}`;
        div.addEventListener('click', () => {
            searchInput.value = city.name;
            displayCurrentWeather(city.lat, city.lon, city.name);
            autoSuggestBox.innerHTML = '';
        });
        autoSuggestBox.appendChild(div);
    });
}

// Automatically use current location on page load
window.onload = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            displayCurrentWeather(latitude, longitude);
        }, (error) => {
            console.error("Geolocation access denied or unavailable.", error);
            alert("Unable to access location. Please enable location services.");
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
};

// Use current location on button click
useLocationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            displayCurrentWeather(latitude, longitude);
        });
    } else {
        alert('Geolocation is not supported by this browser.');
    }
});

// Trigger search on button click
searchButton.addEventListener('click', searchCityWeather);

// Trigger search on Enter key press
searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        searchCityWeather();
    }
});

// Toggle units between Celsius and Fahrenheit
unitToggle.addEventListener('change', () => {
    unit = unitToggle.value;
    const city = document.getElementById('city-name').textContent;
    if (city && city !== '--') {
        searchCityWeather();
    }
});
