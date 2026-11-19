const axios = require("axios");

const WEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather";

async function getWeather(city = "Bengaluru") {
  const appId = process.env.OPEN_WEATHER_API_KEY;

  if (!appId) {
    const error = new Error("Weather API key is not configured");
    error.status = 500;
    throw error;
  }

  try {
    const response = await axios.get(WEATHER_API_URL, {
      params: {
        q: city,
        APPID: appId,
        units: "metric"
      },
      timeout: 5000
    });

    return response.data;

  } catch (err) {
    const error = new Error("Weather service is currently unavailable");
    error.status = 502;
    error.cause = err;
    throw error;
  }
}

module.exports = getWeather;
