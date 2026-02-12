import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
export const getAllContacts = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredMessages = await User.find({ _id: { $ne: loggedInUserId } }).select("-password")

        res.status(200).json(filteredMessages);

} catch (error) {
        console.error("Error in getAllContacts:", error);
        res.status(500).json({ message: "Internal Server error" });
}
};

export const getMessagesByUserId = async (req, res) => {
    try{
        const myId = req.user._id;
        const{id: userToChatId}= req.params;

        const messages = await Message.find({
            $or: [
                { sender: myId, recipient: userToChatId },
                { sender: userToChatId, recipient: myId },  
            ],
        });
        res.status(200).json(messages);
    } catch (error) {
        console.error("Error in getMessages controller:", error);
        res.status(500).json({ message: "Internal Server error" });
    }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if(!text && !image) {
      return res.status(400).json({ error: "Message text or image is required" });
     }
     if(senderId.equals(receiverId)){
      return res.status(400).json({ error: "Cannot send message to yourself" });
      }
      const recieverExists = await User.exists({ _id: receiverId });
      if(!recieverExists){
        return res.status(404).json({ error: "Receiver not found" });
      }    
      
    let imageUrl;
    if (image) {
      // upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

   
    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getChatPartners = async (req, res) => {
  try{
    const loggedInUserId = req.user._id;

    const messages = await Message.find({
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],

    });
    const chatPartnerIds =[
      ...new Set(messages.map((msg) =>
        msg.senderId.toString() === loggedInUserId.toString()
          ? msg.receiverId.toString()
          : msg.senderId.toString()
      )
    ),
    ];

    const chatPartners = await User.find({ _id: { $in: chatPartnerIds } }).select("-password");
    res.status(200).json(chatPartners);
  } catch(error){
    console.error("Error in getChatPartners :", error);
    res.status(500).json({ message: "Internal Server error" });
  }

};
