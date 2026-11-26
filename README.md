# WebVeda Reads

WebVeda Reads is a reading challenge for one demo reader.
2 Reading lists start with three unread books each.
Mark a book as you finish it. 
The welcome video remembers where you paused, so you can come back and pick up from there.

[Try the live app](https://webveda-reads.manaverr200.workers.dev/)


[Instructions to Run with Docker](Readme-Docker.md)

The live demo shares one reader’s progress across visitors.
So you may find a few books already checked. 

Running the app locally creates separate SQLite database.

## Run locally

Git and **Node.js 24.x** with npm are required.
The commands below use PowerShell.

**1. Clone the repository and build the React frontend.**

```powershell
git clone https://github.com/manaverr200/webvedareads.git WebVedaReads
cd WebVedaReads/frontend
npm ci
npm run build
```

**2. Install the backend dependencies, set the database up and seed it with pre defined Data.**

```powershell
cd ../backend
npm ci
Copy-Item .env.example .env
npm run db:setup
npm run db:seed
```

The example .env sets `PORT=3001` and `DATABASE_PATH=./data/reading.db`. That path is relative to `backend`. The setup script creates the tables and the seed script adds the lists, books, and starting video position. You can run the seed again later without losing your checkmarks.

**3. Start the app.**

```powershell
npm start
```

Express serves the built frontend and the API together.
Open [localhost:3001](http://localhost:3001).
If that port is busy, change `PORT` in `backend/.env` and use the new port in your browser.
On later visits, just run `npm start` from `backend`.

## Check that it works

| Try this | What to look for |
| --- | --- |
| Open the app with a fresh database. | Victorian Era and Russian Literature each show **0 of 3 read**. |
| Mark *Oliver Twist* as read and refresh. | Its checkmark stays on, Victorian Era shows **1 of 3 read**, and the Russian Literature count stays at zero. |
| Play the welcome video, seek a few seconds ahead, pause, and refresh. | Pressing play resumes near the time you paused. Use a point before the end of the clip so you can see it resume. |
| Stop the backend with Ctrl+C, run `npm start` again, and refresh. | Both the checkmark and the video position survive the restart. |
| With the page open, stop the backend and try changing a checkmark. | A save-error popup appears and the checkbox and count return to their last saved values. Start the backend again when you’re done. |

## Check the API

Leave the backend running and open a second PowerShell window. 
(Use your configured port if you changed it.)

```powershell
$api = 'http://localhost:3001/api'
$lists = Invoke-RestMethod "$api/reading-lists"
$lists | Format-Table name, readCount, totalBooks
Invoke-RestMethod "$api/video/progress"
```

Each list should have three books. The video endpoint returns the saved position in seconds.

**Repeat a save.** This marks *Oliver Twist* as read twice, shows the count after each request, then restores its original status. The two counts should match.

```powershell
$bookUrl = "$api/books/1/status"
$original = ($lists.books | Where-Object { $_.id -eq 1 }).isRead
foreach ($attempt in 1..2) {
    Invoke-RestMethod $bookUrl -Method Put -ContentType 'application/json' -Body '{"isRead":true}' | Out-Null
    $current = Invoke-RestMethod "$api/reading-lists"
    $current | Where-Object { $_.name -eq 'Victorian Era' } | Select-Object name, readCount
}
Invoke-RestMethod $bookUrl -Method Put -ContentType 'application/json' -Body (@{ isRead = $original } | ConvertTo-Json) | Out-Null
```

**Try invalid updates.** Run the block below. The first request should return `404` for an unknown book. The other three should return `400` for a missing status, a string in place of a boolean, and a negative video position.

```powershell
function Test-Update($url, $body) {
    try {
        $reply = Invoke-WebRequest -UseBasicParsing -Uri $url -Method Put -ContentType 'application/json' -Body $body
        [int]$reply.StatusCode
    } catch {
        if (!$_.Exception.Response) { throw }
        [int]$_.Exception.Response.StatusCode
    }
}

Test-Update "$api/books/999/status" '{"isRead":true}'
Test-Update $bookUrl '{}'
Test-Update $bookUrl '{"isRead":"true"}'
Test-Update "$api/video/progress" '{"positionSeconds":-1}'
```

## Scope and verification

The Book Catalogue is fixed for this assignment.
All changes belong to the same demo reader.
Video progress is saved on pause. Closing the tab during playback can leave the previous pause point as the saved position.

## AI Usage - Codex by ChatGPT

- Used Codex to refine the reading-list layouts, pinned header, and video player.
- Used it to draft the Docker setup and README, and to test the Express API against a fresh SQLite database.
- The powershell commands to check Invalid Book IDs, invalid input for Video Progress Save - all by GPT.
- Wrangler Deployment Instructions
