require("dotenv").config();
const PORT = process.env.PORT || 8080;
const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const DURATION = process.env.DURATION * 1000 * 60;

const character = require("./controllers/routes/character");

const express = require("express");
const app = express();
app.use((err, req, res, next) => {
  const { statusCode, message } = err;
  res.status(statusCode).json({
    status: "error",
    statusCode,
    message,
  });
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) =>
  res.json({ message: "Welcome to our Xendit Heroes!" })
);
app.route("/characters").get(character.getCharacterIDs);
app.route("/characters/:characterId").get(character.getCharacter);
app.route("/clear-cache-all").get(character.clearAllCache);

if (PUBLIC_KEY && PRIVATE_KEY) {
  app.listen(PORT, function () {
    console.log(`The app running on port ${PORT}`);
    console.log(
      `Cache will be expired at: ${new Date(new Date().getTime() + DURATION)} `
    );
  });
} else {
  console.error(
    "Can't start the application. Please add the configs: PUBLIC_KEY,  PRIVATE_KEY and MARVEL_API_URL"
  );
  process.exit(1);
}
module.exports = app;
