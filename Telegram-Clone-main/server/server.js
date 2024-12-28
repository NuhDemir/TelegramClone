const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const app = require("./app");

dotenv.config({ path: "./.env" });

// Connect database
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database connected..."))
  .catch((error) => {
    console.error("Database connection error:", error);
    process.exit(1);
  });

// Serve client folder
app.use(express.static(path.join(__dirname, "client", "build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "build", "index.html"));
});

// Export Express app (but not the server)
module.exports = app;
