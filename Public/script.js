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
    card.style.position = 'relative';

    const issuerExists = !!usersMap[inv.issuer_id];
    const customerExists = !!usersMap[inv.customer_id];
    const isStornoBecauseOfInactive = inv.isActive === 0;
    const isStorno = isStornoBecauseOfInactive || !issuerExists || !customerExists;

    if (isStorno) {
      card.style.opacity = '0.6';
    }

    const title = document.createElement('h3');
    title.textContent = `Számla száma: ${inv.accountnumber}`;
    title.style.textAlign = 'center';
    title.style.marginBottom = '0.75rem';
    card.appendChild(title);

    const partiesContainer = document.createElement('div');
    partiesContainer.style.display = 'flex';
    partiesContainer.style.justifyContent = 'space-between';
    partiesContainer.style.marginBottom = '0.75rem';

    const issuerDiv = document.createElement('div');
    issuerDiv.style.flex = '1';
    issuerDiv.style.paddingRight = '0.5rem';

    const issuerName = usersMap[inv.issuer_id]?.name || `Törölt felhasználó`;
    const issuerAddress = usersMap[inv.issuer_id]?.address || '';
    const issuerTax = usersMap[inv.issuer_id]?.taxnumber || '';

    const issuerTitle = document.createElement('p');
    issuerTitle.innerHTML = `<strong>Eladó:</strong>`;
    issuerTitle.style.marginBottom = '0.3rem';
    issuerDiv.appendChild(issuerTitle);

    const issuerNameP = document.createElement('p');
    issuerNameP.textContent = issuerName;
    issuerNameP.style.marginBottom = '0.2rem';
    issuerDiv.appendChild(issuerNameP);

    const issuerAddressP = document.createElement('p');
    issuerAddressP.textContent = issuerAddress;
    issuerAddressP.style.marginBottom = '0.2rem';
    issuerDiv.appendChild(issuerAddressP);

    const issuerTaxP = document.createElement('p');
    issuerTaxP.textContent = `Adószám: ${issuerTax}`;
    issuerDiv.appendChild(issuerTaxP);

    partiesContainer.appendChild(issuerDiv);

    const customerDiv = document.createElement('div');
    customerDiv.style.flex = '1';
    customerDiv.style.textAlign = 'right';
    customerDiv.style.paddingLeft = '0.5rem';

    const customerName = usersMap[inv.customer_id]?.name || `Ismeretlen (#${inv.customer_id})`;
    const customerAddress = usersMap[inv.customer_id]?.address || '';
    const customerTax = usersMap[inv.customer_id]?.taxnumber || '';

    const customerTitle = document.createElement('p');
    customerTitle.innerHTML = `<strong>Vevő:</strong>`;
    customerTitle.style.marginBottom = '0.3rem';
    customerDiv.appendChild(customerTitle);

    const customerNameP = document.createElement('p');
    customerNameP.textContent = customerName;
    customerNameP.style.marginBottom = '0.2rem';
    customerDiv.appendChild(customerNameP);

    const customerAddressP = document.createElement('p');
    customerAddressP.textContent = customerAddress;
    customerAddressP.style.marginBottom = '0.2rem';
    customerDiv.appendChild(customerAddressP);

    const customerTaxP = document.createElement('p');
    customerTaxP.textContent = `Adószám: ${customerTax}`;
    customerDiv.appendChild(customerTaxP);

    partiesContainer.appendChild(customerDiv);
    card.appendChild(partiesContainer);

    const datesDiv = document.createElement('div');
    datesDiv.style.display = 'flex';
    datesDiv.style.justifyContent = 'space-between';
    datesDiv.style.marginBottom = '0.75rem';

    const createdP = document.createElement('p');
    createdP.innerHTML = `<strong>Létrehozva:</strong> ${formatDate(inv.created)}`;
    datesDiv.appendChild(createdP);

    const completedP = document.createElement('p');
    completedP.innerHTML = `<strong>Teljesítés:</strong> ${formatDate(inv.completed)}`;
    datesDiv.appendChild(completedP);

    const deadlineP = document.createElement('p');
    deadlineP.innerHTML = `<strong>Határidő:</strong> ${formatDate(inv.deadline)}`;
    datesDiv.appendChild(deadlineP);

    card.appendChild(datesDiv);

    const summaryDiv = document.createElement('div');
    summaryDiv.style.textAlign = 'right';

    const gross = Number(inv.total);
    const vatRate = Number(inv.vatrate);
    const net = +(gross / (1 + vatRate / 100)).toFixed(2);
    const vatAmount = +(gross - net).toFixed(2);

    const netP = document.createElement('p');
    netP.innerHTML = `<strong>Nettó:</strong> ${net.toFixed(2)} Ft`;
    summaryDiv.appendChild(netP);

    const vatP = document.createElement('p');
    vatP.innerHTML = `<strong>ÁFA (${vatRate}%):</strong> ${vatAmount.toFixed(2)} Ft`;
    summaryDiv.appendChild(vatP);

    const grossP = document.createElement('p');
    grossP.innerHTML = `<strong>Bruttó:</strong> ${gross.toFixed(2)} Ft`;
    summaryDiv.appendChild(grossP);

    card.appendChild(summaryDiv);

    const actions = document.createElement('div');
    actions.className = 'actions';
    actions.style.marginTop = '0.75rem';

    if (!isStornoBecauseOfInactive && issuerExists && customerExists) {
      const stornoBtn = document.createElement('button');
      stornoBtn.className = 'delete-btn';
      stornoBtn.textContent = 'Stornó';
      stornoBtn.onclick = () => stornoInvoice(inv.id);
      actions.appendChild(stornoBtn);
    }

    card.appendChild(actions);

    if (isStorno) {
      const stornoLabel = document.createElement('div');
      stornoLabel.textContent = 'Stornózott';
      stornoLabel.style.position = 'absolute';
      stornoLabel.style.bottom = '10px';
      stornoLabel.style.left = '180px';
      stornoLabel.style.color = 'red';
      stornoLabel.style.fontWeight = 'bold';
      card.appendChild(stornoLabel);
    }
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

  if (data.created && data.deadline) {
    const createdDate = new Date(data.created);
    const deadlineDate = new Date(data.deadline);
    const maxAllowed = new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (deadlineDate.getTime() > maxAllowed.getTime()) {
      alert('A fizetési határidő nem lehet több, mint a kiállítás dátuma + 30 nap!');
      return;
    }
  }
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


async function stornoInvoice(id) {
  if (!confirm('Biztosan stornózod ezt a számlát?')) return;
  try {
    const res = await fetch(`${BASE_URL}/szamlak/${id}`, { method: 'PUT' });
    if (res.ok) {
      const newInvoices = await fetchInvoices();
      renderInvoices(newInvoices);
    } else {
      const err = await res.json();
      alert('Stornózás sikertelen: ' + (err.message || res.status));
    }
  } catch (e) {
    console.error("Hiba a stornózás közben:", e);
    alert('Hálózati hiba történt stornózáskor.');
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