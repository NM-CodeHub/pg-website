const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const axios = require("axios");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Make uploads folder public
app.use('/uploads', express.static('uploads'));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

// Serve the home page at the root URL
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "uploads", "index.html"));
});

// 📦 POST API - Local file upload
app.post('/upload', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({
    message: 'Image uploaded successfully!',
    filePath: `/uploads/${req.file.filename}`
  });
});


app.get('/pg-data', (req, res) => {
    const pgList = [
      { id: 1, name: "Dream PG", location: "Hyderabad", price: 6000 },
      { id: 2, name: "Comfort Stay", location: "Bangalore", price: 7500 }
    ];
    res.json(pgList);
  });

// 🧾 GET route to serve upload form
app.get('/upload-url-form', (req, res) => {
  res.sendFile(path.join(__dirname, 'upload-url.html'));
});

// 🌐 POST API - Upload using image URL
app.post('/upload-url', async (req, res) => {
  const imageUrl = req.body.imageUrl;
  try {
    const response = await axios.get(imageUrl, { responseType: 'stream' });
    const ext = path.extname(imageUrl).split('?')[0] || '.jpg';
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(__dirname, 'uploads', filename);

    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);

    writer.on('finish', () => {
      res.json({ message: "Image uploaded from URL", filePath: `/uploads/${filename}` });
    });
    writer.on('error', () => {
      res.status(500).json({ error: "Failed to save image" });
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch image from URL" });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${5000}`);
});
