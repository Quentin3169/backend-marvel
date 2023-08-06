const express = require("express");
const axios = require("axios");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI);

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  favorites: [String],
});

const User = mongoose.model("User", userSchema);

app.get("/characters", async (req, res) => {
  try {
    const response = await axios.get(
      "https://lereacteur-marvel-api.herokuapp.com/characters?apiKey=process.env.API_KEY&limit=100"
    );
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Vous avez une erreur" });
  }
});

app.get("/comics", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 100;
    const skip = Number(req.query.skip) || 0;

    const response = await axios.get(
      `https://lereacteur-marvel-api.herokuapp.com/comics?apiKey=process.env.API_KEY&limit=${limit}&skip=${skip}`
    );

    if (response.status === 200) {
      res.json(response.data);
    } else {
      res
        .status(500)
        .json({ message: "On arrive pas à atteindre les données de l'api" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "probleme dans le catch" });
  }
});

app.post("/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).send({
        error: "Vous avez deja créer un compte avec cette adresse mail",
      });
    }

    const user = new User({ email, password, name });
    await user.save();
    console.log(user);
    res.status(201).send({ message: "Bravo vous êtes inscrit" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Echec" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      return res.status(400).send({ error: "Email ou mot de passe incorrect" });
    }

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
    };

    res.status(200).send({
      message: "Vous êtes maintenant connecté !",
      user: userResponse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Erreur lors de la connexion" });
  }
});

app.post("/user/favorite", async (req, res) => {
  try {
    const { userId, characterId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ error: "Utilisateur non trouvé" });
    }

    const index = user.favorites.indexOf(characterId);
    if (index === -1) {
      user.favorites.push(characterId);
    } else {
      user.favorites.splice(index, 1);
    }

    await user.save();
    res.status(200).send({ favorites: user.favorites });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ error: "Erreur lors de la mise à jour des favoris" });
  }
});

app.get("/user/:userId/favorites", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ error: "Utilisateur non trouvé" });
    }

    res.status(200).send({ favorites: user.favorites });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ error: "Erreur lors de la récupération des favoris" });
  }
});

app.all("*", (req, res) => {
  console.log(`vous rentrez dans le kiff sans route `);
  res.send("Route sans coeur");
});

app.listen(process.env.PORT, () => console.log("Server started 😎 "));
