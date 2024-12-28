exports.addNewContact = catchAsyncError(async (req, res, next) => {
  const { name, username } = req.body;

  // Validate input
  if (!username) return next(new ReqError(400, "Contact username is needed"));

  // Get models for both users
  const user = await User.findById(req.cookies.userId);
  const newContact = await User.findOne({ username: username });

  // Validate models existence
  if (!newContact) return next(new ReqError(400, "User does not exist"));
  if (user.username === newContact.username)
    return next(new ReqError(400, "You can't add yourself as a contact"));

  // Validate addition of contacts
  for (let contact of user.contacts) {
    // Check if contact exists already
    if (contact.contactDetails.toString() === newContact._id.toString()) {
      return next(new ReqError(400, "Contact exists already"));
    }

    // Check if contact name exists and rename
    if (contact.name === name) {
      return next(new ReqError(400, "Contact name exists already"));
    }
  }

  // Check if chat room exists between users i.e check if newContact already has user as a contact
  let chatRoomId = await checkIfChatRoomExists(user, newContact);

  if (!chatRoomId) {
    // Create a chat room for both users
    const chatRoomDetails = {
      roomType: "Private",
      members: [newContact._id, user._id],
      messageHistory: [],
    };
