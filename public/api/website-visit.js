import fs from 'fs';
import path from 'path';

const COUNTER_FILE = path.join(process.cwd(), 'counters.json');

// Ensure counters file exists
let counters = {
  websiteVisits: 0,
  uniqueVisitors: 0,
  bahaiMembers: 0
};

// Load existing counters (for Vercel serverless functions)
try {
  if (fs.existsSync(COUNTER_FILE)) {
    counters = JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf8'));
  }
} catch (error) {
  console.error('Error reading counter file:', error);
}

export default function handler(req, res) {
  try {
    // Increment website visits
    counters.websiteVisits += 1;

    // Save updated counters
    fs.writeFileSync(COUNTER_FILE, JSON.stringify(counters));

    res.status(200).json({
      websiteVisits: counters.websiteVisits,
      uniqueVisitors: counters.uniqueVisitors,
      bahaiMembers: counters.bahaiMembers,
    });
  } catch (error) {
    console.error('Error in website-visit route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}