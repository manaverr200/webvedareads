import { useEffect, useRef, useState } from "react";
import { requestJson, withMinimumLoader } from "./api.js";
import ReadingList from "./ReadingList.jsx";
import WelcomeVideo from "./WelcomeVideo.jsx";

const headerScrollDistance = 160;

export default function App() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [notice, setNotice] = useState("");
  const pageRef = useRef(null);
  const [listView, setListView] = useState("horizontal");

  useEffect(() => {
    const page = pageRef.current;
    function updateHeader() {
      const progress = Math.min(1, Math.max(0, window.scrollY / headerScrollDistance));
      page.style.setProperty("--header-travel", progress * headerScrollDistance + "px");
      page.style.setProperty("--header-expanded", 1 - progress);
      page.style.setProperty("--photo-row", (1 - progress) + "fr");
    }

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateHeader);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadLists() {
      setLoading(true);
      setLoadError(false);

      try {
        const data = await withMinimumLoader(
          requestJson("/api/reading-lists", { signal: controller.signal })
        );

        if (!controller.signal.aborted) setLists(data);
      } catch {
        if (!controller.signal.aborted) setLoadError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadLists();
    return () => controller.abort();
  }, [loadAttempt]);

  function updateBook(listId, bookId, isRead) {
    setLists((current) =>
      current.map((list) => {
        if (list.id !== listId) return list;

        const books = list.books.map((book) =>
          book.id === bookId ? { ...book, isRead } : book
        );
        return { ...list, books, readCount: books.filter((book) => book.isRead).length };
      })
    );
  }

  async function saveBookStatus(listId, bookId, isRead) {
    updateBook(listId, bookId, isRead);
    try {
      await requestJson(`/api/books/${bookId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead }),
      });
    } catch {
      // Undo only this toggle. Other books in the list can save independently.
      updateBook(listId, bookId, !isRead);
      setNotice("Couldn’t confirm your reading update. Please try again.");
    }
  }

  return (
    <div className="page" id="top" ref={pageRef} style={{ "--header-scroll-distance": headerScrollDistance + "px" }}>
      <div className="pinned-header">
        <header className="challenge-header">
          <div className="masthead">
            <div className="wordmark">
  <img className="title-icon" src="/favicon.svg" alt="" /> WebVeda Reads
</div>
            <h1>Reading Challenge</h1>
          </div>
          <div className="header-details">
            <div className="bookshelf-frame">
              <img
                className="bookshelf"
                src="/media/bookshelf.jpg"
                alt="A shelf of books"
              />
            </div>
          </div>
          <section className="intro panel" aria-label="About the challenge">
            <p>
              <strong>WebVeda Reads</strong> brings together two reading lists.
              Mark each book as you finish it and pick up the welcome video
              where you left off.
            </p>
          </section>
        </header>

        <WelcomeVideo onSaveError={setNotice} collapseScrollY={headerScrollDistance} />

        <div className="catalogue-heading">
          <h2 id="catalogue-title">Reading lists</h2>

          <div className="view-control">
            <span id="view-label">View</span>

            <div className="view-switch" role="group" aria-labelledby="view-label">
              <button
                type="button"
                title="Horizontal"
                aria-label="Horizontal"
                aria-pressed={listView === "horizontal"}
                onClick={() => setListView("horizontal")}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="2" y="5" width="5" height="14" rx="1" />
                  <rect x="9.5" y="5" width="5" height="14" rx="1" />
                  <rect x="17" y="5" width="5" height="14" rx="1" />
                </svg>
              </button>

              <button
                type="button"
                title="Stacked"
                aria-label="Stacked"
                aria-pressed={listView === "stacked"}
                onClick={() => setListView("stacked")}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="5" y="2" width="14" height="5" rx="1" />
                  <rect x="5" y="9.5" width="14" height="5" rx="1" />
                  <rect x="5" y="17" width="14" height="5" rx="1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main aria-label="Reading lists">
        <section id="reading-lists" aria-labelledby="catalogue-title">
          {loading && (
            <p className="loading panel" role="status">
              <span className="spinner" aria-hidden="true" />
              Loading reading lists…
            </p>
          )}

          {!loading && loadError && (
            <div className="panel message">
              <p role="alert">The reading lists couldn’t be loaded.</p>
              <button onClick={() => setLoadAttempt((n) => n + 1)}>
                Try again
              </button>
            </div>
          )}

          {!loading && !loadError && (
  <div className="reading-lists-layout" data-view={listView}>
    {lists.map((list) => (
      <ReadingList key={list.id} list={list} onSave={saveBookStatus} />
    ))}
  </div>
)}
        </section>

      </main>
      {notice && (
        <aside className="toast" aria-label="Save notification">
          <span role="alert">{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss notification">
            Dismiss
          </button>
        </aside>
      )}
    </div>
  );
}
