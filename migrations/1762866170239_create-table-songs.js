/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable("songs", {
    id: {
      type: "varchar(50)",
      notNull: true,
      primaryKey: true,
    },
    title: {
      type: "text",
      notNull: true,
    },
    year: {
      type: "integer",
      notNull: true,
    },
    genre: {
      type: "text",
      notNull: true,
    },
    performer: {
      type: "text",
      notNull: true,
    },
    duration: {
      type: "integer",
    },
    album_id: {
      type: "varchar(50)",
      references: "albums",
      onDelete: "CASCADE",
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("songs");
};
