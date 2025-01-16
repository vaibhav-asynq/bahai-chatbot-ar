/*
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const filePath = "counter.json";

// Ensure counter.json exists
if (!fs.existsSync(filePath)) {
  fs.writeFileSync(
    filePath,
    JSON.stringify({ websiteVisits: 0, bahaiMembers: 0 })
  );
}

// Middleware to serve static files
app.use(express.static(path.join(__dirname, "public")));

app.get("/website-visit", (req, res) => {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  data.websiteVisits++;

  fs.writeFileSync(filePath, JSON.stringify(data));
  res.json({
    websiteVisits: data.websiteVisits,
    bahaiMembers: data.bahaiMembers,
  });
});

app.post("/bahai-member", (req, res) => {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  data.bahaiMembers++;

  fs.writeFileSync(filePath, JSON.stringify(data));
  res.json({ success: true, bahaiMembers: data.bahaiMembers });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
*/

const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

const COUNTER_FILE = path.join(__dirname, "counters.json");

let counters = {
  websiteVisits: 0,
  uniqueVisitors: 0,
  bahaiMembers: 0
};

if (fs.existsSync(COUNTER_FILE)) {
  try {
    counters = JSON.parse(fs.readFileSync(COUNTER_FILE, "utf8"));
  } catch (error) {
    console.error("Error reading counter file:", error);
  }
}

app.use(express.static(path.join(__dirname, "public"), {
  setHeaders: (res, path) => {
    if (path.endsWith('.mp4')) {
      res.set({
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000',
        'Content-Type': 'video/mp4'
      });
    }
  }
}));

app.get('/videos/:filename', (req, res) => {
  const videoPath = path.join(__dirname, 'public', 'videos', req.params.filename);

  if (!fs.existsSync(videoPath)) {
    return res.status(404).send('Video not found');
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(videoPath, {start, end});
    
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4'
    });
    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4'
    });
    fs.createReadStream(videoPath).pipe(res);
  }
});

app.get("/api/website-visit", (req, res) => {
  try {
    counters.websiteVisits += 1;
    fs.writeFileSync(COUNTER_FILE, JSON.stringify(counters));
    res.json({
      websiteVisits: counters.websiteVisits,
      uniqueVisitors: counters.uniqueVisitors,
      bahaiMembers: counters.bahaiMembers,
    });
  } catch (error) {
    console.error("Error in website-visit route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Internal Server Error');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});