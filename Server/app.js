import express from "express";
import cors from "cors";
import * as db from "./Util/database.js";

const PORT = 8080;
const app = express();

app.use(cors());
app.use(express.json());


app.get("/users", (req, res) => {
  try {
    const users = db.getUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
});


app.get("/users/:id", (req, res) => {
  try {
    const user = db.getUser(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found!" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
});


app.post("/users", (req, res) => {
  try {
    const { name, address, taxnumber, isCustomer } = req.body;
    if ( !name || !address || !taxnumber || (isCustomer !== 0 && isCustomer !== 1)) {
      return res.status(400).json({ message: "Invalid user data!" });
    }

    const result = db.saveUser(name, address, taxnumber, isCustomer);
    if (result.changes !== 1) {
      return res.status(501).json({ message: "User save failed!" });
    }

    res.status(201).json({ id: result.lastInsertRowid, name, address, taxnumber, isCustomer });
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
});

app.put("/users/:id", (req, res) => {
  try {
    const { name, address, taxnumber, isCustomer } = req.body;
    if (!name || !address || !taxnumber || (isCustomer !== 0 && isCustomer !== 1)) {
      return res.status(400).json({ message: "Invalid user data!" });
    }

    const result = db.updateUser(req.params.id,name,address,taxnumber,isCustomer);
    if (result.changes !== 1) {
      return res.status(501).json({ message: "User update failed!" });
    }

    res.status(200).json({ id: Number(req.params.id), name, address, taxnumber, isCustomer });
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
});

app.delete("/users/:id", (req, res) => {
  try {
    const userId = Number(req.params.id);

    const allInvoices = db.getSzamlak(); 
    allInvoices
      .filter(inv => inv.issuer_id === userId)
      .forEach(inv => {
        db.stornoSzamla(inv.id);
      });

    const result = db.deleteUser(userId);
    if (result.changes !== 1) {
      return res.status(500).json({ message: "User delete failed!" });
    }

    res.status(200).json({ message: "User deleted, related invoices stornozott!" });
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
});


app.get("/szamlak", (req, res) => {
  try {
    const invoices = db.getSzamlak();
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
});

app.get("/szamlak/:id", (req, res) => {
  try {
    const invoice = db.getSzamlaById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found!" });
    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
});


app.post("/szamlak", (req, res) => {
  try {
    const { issuerId, customerId, accountnumber, created, completed, deadline, total, vatrate } = req.body;
    if (
      issuerId === undefined ||
      customerId === undefined ||
      !accountnumber ||
      !created ||
      !completed ||
      !deadline ||
      total === undefined ||
      vatrate === undefined
    ) {
      return res.status(400).json({ message: "Invalid invoice data!" });
    }

    const createdDate = new Date(created);   
    const deadlineDate = new Date(deadline); 

    const maxAllowed = new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (deadlineDate.getTime() > maxAllowed.getTime()) {
      return res.status(400).json({
        message: "A fizetési határidő nem lehet több, mint a kiállítás dátuma + 30 nap!"
      });
    }

    const result = db.saveSzamla(issuerId, customerId, accountnumber, created, completed, deadline, total, vatrate);
    if (result.changes !== 1) {
      return res.status(501).json({ message: "Invoice save failed!" });
    }

    res.status(201).json({
      id: result.lastInsertRowid,
      issuerId,
      customerId,
      accountnumber,
      created,
      completed,
      deadline,
      total,
      vatrate,
      isActive: 1,
    });
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
});

app.put("/szamlak/:id", (req, res) => {
  try {
    const existing = db.getSzamlaById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Invoice not found!" });
    }

    const result = db.stornoSzamla(req.params.id);
    if (result.changes !== 1) {
      return res.status(501).json({ message: "Invoice storno failed!" });
    }

    res.status(200).json({ message: "Számla stornózva!" });
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
});

app.listen(PORT, () => {
  console.log(`Server runs on port ${PORT}`);
});
