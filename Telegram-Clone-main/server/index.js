const http = require("http");
const app = require("./server");
const socket = require("./socket");
const dotenv = require("dotenv"); // dotenv'i import ediyoruz
dotenv.config(); // .env dosyasını yükle
const PORT = process.env.PORT || 4000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
socket(server);

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
