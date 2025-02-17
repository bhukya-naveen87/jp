const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();

// Define the upload folders
const imageFolder = path.join(__dirname, 'uploads/images');
const videoFolder = path.join(__dirname, 'uploads/videos');


// Ensure the folders exist
if (!fs.existsSync(imageFolder)) {
  fs.mkdirSync(imageFolder, { recursive: true });
}

if (!fs.existsSync(videoFolder)) {
  fs.mkdirSync(videoFolder, { recursive: true });
}

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fileType = file.mimetype.split('/')[0];
    if (fileType === 'image') {
      cb(null, imageFolder);
    } else if (fileType === 'video') {
      cb(null, videoFolder);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
  filename: (req, file, cb) => {
    // Generate a unique timestamp-based filename
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    cb(null, `${timestamp}${extension}`);  // Rename file to timestamp
  }
});

const upload = multer({ storage });

// Serve static files (images and videos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static('public'));

// Route for uploading files
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  // Send success response without the file name
  res.send('File uploaded successfully!');
});

app.delete('/delete/:type/:filename', (req, res) => {
  const { type, filename } = req.params;
  let folderPath = type === 'image' ? imageFolder : type === 'video' ? videoFolder : null;

  if (!folderPath) {
    return res.status(400).json({ error: 'Invalid file type' });
  }

  const filePath = path.join(folderPath, filename);

  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Error deleting file' });
    }
    res.json({ success: true, filename });
  });
});


// Route for fetching image files
app.get('/images', (req, res) => {
  fs.readdir(imageFolder, (err, files) => {
    if (err) {
      return res.status(500).send('Error reading image folder');
    }
    res.json(files);
  });
});

// Route for fetching video files
app.get('/videos', (req, res) => {
  fs.readdir(videoFolder, (err, files) => {
    if (err) {
      return res.status(500).send('Error reading video folder');
    }
    res.json(files);
  });
});

app.get("/admin", async (req,res)=>{
  res.sendFile(path.join(__dirname, 'views/admin.html'))
})

app.get("/", async (req,res)=>{
  res.sendFile(path.join(__dirname, 'views/users.html'))
})
app.get("/user", async (req,res)=>{
  res.sendFile(path.join(__dirname, 'views/user.html'))
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

