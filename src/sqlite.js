/**
 * Module handles database management
 *
 * Server API calls the methods in here to query and update the SQLite database
 */

// Utilities we need
const fs = require("fs");

// Initialize the database
const dbFile = "./.data/requests.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const dbWrapper = require("sqlite");
let db;

/* 
We're using the sqlite wrapper so that we can make async / await connections
- https://www.npmjs.com/package/sqlite
*/
dbWrapper
  .open({
    filename: dbFile,
    driver: sqlite3.Database
  })
  .then(async dBase => {
    db = dBase;

    // We use try and catch blocks throughout to handle any database errors
    try {
      // The async / await syntax lets us write the db operations in a way that won't block the app
      if (!exists) {
        // Database doesn't exist yet - create Choices and Log tables
        await db.run(
          "CREATE TABLE requests (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT, phone INTEGER, requirements TEXT, category TEXT, created_at TEXT)"
        );

//         // Add default choices to table
//         await db.run(
//           "INSERT INTO Choices (language, picks) VALUES ('HTML', 0), ('JavaScript', 0), ('CSS', 0)"
//         );

//         // Log can start empty - we'll insert a new record whenever the user chooses a poll option
//         await db.run(
//           "CREATE TABLE Log (id INTEGER PRIMARY KEY AUTOINCREMENT, choice TEXT, time STRING)"
//         );
      } else {
        // We have a database already - write Choices records to log for info
        // console.log(await db.all("SELECT * from Choices"));

        //If you need to remove a table from the database use this syntax
        //db.run("DROP TABLE Logs"); //will fail if the table doesn't exist
      }
    } catch (dbError) {
      console.error(dbError);
    }
  });

// Our server script will call these methods to connect to the db
module.exports = {
  /**
   * Save a request
   */
  saveRequest: async data => {
    // Insert new Log table entry indicating the user choice and timestamp
    try {
      return await db.run("INSERT INTO requests (email, phone, requirements, category, created_at) VALUES (?, ?, ?, ?, ?)", [
          data.email,
          data.phone,
          data.requirements,
          data.choix,
          new Date().toISOString()
        ]);
    } catch (dbError) {
      console.error(dbError);
    }
  },
};
