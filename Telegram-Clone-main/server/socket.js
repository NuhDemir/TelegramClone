const socketIO = require("socket.io");

const {
  callRequestController,
  callAcceptedController,
  endCallController,
  callDeniedController,
} = require("./socketControllers/callController");

const {
  onlineController,
  offlineController,
  disconnectingController,
  joinRoomController,
} = require("./socketControllers/connectionController");

const {
  messagingController,
  markMessageReadController,
} = require("./socketControllers/messageController");

const {
  typingController,
  recordingcontroller,
  clearChatRoomController,
} = require("./socketControllers/userActionController");

module.exports = (server) => {
  const io = socketIO(server);

  io.on("connection", (socket) => {
    // Connection controls
    onlineController(io, socket);
    offlineController(io, socket);
    disconnectingController(io, socket);
    joinRoomController(io, socket);

    // User actions
    typingController(io, socket);
    recordingcontroller(io, socket);
    clearChatRoomController(io, socket);

    // Messaging
    messagingController(io, socket);
    markMessageReadController(io, socket);

    // Call controls
    callRequestController(io, socket);
    callAcceptedController(io, socket);
    endCallController(io, socket);
    callDeniedController(io, socket);
  });
};
