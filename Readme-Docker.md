# Run WebVeda Reads with Docker

Install & Start Docker Desktop (Select Linux containers)
Clone this repository and open a terminal in the root directory containing `compose.yaml`.

## Build and run
Run the following command from the abovemmentioned terminal: 
```sh
docker compose -f compose.yaml up --build -d
```
Once the build is complete and the Conatiner status shows Started,

Open http://localhost:18080 to access the local application.
On first startup, the app creates and seeds its SQLite database automatically.

## Verification Steps

1. On a fresh build, confirm 2 reading lists each showing 0 of 3 Books Read.
2. Mark a book as read. Refresh the page and confirm that the read status and list
   count are saved.
3. Play the welcome video for several seconds, pause it, refresh the page,
   and press play. Verify that it resumes at the saved position.
4. To verify container persistence, run the stop command (mentioned in the next section)
   build again, and verify that the book status and video position are still saved.

## Stop

```sh
docker compose -f compose.yaml down
```

The SQLite database is preserved for the next run.