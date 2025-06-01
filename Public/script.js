let editingInvoiceId = null;
let editingUserId = null;
const BASE_URL = 'http://localhost:8080';

const usersMap = {};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

async function loadUsersMap() {
  try {
    const res = await fetch(`${BASE_URL}/users`);
    const users = await res.json();

    Object.keys(usersMap).forEach(key => delete usersMap[key]);

    users.forEach(u => {
      usersMap[u.id] = {
        name: u.name,
        address: u.address,
        taxnumber: u.taxnumber,
        isCustomer: u.isCustomer
      };
    });
  } catch (e) {
    console.error("Nem sikerült beolvasni a felhasználókat:", e);
  }
}

function renderUsers() {
  const container = document.getElementById('usersContainer');
  container.innerHTML = '';

  Object.entries(usersMap).forEach(([id, user]) => {
    const card = document.createElement('div');
    card.className = 'user-card';

    const title = document.createElement('h3');
    title.textContent = user.name;
    card.appendChild(title);

    const pAddress = document.createElement('p');
    pAddress.innerHTML = `<strong>Cím:</strong> ${user.address}`;
    card.appendChild(pAddress);

    const pTax = document.createElement('p');
    pTax.innerHTML = `<strong>Adószám:</strong> ${user.taxnumber}`;
    card.appendChild(pTax);

    const pType = document.createElement('p');
    pType.innerHTML = `<strong>Típus:</strong> ${user.isCustomer === 1 ? 'Vevő' : 'Kiállító'}`;
    card.appendChild(pType);

    const actions = document.createElement('div');
    actions.className = 'actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.textContent = 'Szerkeszt';
    editBtn.onclick = () => openUserEditor(id);
    actions.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'Törlés';
    deleteBtn.onclick = () => deleteUser(id);
    actions.appendChild(deleteBtn);

    card.appendChild(actions);
    container.appendChild(card);
  });
}

async function fetchInvoices() {
  try {
    const res = await fetch(`${BASE_URL}/szamlak`);
    const invoices = await res.json();
    return invoices;
  } catch (e) {
    console.error("Nem sikerült beolvasni a számlákat:", e);
    return [];
  }
}

function renderInvoices(invoices) {
  const container = document.getElementById('invoicesContainer');
  container.innerHTML = '';

  if (invoices.length === 0) {
    container.textContent = 'Nincsenek számlák.';
    return;
  }

  invoices.forEach(inv => {
    const card = document.createElement('div');
    card.className = 'invoice-card';

    const title = document.createElement('h3');
    title.textContent = `Számla: ${inv.accountnumber}`;
    card.appendChild(title);

    const pIssuer = document.createElement('p');
    const issuerName = usersMap[inv.issuer_id]?.name || `Ismeretlen (#${inv.issuer_id})`;
    pIssuer.innerHTML = `<strong>Kiállító:</strong> ${issuerName}`;
    card.appendChild(pIssuer);

    const pCustomer = document.createElement('p');
    const customerName = usersMap[inv.customer_id]?.name || `Ismeretlen (#${inv.customer_id})`;
    pCustomer.innerHTML = `<strong>Vevő:</strong> ${customerName}`;
    card.appendChild(pCustomer);

    const pCreated = document.createElement('p');
    pCreated.innerHTML = `<strong>Létrehozva:</strong> ${formatDate(inv.created)}`;
    card.appendChild(pCreated);

    const pCompleted = document.createElement('p');
    pCompleted.innerHTML = `<strong>Teljesítés:</strong> ${formatDate(inv.completed)}`;
    card.appendChild(pCompleted);

    const pDeadline = document.createElement('p');
    pDeadline.innerHTML = `<strong>Határidő:</strong> ${formatDate(inv.deadline)}`;
    card.appendChild(pDeadline);

    const pTotal = document.createElement('p');
    pTotal.innerHTML = `<strong>Végösszeg:</strong> ${inv.total.toFixed(2)} Ft`;
    card.appendChild(pTotal);

    const pVat = document.createElement('p');
    pVat.innerHTML = `<strong>ÁFA:</strong> ${inv.vatrate}%`;
    card.appendChild(pVat);

    const actions = document.createElement('div');
    actions.className = 'actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.textContent = 'Szerkeszt';
    editBtn.onclick = () => openInvoiceEditor(inv.id);
    actions.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'Törlés';
    deleteBtn.onclick = () => deleteInvoice(inv.id);
    actions.appendChild(deleteBtn);

    card.appendChild(actions);
    container.appendChild(card);
  });
}

