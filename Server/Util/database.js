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
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (issuer_id) REFERENCES users(id) ON DELETE CASCADE
  )`).run();

export const getUsers = () => db.prepare("SELECT * FROM users").all();

export const getUser = (id) => db.prepare("SELECT * FROM users WHERE id = ?").get(id);

export const saveUser = (name, address, taxnumber, isCustomer) => db.
prepare("INSERT INTO users (name, address, taxnumber, isCustomer) VALUES (?, ?, ?, ?)")
.run(name, address, taxnumber, isCustomer);

export const updateUser = (id, name, address, taxnumber, isCustomer) => db
.prepare("UPDATE users SET name = ?, address = ?, taxnumber = ?, isCustomer = ? WHERE id = ?")
.run(name, address, taxnumber, isCustomer, id);

export const deleteUser = (id) => db
.prepare("DELETE FROM users WHERE id = ?")
.run(id);

export const getSzamla = () => db.prepare("SELECT * FROM szamla").all();

export const getSzamlaById = (id) => db.prepare("SELECT * FROM szamla WHERE id = ?").get(id);

export const saveSzamla = (issuerId, customerId, accountnumber, created, completed, deadline, total, vatrate) => db
.prepare("INSERT INTO szamla (issuer_id, customer_id, accountnumber, created, completed, deadline, total, vatrate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
.run(issuerId, customerId, accountnumber, created, completed, deadline, total, vatrate);

export const updateSzamla = (id, issuerId, customerId, accountnumber, created, completed, deadline, total, vatrate) => db
.prepare("UPDATE szamla SET issuer_id = ?, customer_id = ?, accountnumber = ?, created = ?, completed = ?, deadline = ?, total = ?, vatrate = ? WHERE id = ?")
.run(issuerId, customerId, accountnumber, created, completed, deadline, total, vatrate, id);

export const deleteSzamla = (id) => db
.prepare("DELETE FROM szamla WHERE id = ?")
.run(id);

const users = [
    {name: "Ann", address: "6721, Szeged Londoni krt. 17", taxnumber: "xxxxxxxx-y-zz", isCustomer: 1},
    {name: "Bob", address: "6724, Szeged Csongrádi sgt. 45", taxnumber: "98765432-1-00", isCustomer: 1},
    {name: "Noel", address: "6722, Szeged Szegedi utca 6.", taxnumber: "32165498-7-11", isCustomer: 1},
    {name: "OTP bank", address: "6721, Szeged Londoni krt. 3", taxnumber: "10537914-4-44", isCustomer: 0},
    {name: "Gránit bank", address: "Budapest, WestEnd City Center, 24", taxnumber: "10189377-2-44", isCustomer: 0},
    {name: "Raiffeisen Bank", address: "6722, Szeged, Kossuth Lajos sgrt. 9", taxnumber: "10198014-4-44", isCustomer: 0},
];

const rowCountUsers = db.prepare(`SELECT COUNT(*) AS count FROM users`).get().count;
if (rowCountUsers === 0) {
    for (const user of users) saveUser(user.name, user.address, user.taxnumber, user.isCustomer);
}

const szamla = [
    {issuerId: 4, customerId: 1, accountnumber: "0987654321", created: "2025-05-29", completed: "2025-05-30", deadline: "2023-06-10", total: 1000, vatrate: 27},
    {issuerId: 4, customerId: 1, accountnumber: "0987654321", created: "2025-05-30", completed: "2025-05-30", deadline: "2023-06-05", total: 2500, vatrate: 27},
    {issuerId: 4, customerId: 1, accountnumber: "0987654321", created: "2025-06-04", completed: "2025-06-05", deadline: "2023-06-15", total: 28000, vatrate: 19},
    {issuerId: 5, customerId: 2, accountnumber: "1245789642", created: "2025-06-04", completed: "2025-06-05", deadline: "2023-06-15", total: 21000, vatrate: 27},
    {issuerId: 5, customerId: 2, accountnumber: "1245789642", created: "2025-06-10", completed: "2025-06-10", deadline: "2023-06-20", total: 172000, vatrate: 20},
    {issuerId: 5, customerId: 2, accountnumber: "1245789642", created: "2025-06-12", completed: "2025-06-13", deadline: "2023-06-15", total: 24500, vatrate: 27},
    {issuerId: 6, customerId: 3, accountnumber: "8458964137", created: "2025-06-18", completed: "2025-06-18", deadline: "2023-06-19", total: 39500, vatrate: 27},
    {issuerId: 6, customerId: 3, accountnumber: "8458964137", created: "2025-06-20", completed: "2025-06-20", deadline: "2023-06-25", total: 47900, vatrate: 27},
    {issuerId: 6, customerId: 3, accountnumber: "8458964137", created: "2025-06-25", completed: "2025-06-21", deadline: "2023-06-30", total: 99500, vatrate: 27},
];

const rowCountSzamla = db.prepare(`SELECT COUNT(*) AS count FROM szamla`).get().count;
if (rowCountSzamla === 0) {
    for (const invoice of szamla) saveSzamla(invoice.issuerId, invoice.customerId, invoice.accountnumber, invoice.created, invoice.completed, invoice.deadline, invoice.total, invoice.vatrate);
}
