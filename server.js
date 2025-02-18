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
// Define storage settings
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
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);

    // Get category from req.body after Multer processes the request
    const category = req.body.category ? req.body.category.replace(/\s+/g, '_') : 'uncategorized';
    cb(null, `${category}_${timestamp}${extension}`); // Append category + timestamp
  }
});

// const upload = multer({ storage });
// Use memory storage to process form data first
const upload = multer({ storage: multer.memoryStorage() });

// Serve static files (images and videos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static('public'));
// app.use(express.static('images'));

// Route for uploading files
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  if (!req.body.category) {
    return res.status(400).json({ error: 'Category is required' });
  }

  const category = req.body.category.replace(/\s+/g, '_'); // Format category name
  const timestamp = Date.now();
  const extension = path.extname(req.file.originalname);

  // Determine folder based on file type
  const fileType = req.file.mimetype.split('/')[0];
  const folder = fileType === 'image' ? imageFolder : fileType === 'video' ? videoFolder : null;

  if (!folder) {
    return res.status(400).json({ error: 'Invalid file type.' });
  }

  // Create file name
  const filename = `${category}_${timestamp}${extension}`;
  const filePath = path.join(folder, filename);

  // Save file to disk manually
  fs.writeFile(filePath, req.file.buffer, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Error saving file.' });
    }

    res.json({ message: 'File uploaded successfully!', filename });
  });
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
app.get('/images/:portfolio', (req, res) => {
  const { portfolio } = req.params;
  // console.log("img: ", portfolio)
  fs.readdir(imageFolder, (err, files) => {
    if (err) {
      return res.status(500).send('Error reading image folder');
    }
    if(portfolio != "all"){
      files = files.filter(file => file.toLowerCase().includes(portfolio.toLowerCase()))
    }
    res.json(files);
  });
});

// Route for fetching video files
app.get('/videos/:portfolio', (req, res) => {
  const { portfolio } = req.params;
  // console.log("video: ", portfolio)
  fs.readdir(videoFolder, (err, files) => {
    if (err) {
      return res.status(500).send('Error reading video folder');
    }
    if(portfolio != "all"){
      files = files.filter(file => file.toLowerCase().includes(portfolio.toLowerCase()))
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

