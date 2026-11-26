import { openDatabase } from "./connection.js";

const db = openDatabase();

try {
  // Docker runs this on every start. Existing checkmarks and pause times win.
  db.exec(`
    BEGIN;

    INSERT INTO reading_lists (id, name)
    VALUES
      (1, 'Victorian Era'),
      (2, 'Russian Literature')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO books (id, list_id, title, author)
    VALUES
      (1, 1, 'Oliver Twist',              'Charles Dickens'),
      (2, 1, 'Jane Eyre',                 'Charlotte Brontë'),
      (3, 1, 'Sherlock Holmes',           'Arthur Conan Doyle'),
      (4, 2, 'War & Peace',               'Leo Tolstoy'),
      (5, 2, 'The Brothers Karamazov',    'Fyodor Dostoevsky'),
      (6, 2, 'The Master and Margarita',  'Mikhail Bulgakov')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO video_progress (video_id, position_seconds)
    VALUES ('welcome', 0)
    ON CONFLICT (video_id) DO NOTHING;

    COMMIT;
  `);

  console.log("Reading lists, books, and welcome video progress are ready.");
} finally {
  db.close();
}