async function loadAllData() {
  await loadUsersMap();
  renderUsers();

  const invoices = await fetchInvoices();
  renderInvoices(invoices);
}

const usersTabBtn = document.getElementById('usersTab');
const invoicesTabBtn = document.getElementById('invoicesTab');
const usersSection = document.getElementById('usersSection');
const invoicesSection = document.getElementById('invoicesSection');

usersTabBtn.addEventListener('click', () => {
  usersTabBtn.classList.add('active');
  invoicesTabBtn.classList.remove('active');
  usersSection.classList.remove('hidden');
  invoicesSection.classList.add('hidden');
});

invoicesTabBtn.addEventListener('click', () => {
  invoicesTabBtn.classList.add('active');
  usersTabBtn.classList.remove('active');
  invoicesSection.classList.remove('hidden');
  usersSection.classList.add('hidden');
});

const invoicePopup = document.getElementById('invoicePopup');
const invoiceFormTitle = document.getElementById('invoiceFormTitle');
const invoiceForm = document.getElementById('invoiceForm');
const cancelInvoiceBtn = document.getElementById('cancelInvoiceBtn');
const newInvoiceBtn = document.getElementById('newInvoiceBtn');

const invoiceIdInput = document.getElementById('invoiceId');
const issuerSelect = document.getElementById('issuer');
const customerSelect = document.getElementById('customer');
const accountnumberInput = document.getElementById('accountnumber');
const createdInput = document.getElementById('created');
const completedInput = document.getElementById('completed');
const deadlineInput = document.getElementById('deadline');
const totalInput = document.getElementById('total');
const vatrateInput = document.getElementById('vatrate');

newInvoiceBtn.addEventListener('click', () => openInvoiceEditor());

function populateUserSelects() {
  issuerSelect.innerHTML = '<option value="">Válassz kiállítót</option>';
  customerSelect.innerHTML = '<option value="">Válassz vevőt</option>';

  Object.entries(usersMap).forEach(([id, user]) => {
    if (user.isCustomer === 0) {
      const optIssuer = document.createElement('option');
      optIssuer.value = id;
      optIssuer.textContent = user.name;
      issuerSelect.appendChild(optIssuer);
    }
    if (user.isCustomer === 1) {
      const optCust = document.createElement('option');
      optCust.value = id;
      optCust.textContent = user.name;
      customerSelect.appendChild(optCust);
    }
  });
}

async function openInvoiceEditor(id = null) {
  editingInvoiceId = id;
  populateUserSelects();

  if (id) {
    invoiceFormTitle.textContent = 'Számla szerkesztése';
    try {
      const res = await fetch(`${BASE_URL}/szamlak/${id}`);
      const inv = await res.json();
      invoiceIdInput.value = inv.id;
      issuerSelect.value = inv.issuer_id;
      customerSelect.value = inv.customer_id;
      accountnumberInput.value = inv.accountnumber;
      createdInput.value = inv.created;
      completedInput.value = inv.completed;
      deadlineInput.value = inv.deadline;
      totalInput.value = inv.total;
      vatrateInput.value = inv.vatrate;
    } catch (e) {
      console.error("Nem sikerült betölteni a számlát szerkesztésre:", e);
    }
  } else {
    invoiceFormTitle.textContent = 'Új számla';
    invoiceForm.reset();
    invoiceIdInput.value = '';
  }

  invoicePopup.classList.remove('hidden');
}

cancelInvoiceBtn.addEventListener('click', () => {
  invoicePopup.classList.add('hidden');
  invoiceForm.reset();
});

invoiceForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    issuerId: Number(issuerSelect.value),
    customerId: Number(customerSelect.value),
    accountnumber: accountnumberInput.value.trim(),
    created: createdInput.value,
    completed: completedInput.value,
    deadline: deadlineInput.value,
    total: parseFloat(totalInput.value),
    vatrate: parseFloat(vatrateInput.value)
  };

  if (
    !data.issuerId ||
    !data.customerId ||
    !data.accountnumber ||
    !data.created ||
    !data.completed ||
    !data.deadline ||
    isNaN(data.total) ||
    isNaN(data.vatrate)
  ) {
    alert('Kérlek, tölts ki minden mezőt!');
    return;
  }

  const method = editingInvoiceId ? 'PUT' : 'POST';
  const url = editingInvoiceId
    ? `${BASE_URL}/szamlak/${editingInvoiceId}`
    : `${BASE_URL}/szamlak`;

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      invoicePopup.classList.add('hidden');
      const newInvoices = await fetchInvoices();
      renderInvoices(newInvoices);
      invoiceForm.reset();
    } else {
      const err = await res.json();
      alert('Hiba történt mentéskor: ' + (err.message || res.status));
    }
  } catch (e) {
    console.error("Hiba a mentés közben:", e);
    alert('Hálózati hiba történt mentéskor.');
  }
});

async function deleteInvoice(id) {
  if (!confirm('Biztosan törlöd ezt a számlát?')) return;
  try {
    const res = await fetch(`${BASE_URL}/szamlak/${id}`, { method: 'DELETE' });
    if (res.ok) {
      const newInvoices = await fetchInvoices();
      renderInvoices(newInvoices);
    } else {
      const err = await res.json();
      alert('Törlés sikertelen: ' + (err.message || res.status));
    }
  } catch (e) {
    console.error("Hiba a törlés közben:", e);
    alert('Hálózati hiba történt törléskor.');
  }
}

const userPopup = document.getElementById('userPopup');
const userFormTitle = document.getElementById('userFormTitle');
const userForm = document.getElementById('userForm');
const cancelUserBtn = document.getElementById('cancelUserBtn');
const newUserBtn = document.getElementById('newUserBtn');

const userIdInput = document.getElementById('userId');
const userNameInput = document.getElementById('userName');
const userAddressInput = document.getElementById('userAddress');
const userTaxInput = document.getElementById('userTaxNumber');
const userTypeSelect = document.getElementById('userIsCustomer');

newUserBtn.addEventListener('click', () => openUserEditor());

function openUserEditor(id = null) {
  editingUserId = id;

  if (id) {
    userFormTitle.textContent = 'Felhasználó szerkesztése';
    const user = usersMap[id];
    userIdInput.value = id;
    userNameInput.value = user.name;
    userAddressInput.value = user.address;
    userTaxInput.value = user.taxnumber;
    userTypeSelect.value = user.isCustomer;
  } else {
    userFormTitle.textContent = 'Új felhasználó';
    userForm.reset();
    userIdInput.value = '';
  }

  userPopup.classList.remove('hidden');
}

cancelUserBtn.addEventListener('click', () => {
  userPopup.classList.add('hidden');
  userForm.reset();
});

userForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    name: userNameInput.value.trim(),
    address: userAddressInput.value.trim(),
    taxnumber: userTaxInput.value.trim(),
    isCustomer: parseInt(userTypeSelect.value)
  };

  const method = editingUserId ? 'PUT' : 'POST';
  const url = editingUserId
    ? `${BASE_URL}/users/${editingUserId}`
    : `${BASE_URL}/users`;

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      await loadUsersMap();
      renderUsers();
      userPopup.classList.add('hidden');
      userForm.reset();
    } else {
      const err = await res.json();
      alert('Hiba történt mentéskor: ' + (err.message || res.status));
    }
  } catch (e) {
    console.error("Hiba a mentés közben:", e);
    alert('Hálózati hiba történt mentéskor.');
  }
});

async function deleteUser(id) {
  if (!confirm('Biztosan törlöd ezt a felhasználót?')) return;

  try {
    const res = await fetch(`${BASE_URL}/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await loadUsersMap();
      renderUsers();
    } else {
      const err = await res.json();
      alert('Törlés sikertelen: ' + (err.message || res.status));
    }
  } catch (e) {
    console.error("Hiba a törlés közben:", e);
    alert('Hálózati hiba történt törléskor.');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  loadAllData();
});
