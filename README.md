# WebVeda Reads

WebVeda Reads is a reading challenge for one demo reader. The Victorian Era and Russian Literature lists start with three unread books each. Mark a book as you finish it, or uncheck it if you made a mistake. The welcome video remembers where you paused, so you can come back and pick up from there.

[Try the live app](https://webveda-reads.manaverr200.workers.dev/) · [Run with Docker](Readme-Docker.md)

The live demo shares one reader’s progress across visitors, so you may find a few books already checked. Running the app locally gives you a separate SQLite database.

## Run locally

You’ll need Git and **Node.js 24.x** with npm. The commands below use PowerShell. If you’re using Docker, follow the [Docker instructions](Readme-Docker.md) instead.

**1. Clone the repository and build the React frontend.**

```powershell
git clone https://github.com/manaverr200/webvedareads.git WebVedaReads
cd WebVedaReads/frontend
npm ci
npm run build
```

**2. Install the backend dependencies and create the database.**

```powershell
cd ../backend
npm ci
Copy-Item .env.example .env
npm run db:setup
npm run db:seed
```

The example sets `PORT=3001` and `DATABASE_PATH=./data/reading.db`. That path is relative to `backend`. The setup script creates the tables and the seed script adds the lists, books, and starting video position. You can run the seed again later without losing your checkmarks.

**3. Start the app.**

```powershell
npm start
```

Express serves the built frontend and the API together. Open [localhost:3001](http://localhost:3001). If that port is busy, change `PORT` in `backend/.env` and use the new port in your browser. On later visits, just run `npm start` from `backend`.

## Check that it works

| Try this | What to look for |
| --- | --- |
| Open the app with a fresh database. | Victorian Era and Russian Literature each show **0 of 3 read**. |
| Mark *Oliver Twist* as read and refresh. | Its checkmark stays on, Victorian Era shows **1 of 3 read**, and the Russian Literature count stays at zero. |
| Play the welcome video, seek a few seconds ahead, pause, and refresh. | Pressing play resumes near the time you paused. Use a point before the end of the clip so you can see it resume. |
| Stop the backend with Ctrl+C, run `npm start` again, and refresh. | Both the checkmark and the video position survive the restart. |
| With the page open, stop the backend and try changing a checkmark. | A save-error popup appears and the checkbox and count return to their last saved values. Start the backend again when you’re done. |

To see the saved values directly, run these in a second PowerShell window while the backend is running. Adjust the port if you changed it in `.env`.

```powershell
$api = "http://localhost:3001/api"
$lists = Invoke-RestMethod "$api/reading-lists"
$lists | Format-Table name, readCount, totalBooks
Invoke-RestMethod "$api/video/progress"
```

## Scope and verification

The catalogue is fixed for this assignment. All changes belong to the same demo reader, and video progress is saved on pause. Closing the tab during playback can leave the previous pause point as the saved position.

I used AI assistance with the React interface, API checks, Docker packaging, and documentation. In a check with a fresh SQLite database, marking the same book as read twice left the count at one. After restarting Express, that count and a saved video position of 4.5 seconds were both still there. The API also returned `400` for a missing or non-boolean read status and `404` for an unknown book ID.
