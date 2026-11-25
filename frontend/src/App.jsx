import { useEffect, useState } from "react";
import ReadingList from "./ReadingList.jsx";

export default function App() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadLists() {
      try {
        const response = await fetch("/api/reading-lists", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Reading lists could not be loaded.");
        }

        setLists(await response.json());
      } catch (error) {
        if (error.name !== "AbortError") {
          setLoadError("Couldn’t load the reading lists. Refresh the page to try again.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadLists();
    return () => controller.abort();
  }, []);

  async function saveBookStatus(listId, bookId, isRead) {
    const response = await fetch(`/api/books/${bookId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead }),
    });

    if (!response.ok) {
      throw new Error("Book status could not be saved.");
    }

    const savedBook = await response.json();

    // Wait for SQLite to confirm the change before moving the checkmark or count.
    setLists((currentLists) =>
      currentLists.map((list) => {
        if (list.id !== listId) return list;

        const books = list.books.map((book) =>
          book.id === savedBook.id ? { ...book, isRead: savedBook.isRead } : book
        );

        return {
          ...list,
          books,
          readCount: books.filter((book) => book.isRead).length,
        };
      })
    );
  }

  return (
    <>
      <header className="masthead">
        <div className="page-width">WebVeda Reads</div>
      </header>

      <main className="page-width">
        <h1>Reading Challenge</h1>

        {loading && <p role="status">Loading reading lists…</p>}
        {loadError && <p role="alert">{loadError}</p>}

        <div className="catalogue">
          {lists.map((list) => (
            <ReadingList key={list.id} list={list} onSave={saveBookStatus} />
          ))}
        </div>
      </main>
    </>
  );
}