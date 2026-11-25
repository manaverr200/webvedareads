import express from "express";
import { resolve } from "node:path";
import { openDatabase } from "./databaseConf/connection.js";

const app = express();
const db = openDatabase();
const port = Number(process.env.PORT || 3001);

app.use(express.json());
app.use(express.static(resolve(import.meta.dirname, "../frontend/dist")));

const findLists = db.prepare(`
  SELECT id, name
  FROM reading_lists
  ORDER BY id
`);

const findBooksByList = db.prepare(`
  SELECT id, title, author, is_read
  FROM books
  WHERE list_id = ?
  ORDER BY id
`);

const setBookStatus = db.prepare(`
  UPDATE books
  SET is_read = ?
  WHERE id = ?
`);

const findVideoProgress = db.prepare(`
  SELECT position_seconds AS positionSeconds
  FROM video_progress
  WHERE video_id = 'welcome'
`);

const setVideoProgress = db.prepare(`
  UPDATE video_progress
  SET position_seconds = ?
  WHERE video_id = 'welcome'
`);

app.get("/api/reading-lists", (req, res) => {
  const lists = findLists.all().map((list) => {
    const books = findBooksByList.all(list.id).map((book) => ({
      id: book.id,
      title: book.title,
      author: book.author,
      isRead: Boolean(book.is_read),
    }));

    return {
      id: list.id,
      name: list.name,
      books,
      readCount: books.filter((book) => book.isRead).length,
      totalBooks: books.length,
    };
  });

  res.json(lists);
});

app.put("/api/books/:id/status", (req, res) => {
  const id = Number(req.params.id);
  const isRead = req.body?.isRead;

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Book ID must be a positive integer." });
  }

  if (typeof isRead !== "boolean") {
    return res.status(400).json({ error: "isRead must be true or false." });
  }

  const result = setBookStatus.run(Number(isRead), id);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Book not found." });
  }

  res.json({ id, isRead });
});

app.get("/api/video/progress", (req, res) => {
  const progress = findVideoProgress.get();

  if (!progress) {
    return res.status(500).json({ error: "Welcome video progress is missing. Run the database seed." });
  }

  res.json(progress);
});

app.put("/api/video/progress", (req, res) => {
  const positionSeconds = req.body?.positionSeconds;

  // The player can pause between whole seconds. Keep that precision for resume.
  if (!Number.isFinite(positionSeconds) || positionSeconds < 0) {
    return res.status(400).json({ error: "positionSeconds must be a non-negative number." });
  }

  const result = setVideoProgress.run(positionSeconds);

  if (result.changes === 0) {
    return res.status(500).json({ error: "Welcome video progress is missing. Run the database seed." });
  }

  res.json({ positionSeconds });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ error: "The request body must contain valid JSON." });
  }

  console.error(error);
  res.status(500).json({ error: "The server could not complete the request." });
});

app.listen(port, () => {
  console.log(`WebVeda Reads is running at http://localhost:${port}`);
});