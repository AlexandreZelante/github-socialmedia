const axios = require("axios");
const Dev = require("../models/Dev");
const parseStringAsArray = require("../utils/parseStringAsArray");
const { findConnections, sendMessage } = require("../websocket");

//index, show, store, update, destroy

module.exports = {
  async index(req, res) {
    const devs = await Dev.find();
    console.log(devs);

    res.json(devs);
  },

  async store(req, res) {
    const { github_username, techs, latitude, longitude } = req.body;

    let dev = await Dev.findOne({ github_username });

    if (!dev) {
      const apiResponse = await axios.get(
        `https://api.github.com/users/${github_username}`
      );

      const { name = login, avatar_url, bio } = apiResponse.data;

      const techsArray = parseStringAsArray(techs);

      const location = {
        type: "Point",
        coordinates: [longitude, latitude]
      };

      dev = await Dev.create({
        github_username,
        name,
        avatar_url,
        bio,
        techs: techsArray,
        location
      });

      //Filtrar as conexões que estão há no máximo 10km de distancia
      //e que o novo dev tenha pelo menos 1 das tecnologias filtradas

      const sendSocketMessageTo = findConnections(
        { latitude, longitude },
        techsArray
      );
      console.log("Send Socket message to: ", sendSocketMessageTo);
      sendMessage(sendSocketMessageTo, "new-dev", dev);
    }

    res.json(dev);
  }
};
