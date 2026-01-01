import Contact from "../models/contact.js";

export async function createMessage(req, res) {
  try {
    const { firstName, lastName, email, mobile, message } = req.body;

    const newMessage = new Contact({
      firstName,
      lastName,
      email,
      mobile,
      message,
    });

    await newMessage.save();

    res.json({ message: "Message sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send message" });
  }
}


export async function getAllMessages(req, res) {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
}
