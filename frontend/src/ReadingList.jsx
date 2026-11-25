import { useState } from "react";

function BookRow({ book, onSave }) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function changeStatus(event) {
    const nextStatus = event.target.checked;

    setSaving(true);
    setSaveError("");

    try {
      await onSave(book.id, nextStatus);
    } catch {
      setSaveError("Couldn’t save this change. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="book-row">
      <div className="book-details">
        <span className="book-title">{book.title}</span>
        <span className="book-author">{book.author}</span>
      </div>

      <label className="read-control">
        <input
          type="checkbox"
          checked={book.isRead}
          disabled={saving}
          onChange={changeStatus}
          aria-label={`Mark ${book.title} as read`}
        />
        <span>{saving ? "Saving…" : "Read"}</span>
      </label>

      {saveError && <p className="save-error" role="alert">{saveError}</p>}
    </li>
  );
}

export default function ReadingList({ list, onSave }) {
  return (
    <section className="reading-list" aria-labelledby={`list-${list.id}`}>
      <div className="list-heading">
        <h2 id={`list-${list.id}`}>{list.name}</h2>
        <span className="read-count">
          {list.readCount} of {list.totalBooks} read
        </span>
      </div>

      <ul className="books">
        {list.books.map((book) => (
          <BookRow
            key={book.id}
            book={book}
            onSave={(bookId, isRead) => onSave(list.id, bookId, isRead)}
          />
        ))}
      </ul>
    </section>
  );
}