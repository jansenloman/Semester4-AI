const sqlite3 = require("sqlite3");

/**
 * Wrapper untuk kelas sqlite3.Statement yang menggunakan promise daripada callback
 */
class SQLiteStatement {
  #stmt;
  constructor(statement) {
    this.#stmt = statement;
  }
  run(params = []) {
    return new Promise((resolve, reject) => {
      this.#stmt.run(params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }
  get(params = []) {
    return new Promise((resolve, reject) => {
      this.#stmt.get(params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
  all(params = []) {
    return new Promise((resolve, reject) => {
      this.#stmt.all(params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
  each(callback, params = []) {
    return new Promise((resolve, reject) => {
      this.#stmt.each(params, (err, row) => {
        if (err) reject(err);
        else callback(row);
      });
      resolve();
    });
  }
  reset() {
    this.#stmt.reset((err) => {
      if (err) throw err;
    });
    return this;
  }
  finalize() {
    this.#stmt.finalize((err) => {
      if (err) throw err;
    });
  }
}

/**
 * Wrapper untuk kelas sqlite3.Database yang menggunakan promise daripada callback
 */
class SQLitePromise {
  #db;
  constructor(dbName = ":memory:") {
    this.#db = new sqlite3.Database(dbName, (err) => {
      if (err) throw err;
    });
  }
  prepare(sql, params = []) {
    return new SQLiteStatement(
      this.#db.prepare(sql, params, (err) => {
        if (err) throw err;
      })
    );
  }
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.#db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.#db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.#db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
  each(sql, callback, params = []) {
    return new Promise((resolve, reject) => {
      this.#db.each(sql, params, (err, row) => {
        if (err) reject(err);
        else callback(row);
      });
      resolve();
    });
  }
  close() {
    return new Promise((resolve, reject) => {
      this.#db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = {
  SQLitePromise,
};
