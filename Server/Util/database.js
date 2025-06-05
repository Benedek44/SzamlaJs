import Database from "better-sqlite3";

const db = new Database("./Data/database.sqlite");

db.prepare(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    taxnumber TEXT NOT NULL,
    isCustomer INTEGER NOT NULL CHECK(isCustomer IN (0,1))
)`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS szamla (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    issuer_id INTEGER,
    customer_id INTEGER,
    accountnumber TEXT NOT NULL,
    created DATE NOT NULL,
    completed DATE NOT NULL,
    deadline DATE NOT NULL,
    total INTEGER NOT NULL,
    vatrate INTEGER NOT NULL,
    isActive INTEGER NOT NULL CHECK(isActive IN (0,1)) DEFAULT 1,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (issuer_id) REFERENCES users(id) ON DELETE SET NULL
)`).run();

export const getUsers = () => db.prepare("SELECT * FROM users").all();
export const getUser = (id) => db.prepare("SELECT * FROM users WHERE id = ?").get(id);
export const saveUser = (name, address, taxnumber, isCustomer) =>
  db.prepare("INSERT INTO users (name, address, taxnumber, isCustomer) VALUES (?, ?, ?, ?)")
    .run(name, address, taxnumber, isCustomer);
export const updateUser = (id, name, address, taxnumber, isCustomer) =>
  db.prepare("UPDATE users SET name = ?, address = ?, taxnumber = ?, isCustomer = ? WHERE id = ?")
    .run(name, address, taxnumber, isCustomer, id);
export const deleteUser = (id) =>
  db.prepare("DELETE FROM users WHERE id = ?").run(id);


export const getSzamlak = () => db.prepare("SELECT * FROM szamla").all();

export const getSzamlaById = (id) =>
  db.prepare("SELECT * FROM szamla WHERE id = ?").get(id);

export const saveSzamla = (issuerId, customerId, accountnumber, created, completed, deadline, total, vatrate) => 
    db.prepare(`INSERT INTO szamla 
         (issuer_id, customer_id, accountnumber, created, completed, deadline, total, vatrate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(issuerId, customerId, accountnumber, created, completed, deadline, total, vatrate);

export const stornoSzamla = (id) =>
  db.prepare("UPDATE szamla SET isActive = 0 WHERE id = ?").run(id);

const users = [
  { name: "Ann", address: "6721, Szeged Londoni krt. 17", taxnumber: "1234785624-2-01", isCustomer: 1 },
  { name: "Bob", address: "6724, Szeged Csongrádi sgt. 45", taxnumber: "98765432-1-00", isCustomer: 1 },
  { name: "Noel", address: "6722, Szeged Szegedi utca 6.", taxnumber: "32165498-7-11", isCustomer: 1 },
  { name: "Martin", address: "6721, Szeged Londoni krt. 3", taxnumber: "10537914-4-44", isCustomer: 0 },
  { name: "Ricsi", address: "Budapest, WestEnd City Center, 24", taxnumber: "10189377-2-44", isCustomer: 0 },
  { name: "NAV", address: "6721 Szeged, Bocskai utca 14.", taxnumber: "15390708-2-41", isCustomer: 0 },
];

const rowCountUsers = db.prepare(`SELECT COUNT(*) AS count FROM users`).get().count;
if (rowCountUsers === 0) {
  for (const user of users) saveUser(user.name, user.address, user.taxnumber, user.isCustomer);
}

const szamla = [
  { issuerId: 4, customerId: 1, accountnumber: "2024/0650", created: "2025-05-29", completed: "2025-05-30", deadline: "2023-06-10", total: 1000, vatrate: 27 },
  { issuerId: 4, customerId: 1, accountnumber: "2022/7845", created: "2025-05-30", completed: "2025-05-30", deadline: "2023-06-05", total: 2500, vatrate: 27 },
  { issuerId: 4, customerId: 1, accountnumber: "2018/7874", created: "2025-06-04", completed: "2025-06-05", deadline: "2023-06-15", total: 28000, vatrate: 19 },
  { issuerId: 5, customerId: 2, accountnumber: "2019/2566", created: "2025-06-04", completed: "2025-06-05", deadline: "2023-06-15", total: 21000, vatrate: 27 },
  { issuerId: 5, customerId: 2, accountnumber: "2020/25787", created: "2025-06-10", completed: "2025-06-10", deadline: "2023-06-20", total: 172000, vatrate: 20 },
  { issuerId: 5, customerId: 2, accountnumber: "2017/00172", created: "2025-06-12", completed: "2025-06-13", deadline: "2023-06-15", total: 24500, vatrate: 27 },
  { issuerId: 6, customerId: 3, accountnumber: "2021/00002", created: "2025-06-18", completed: "2025-06-18", deadline: "2023-06-19", total: 39500, vatrate: 27 },
  { issuerId: 6, customerId: 3, accountnumber: "2022/01245", created: "2025-06-20", completed: "2025-06-20", deadline: "2023-06-25", total: 47900, vatrate: 27 },
  { issuerId: 6, customerId: 3, accountnumber: "2015/14756", created: "2025-06-25", completed: "2025-06-21", deadline: "2023-06-30", total: 99500, vatrate: 27 },
];

const rowCountSzamla = db.prepare(`SELECT COUNT(*) AS count FROM szamla`).get().count;
if (rowCountSzamla === 0) {
  for (const invoice of szamla) {
    saveSzamla(invoice.issuerId, invoice.customerId, invoice.accountnumber, invoice.created, invoice.completed, invoice.deadline, invoice.total, invoice.vatrate);
  }
}
