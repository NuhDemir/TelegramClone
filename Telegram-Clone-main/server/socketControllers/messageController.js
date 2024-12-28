const {
  addMessageToChatRoom,
  checkMembersOffUndeliveredListInMessage,
  addMessageAsUndeliveredToUser,
  addMessageAsUnreadToUser,
  markMessageAsReadByUser,
} = require("../controllers/chatRoomController");

exports.messagingController = (io, socket) => {
  socket.on("user:message", async ({ chatRoomId, message }) => {
    if (!socket.userId) return;

    // Save message to database
    const { messageObj, day } = await addMessageToChatRoom(chatRoomId, message);

    // Broadcast message to room
    const roomMembers = new Set(); // Benzersiz kullanıcılar için bir Set oluştur
    io.timeout(180000)
      .to(chatRoomId)
      .emit(
        "user:message",
        {
          chatRoomId,
          message: messageObj,
          day,
          userId: socket.userId,
        },
        async (error, membersId) => {
          if (error) {
            console.log(error);
          } else {
            // Benzersiz kullanıcıları listeye ekleyin
            membersId.forEach((id) => roomMembers.add(id.toString()));

            // Unique identifier of a message in chatRoom
            const uniqueMessageDetails = {
              chatRoomId,
              day,
              messageId: messageObj._id,
            };

            // Remove members from undelivered list
            const { undeliveredMembers } =
              await checkMembersOffUndeliveredListInMessage({
                ...uniqueMessageDetails,
                membersId: Array.from(roomMembers), // Tekilleştirilmiş kullanıcı listesi
                io,
              });

            // Add message as undelivered to members that aren't currently online
            await addMessageAsUndeliveredToUser({
              ...uniqueMessageDetails,
              undeliveredMembers,
            });

            // Add message as unread to all members of the room except sender of the message
            await addMessageAsUnreadToUser({
              ...uniqueMessageDetails,
              unreadMembers: messageObj.unreadMembers.filter(
                (memberId) =>
                  memberId.toString() !== messageObj.sender.toString()
              ),
            });

            // Emit to all users that message can be read
            io.to(chatRoomId).emit("user:messageCanBeRead", {
              ...uniqueMessageDetails,
              message: messageObj,
            });
          }
        }
      );
  });
};

exports.markMessageReadController = (io, socket) => {
  socket.on(
    "user:messageRead",
    async ({ messageId, chatRoomId, day, userId }) => {
      await markMessageAsReadByUser({ messageId, chatRoomId, day, userId, io });
    }
  );

  socket.on(
    "user:markMessagesAsRead",
    async ({ messages, chatRoomId, userId }) => {
      for (let { messageId, day } of messages) {
        await markMessageAsReadByUser({
          messageId,
          chatRoomId,
          day,
          userId,
          io,
        });
      }
    }
  );
};
