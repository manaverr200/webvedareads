import { useState } from "react";

function BookRow({ book, onSave }) {
  const [saving, setSaving] = useState(false);

  async function changeStatus(event) {
    const nextStatus = event.target.checked;
    setSaving(true);

    try {
      await onSave(book.id, nextStatus);
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="book">
      <div>
        <span className="book-title">{book.title}</span>
        <span className="book-author">{book.author}</span>
      </div>

      <label className="read-control">
        <input
          type="checkbox"
          checked={book.isRead}
          disabled={saving}
          onChange={changeStatus}
          aria-label={`${book.title}, read`}
        />
        <span>Read</span>
      </label>
    </li>
  );
}

export default function ReadingList({ list, onSave }) {
  return (
    <section className="reading-list panel" aria-labelledby={`list-${list.id}`}>
      <div className="list-heading">
        <h3 id={`list-${list.id}`}>{list.name}</h3>
        <span className="count">{list.readCount} of {list.totalBooks} read</span>
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
