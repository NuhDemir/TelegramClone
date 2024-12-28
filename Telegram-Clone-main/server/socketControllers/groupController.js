const {
  addMessageToGroup,
  checkMembersOffUndeliveredListInGroupMessage,
  addMessageAsUndeliveredToGroupMember,
  addMessageAsUnreadToGroupMember,
  markGroupMessageAsReadByUser,
} = require("../controllers/groupController");

exports.groupMessagingController = (io, socket) => {
  socket.on("group:message", async ({ groupId, message }) => {
    if (!socket.userId) return;

    // Save message to database
    const { messageObj, day } = await addMessageToGroup(groupId, message);

    // Broadcast message to group
    const groupMembers = new Set(); // Benzersiz kullanıcılar için bir Set oluştur
    io.timeout(180000)
      .to(groupId)
      .emit(
        "group:message",
        {
          groupId,
          message: messageObj,
          day,
          userId: socket.userId,
        },
        async (error, membersId) => {
          if (error) {
            console.log(error);
          } else {
            // Benzersiz kullanıcıları listeye ekleyin
            membersId.forEach((id) => groupMembers.add(id.toString()));

            // Unique identifier of a message in group
            const uniqueMessageDetails = {
              groupId,
              day,
              messageId: messageObj._id,
            };

            // Remove members from undelivered list
            const { undeliveredMembers } =
              await checkMembersOffUndeliveredListInGroupMessage({
                ...uniqueMessageDetails,
                membersId: Array.from(groupMembers), // Tekilleştirilmiş kullanıcı listesi
                io,
              });

            // Add message as undelivered to members that aren't currently online
            await addMessageAsUndeliveredToGroupMember({
              ...uniqueMessageDetails,
              undeliveredMembers,
            });

            // Add message as unread to all members of the group except sender of the message
            await addMessageAsUnreadToGroupMember({
              ...uniqueMessageDetails,
              unreadMembers: messageObj.unreadMembers.filter(
                (memberId) =>
                  memberId.toString() !== messageObj.sender.toString()
              ),
            });

            // Emit to all users that message can be read
            io.to(groupId).emit("group:messageCanBeRead", {
              ...uniqueMessageDetails,
              message: messageObj,
            });
          }
        }
      );
  });
};

exports.markGroupMessageReadController = (io, socket) => {
  socket.on(
    "group:messageRead",
    async ({ messageId, groupId, day, userId }) => {
      await markGroupMessageAsReadByUser({
        messageId,
        groupId,
        day,
        userId,
        io,
      });
    }
  );

  socket.on(
    "group:markMessagesAsRead",
    async ({ messages, groupId, userId }) => {
      for (let { messageId, day } of messages) {
        await markGroupMessageAsReadByUser({
          messageId,
          groupId,
          day,
          userId,
          io,
        });
      }
    }
  );
};
