# Run WebVeda Reads with Docker

Install Docker Desktop, select Linux containers, and start Docker Desktop.
Clone this repository and open a terminal in the folder containing `compose.yaml`.

## Build and run

```sh
docker compose -f compose.yaml up --build -d
```

Open http://localhost:8080. The first build installs the dependencies and
builds the React frontend. Express serves the website and API from one
container. On first startup, the app creates and seeds its SQLite database.

## Verify

1. On a fresh volume, confirm that Victorian Era and Russian Literature each
   show three books and zero read.
2. Mark a book as read. Refresh the page and confirm the checkmark and list
   count are saved.
3. Play the welcome video for several seconds, pause it, refresh the page,
   and press play. Confirm it resumes near the saved position.
4. To verify persistence across container replacement, run the stop command
   below, then run the build-and-run command again from the same folder.
   Confirm the book status and video position are still saved.

## Stop

```sh
docker compose -f compose.yaml down
```

The named volume keeps the SQLite database for the next run.