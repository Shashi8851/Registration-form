document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const cityInput = document.getElementById('city-input');
    const getWeatherBtn = document.getElementById('get-weather-btn');
    const locationBtn = document.getElementById('location-btn');
    const unitToggle = document.getElementById('unit-toggle');
    const themeToggle = document.getElementById('theme-toggle');
    const weatherInfo = document.getElementById('weather-info');
    const forecastSection = document.getElementById('forecast-section');
    const recentSearchesList = document.getElementById('recent-searches-list');

    // State management
    let currentUnit = 'metric'; // 'metric' for Celsius, 'imperial' for Fahrenheit
    const API_KEY = "2e98b7be755794d9bd32120f9e2603a8";
    const MAX_RECENT_SEARCHES = 5;

    // Initialize
    loadRecentSearches();
    initializeTheme();
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // Event Listeners
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') getWeatherBtn.click();
    });

    getWeatherBtn.addEventListener('click', () => {
        const city = cityInput.value.trim();
        if (city) {
            getWeatherData(city);
            addToRecentSearches(city);
        }
    });

    locationBtn.addEventListener('click', getCurrentLocation);
    unitToggle.addEventListener('click', toggleUnit);
    themeToggle.addEventListener('click', toggleTheme);

    // Recent searches functionality
    function addToRecentSearches(city) {
        let searches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        searches = searches.filter(item => item.toLowerCase() !== city.toLowerCase());
        searches.unshift(city);
        if (searches.length > MAX_RECENT_SEARCHES) searches.pop();
        localStorage.setItem('recentSearches', JSON.stringify(searches));
        loadRecentSearches();
    }

    function loadRecentSearches() {
        const searches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        recentSearchesList.innerHTML = searches
            .map(city => `<button class="recent-search-item" onclick="searchCity('${city}')">${city}</button>`)
            .join('');
    }

    // Weather data fetching
    async function getWeatherData(city) {
        showLoading();
        try {
            const [weatherData, forecastData] = await Promise.all([
                fetchCurrentWeather(city),
                fetchForecast(city)
            ]);
            displayWeatherData(weatherData);
            displayForecast(forecastData);
            hideError();
        } catch (error) {
            showError();
        } finally {
            hideLoading();
        }
    }

    async function fetchCurrentWeather(city) {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${currentUnit}&appid=${API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('City not found');
        return await response.json();
    }

    async function fetchForecast(city) {
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${currentUnit}&appid=${API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Forecast not found');
        return await response.json();
    }

    // Display functions
    function displayWeatherData(data) {
        weatherInfo.classList.remove('hidden');
        document.getElementById('city-name').textContent = `${data.name}, ${data.sys.country}`;
        document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}${getUnitSymbol()}`;
        document.getElementById('feels-like').textContent = `${Math.round(data.main.feels_like)}${getUnitSymbol()}`;
        document.getElementById('humidity').textContent = `${data.main.humidity}%`;
        document.getElementById('wind-speed').textContent = formatWindSpeed(data.wind.speed);
        document.getElementById('wind-direction').textContent = getWindDirection(data.wind.deg);
        document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
        document.getElementById('visibility').textContent = `${(data.visibility / 1000).toFixed(1)} km`;
        document.getElementById('description').textContent = capitalizeWords(data.weather[0].description);
        
        // Update sunrise/sunset times
        document.getElementById('sunrise').textContent = formatTime(data.sys.sunrise * 1000);
        document.getElementById('sunset').textContent = formatTime(data.sys.sunset * 1000);
        
        // Update weather icon
        const iconCode = data.weather[0].icon;
        document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        
        setWeatherBackground(data.weather[0].main);
    }

    function displayForecast(data) {
        const forecastContainer = document.getElementById('forecast-container');
        forecastSection.classList.remove('hidden');
        
        // Filter for one forecast per day
        const dailyForecasts = data.list.filter(item => item.dt_txt.includes('12:00:00'));
        
        forecastContainer.innerHTML = dailyForecasts
            .map(forecast => `
                <div class="forecast-item">
                    <h4>${formatDate(forecast.dt * 1000)}</h4>
                    <img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png" alt="Weather icon">
                    <p class="forecast-temp">${Math.round(forecast.main.temp)}${getUnitSymbol()}</p>
                    <p class="forecast-desc">${capitalizeWords(forecast.weather[0].description)}</p>
                </div>
            `).join('');
    }

    // Utility functions
    function updateDateTime() {
        const now = new Date();
        document.getElementById('current-date').textContent = formatDate(now);
        document.getElementById('current-time').textContent = formatTime(now);
    }

    function formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    }

    function formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function capitalizeWords(str) {
        return str.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    function getWindDirection(degrees) {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round(degrees / 45) % 8;
        return directions[index];
    }

    function formatWindSpeed(speed) {
        return currentUnit === 'metric' 
            ? `${Math.round(speed * 3.6)} km/h`
            : `${Math.round(speed)} mph`;
    }

    function getUnitSymbol() {
        return currentUnit === 'metric' ? '°C' : '°F';
    }

    // Theme management
    function initializeTheme() {
        const isDark = localStorage.getItem('darkTheme') === 'true';
        document.body.classList.toggle('dark-theme', isDark);
        updateThemeIcon(isDark);
    }

    function toggleTheme() {
        const isDark = document.body.classList.toggle('dark-theme');
        localStorage.setItem('darkTheme', isDark);
        updateThemeIcon(isDark);
    }

    function updateThemeIcon(isDark) {
        const icon = themeToggle.querySelector('i');
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }

    // Unit toggle
    function toggleUnit() {
        currentUnit = currentUnit === 'metric' ? 'imperial' : 'metric';
        unitToggle.textContent = currentUnit === 'metric' ? '°C | °F' : '°F | °C';
        if (cityInput.value.trim()) {
            getWeatherData(cityInput.value.trim());
        }
    }

    // Geolocation
    function getCurrentLocation() {
        if (navigator.geolocation) {
            locationBtn.disabled = true;
            navigator.geolocation.getCurrentPosition(
                position => {
                    getWeatherByCoords(position.coords.latitude, position.coords.longitude);
                    locationBtn.disabled = false;
                },
                error => {
                    showError('Location access denied');
                    locationBtn.disabled = false;
                }
            );
        }
    }

    async function getWeatherByCoords(lat, lon) {
        showLoading();
        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();
            displayWeatherData(data);
            cityInput.value = data.name;
            hideError();
        } catch (error) {
            showError();
        } finally {
            hideLoading();
        }
    }

    // Loading and error states
    function showLoading() {
        document.getElementById('loading').classList.remove('hidden');
        weatherInfo.classList.add('hidden');
        forecastSection.classList.add('hidden');
    }

    function hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    function showError(message = 'City not found. Please try again.') {
        document.getElementById('error-message').textContent = message;
        document.getElementById('error-message').classList.remove('hidden');
    }

    function hideError() {
        document.getElementById('error-message').classList.add('hidden');
    }

    // Make searchCity available globally
    window.searchCity = function(city) {
        cityInput.value = city;
        getWeatherBtn.click();
    };
});