const getWeather = require("../services/weatherService");
const logger = require("../utils/logger");

exports.getBengaluruWeather = async (req, res, next) => {
  try {
    const data = await getWeather("Bengaluru");

    logger.debug("Weather fetched", { city: data.name, userId: req.user.userId });

    res.json({
      city: data.name,
      country: data.sys?.country,
      temperature: data.main?.temp,
      feelsLike: data.main?.feels_like,
      humidity: data.main?.humidity,
      windSpeed: data.wind?.speed,
      description: data.weather?.[0]?.description,
      icon: data.weather?.[0]?.icon
    });

  } catch (error) {
    if (error.cause) {
      logger.error("OpenWeather request failed", {
        error: error.cause.message,
        upstreamStatus: error.cause.response?.status,
        upstreamMessage: error.cause.response?.data?.message
      });
    }

    next(error);
  }
};
