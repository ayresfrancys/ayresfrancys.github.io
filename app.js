const TABLE_3000L = "3.000L Schedule";
const TABLE_1000L = "1.000L Schedule";
const TABLE_660L = "660L Schedule";

const API_BASE_URL = window.location.origin;
let state = {
    allProducts: [],
    serviceOrders: [],
    notifications: [],
    productCodes: [],
    currentTable: "",
    currentRow: -1,
    dataChanged: false  
};

const elements = {
    addProductBtn: document.getElementById("addProductBtn"),
    serviceOrderBtn: document.getElementById("serviceOrderBtn"),
    notificationBtn: document.getElementById("notificationBtn"),
    filterAll: document.getElementById("filterAll"),
    filterInProgress: document.getElementById("filterInProgress"),
    filterCompleted: document.getElementById("filterCompleted"),
    table3000L: document.getElementById("table3000LTable"),
    table1000L: document.getElementById("table1000LTable"),
    table660L: document.getElementById("table660LTable"),
    ordersTable: document.getElementById("ordersTable"),
    postIt3000L: document.getElementById("postIt3000L"),
    postIt1000L: document.getElementById("postIt1000L"),
    postIt660L: document.getElementById("postIt660L"),
    notificationsContainer: document.getElementById("notificationsContainer"),
    productSearchInput: document.getElementById("productSearchInput"),
    productDropdown: document.getElementById("productDropdown"),
    blendsTotalInput: document.getElementById("blendsTotalInput"),
    blendQtyInput: document.getElementById("blendQtyInput"),
    additionsCommentsInput: document.getElementById("additionsCommentsInput"),
    addProductToTableBtn: document.getElementById("addProductToTableBtn"),
    productSelectionModalTitle: document.getElementById(
        "productSelectionModalTitle"
    ),
    excelFileInput: document.getElementById("excelFileInput"),
    importExcelBtn: document.getElementById("importExcelBtn"),
};

// Função para obter headers de autenticação
function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Verificar autenticação ao carregar a página
if (!localStorage.getItem('authToken')) {
    window.location.href = 'login.html';
}

function setupAutoRefresh() {
    setInterval(() => {
        if (state.dataChanged) {
            window.location.reload();
        }
    }, 5000);
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Initializing application...");
    
    // Adicionar botão de logout
    addLogoutButton();
    
    loadData();
    setupEventListeners();
    addEmptyRowsToTables();
    setupAutoRefresh(); 
});

function addLogoutButton() {
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'btn btn-outline-danger btn-sm';
    logoutBtn.innerHTML = '<i class="bi bi-box-arrow-right"></i> Logout';
    logoutBtn.style.position = 'fixed';
    logoutBtn.style.top = '10px';
    logoutBtn.style.right = '10px';
    logoutBtn.style.zIndex = '1040';
    logoutBtn.onclick = function() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userEmail');
        window.location.href = 'login.html';
    };
    document.body.appendChild(logoutBtn);
    
    // Mostrar email do usuário
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
        const userInfo = document.createElement('div');
        userInfo.className = 'text-end me-3';
        userInfo.style.position = 'fixed';
        userInfo.style.top = '15px';
        userInfo.style.right = '120px';
        userInfo.style.zIndex = '1040';
        userInfo.innerHTML = `<small class="text-muted">Logged in as: ${userEmail}</small>`;
        document.body.appendChild(userInfo);
    }
}

async function loadData() {
    try {
        console.log("Loading data from server...");
        const response = await fetch(`${API_BASE_URL}/api/get_data`, {
            headers: getAuthHeaders()
        });

        if (response.status === 401 || response.status === 403) {
            // Token inválido ou expirado
            localStorage.removeItem('authToken');
            localStorage.removeItem('userEmail');
            window.location.href = 'login.html';
            return;
        }

        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }

        const responseData = await response.json();

        if (
            !responseData ||
            !responseData.all_products ||
            !responseData.service_orders ||
            !responseData.notifications
        ) {
            throw new Error("Invalid data structure received from server");
        }

        console.log("Data loaded from server:", responseData);

        state.allProducts = responseData.all_products.map((p) => ({
            ...p,
            table_name: p.table_name || "",
        }));

        state.serviceOrders = responseData.service_orders;
        state.notifications = responseData.notifications;
        state.productCodes = state.allProducts.map((p) => p.code);

        populateTables();
        populateOrdersTable();
        populateNotifications();
    } catch (error) {
        console.error("Error loading data:", error);
        showAlert(
            "error",
            "Connection Error",
            `Failed to load data: ${error.message}`
        );
    }
}

async function saveData() {
    try {
        console.log("Saving data to server...");
        const response = await fetch(`${API_BASE_URL}/api/save_data`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
                all_products: state.allProducts,
                service_orders: state.serviceOrders,
                notifications: state.notifications,
            }),
        });

        if (response.status === 401 || response.status === 403) {
            // Token inválido ou expirado
            localStorage.removeItem('authToken');
            localStorage.removeItem('userEmail');
            window.location.href = 'login.html';
            return;
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to save data");
        }

        const result = await response.json();
        console.log("Save result:", result);

        state.dataChanged = false; 
        return result;
    } catch (error) {
        console.error("Error saving data:", error);
        showAlert(
            "error",
            "Failed to save data",
            "Could not save data to server. Please try again later."
        );
        throw error;
    }
}

function showAlert(icon, title, text) {
    Swal.fire({
        icon: icon,
        title: title,
        text: text,
        timer: 3000,
        showConfirmButton: true,
    });
}

function setupEventListeners() {
    elements.addProductBtn.addEventListener("click", showAddProductModal);
    elements.serviceOrderBtn.addEventListener("click", showServiceOrderModal);
    elements.notificationBtn.addEventListener("click", showNotificationModal);

    elements.filterAll.addEventListener("click", () => filterOrders("all"));
    elements.filterInProgress.addEventListener("click", () =>
        filterOrders("in-progress")
    );
    elements.filterCompleted.addEventListener("click", () =>
        filterOrders("completed")
    );

    elements.table3000L.addEventListener("click", (e) =>
        handleTableClick(e, TABLE_3000L)
    );
    elements.table1000L.addEventListener("click", (e) =>
        handleTableClick(e, TABLE_1000L)
    );
    elements.table660L.addEventListener("click", (e) =>
        handleTableClick(e, TABLE_660L)
    );

    elements.productSearchInput.addEventListener("input", filterProductDropdown);
    elements.addProductToTableBtn.addEventListener("click", addProductToTable);

    elements.importExcelBtn.addEventListener("click", () =>
        elements.excelFileInput.click()
    );
    elements.excelFileInput.addEventListener("change", handleExcelImport);
}

function addEmptyRowsToTables() {
    for (let i = 0; i < 5; i++) {
        addEmptyRow(elements.table3000L);
        addEmptyRow(elements.table1000L);
        addEmptyRow(elements.table660L);
    }
}

function addEmptyRow(table) {
    const row = table.insertRow();
    for (let i = 0; i < 9; i++) {
        const cell = row.insertCell();
        cell.textContent = "";
    }
}

function populateTables() {
    clearTableContent(elements.table3000L);
    clearTableContent(elements.table1000L);
    clearTableContent(elements.table660L);

   
    ensureEmptyRows(elements.table3000L);
    ensureEmptyRows(elements.table1000L);
    ensureEmptyRows(elements.table660L);

    
    const tableProducts = {
        [TABLE_3000L]: [],
        [TABLE_1000L]: [],
        [TABLE_660L]: [],
    };

    state.allProducts.forEach((product) => {
        if (product.table_name && tableProducts[product.table_name]) {
            tableProducts[product.table_name].push(product);
        }
    });

    
    Object.entries(tableProducts).forEach(([tableName, products]) => {
        const table = getTableElement(tableName);
        
        products.forEach((product, rowIndex) => {
            if (rowIndex < 10) { 
                const row = table.rows[rowIndex + 1]; 
                
                [
                    product.code,
                    product.description,
                    product.blends_total,
                    product.blend_qty,
                    product.allergens,
                    product.cures,
                    product.blends_actions,
                    product.additions_comments || "",
                    product.start_time
                        ? product.end_time
                            ? "Completed"
                            : "In Production"
                        : "Pending",
                ].forEach((value, colIndex) => {
                    row.cells[colIndex].textContent = value;
                });
            }
        });
    });
}


function clearTableContent(table) {
    for (let i = 1; i < table.rows.length; i++) {
        const row = table.rows[i];
        for (let j = 0; j < row.cells.length; j++) {
            row.cells[j].textContent = "";
        }
    }
}


function ensureEmptyRows(table) {
    const currentRows = table.rows.length - 1; 
    const neededRows = 8 - currentRows;
    
    if (neededRows > 0) {
        for (let i = 0; i < neededRows; i++) {
            addEmptyRow(table);
        }
    }
}
function getTableElement(tableName) {
    switch (tableName) {
        case TABLE_3000L:
            return elements.table3000L;
        case TABLE_1000L:
            return elements.table1000L;
        case TABLE_660L:
            return elements.table660L;
        default:
            return null;
    }
}

function clearTable(table) {
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }
}

function handleTableClick(event, tableName) {
    const cell = event.target.closest("td");
    if (!cell) return;

    const row = cell.parentElement;
    const rowIndex = row.rowIndex - 1; 
    const colIndex = cell.cellIndex;

   
    if (colIndex === 0) {
        if (cell.textContent.trim()) {
            const productCode = cell.textContent;
            
            
            const productIndex = state.allProducts.findIndex(p => p.code === productCode);
            if (productIndex !== -1) {
                state.allProducts.splice(productIndex, 1);
                state.productCodes = state.allProducts.map(p => p.code);
            }

           
            for (let i = 0; i < row.cells.length; i++) {
                row.cells[i].textContent = "";
            }

          
            saveData().then(() => {
                
            });
        } else {
           
            state.currentTable = tableName;
            state.currentRow = rowIndex;
            showProductSelectionModal(tableName);
        }
    }
    
    else if (colIndex === 8) {
        const productCode = row.cells[0].textContent;
        if (!productCode) return;

        const product = state.allProducts.find((p) => p.code === productCode);
        if (!product) return;

        
        if (cell.textContent === "Completed") return;

       
        const tableProducts = state.allProducts.filter(p => p.table_name === tableName);
        const productInProduction = tableProducts.find(p => 
            p.start_time && !p.end_time && p.code !== productCode
        );

        if (productInProduction && cell.textContent === "Pending") {
            Swal.fire("Error", "There is already a product in production. Complete it first.", "error");
            return;
        }

        
        if (cell.textContent === "Pending") {
            cell.textContent = "In Production";
            product.start_time = new Date().toISOString();
            product.end_time = "";
        } else if (cell.textContent === "In Production") {
            cell.textContent = "Completed";
            product.end_time = new Date().toISOString();
        }

        saveData().then(() => {
            
            const index = state.allProducts.findIndex(p => p.code === productCode);
            if (index !== -1) {
                state.allProducts[index] = product;
            }
        });
    }
}

function moveToPostIts(product, tableName) {
    const postItContainer = getPostItContainer(tableName);
    if (!postItContainer) return;

    const postIt = document.createElement("div");
    postIt.className = "post-it-note";
    postIt.innerHTML = `
        <button class="close-btn">&times;</button>
        <p><strong>${product.code}</strong> - ${product.description}</p>
        <p>Blends: ${product.blends_total} | Qty: ${product.blend_qty}</p>
        <p>Completed: ${new Date(product.end_time).toLocaleString()}</p>
    `;

    postIt.querySelector(".close-btn").addEventListener("click", () => {
        postIt.remove();
    });

    postItContainer.appendChild(postIt);
}

function getPostItContainer(tableName) {
    switch (tableName) {
        case TABLE_3000L:
            return elements.postIt3000L;
        case TABLE_1000L:
            return elements.postIt1000L;
        case TABLE_660L:
            return elements.postIt660L;
        default:
            return null;
    }
}

function clearTableRow(row) {
    const productCode = row.cells[0].textContent;
    if (productCode) {
        const product = state.allProducts.find(p => p.code === productCode);
        if (product) {
            product.start_time = "";
            product.end_time = "";
        }
    }
    
    for (let i = 0; i < row.cells.length; i++) {
        row.cells[i].textContent = "";
        row.cells[i].removeAttribute('data-status');
    }
}

function showProductSelectionModal(tableName) {
    elements.productSelectionModalTitle.textContent = `Add Product to ${tableName}`;

    elements.productDropdown.innerHTML = "";

    const availableProducts = state.allProducts.filter(
        (p) => !p.table_name || p.table_name === tableName
    );

    availableProducts.forEach((product) => {
        const option = document.createElement("option");
        option.value = product.code;
        option.textContent = `${product.code} - ${product.description}`;
        option.dataset.product = JSON.stringify(product);
        elements.productDropdown.appendChild(option);
    });

    elements.blendsTotalInput.value = "";
    elements.blendQtyInput.value = "";
    elements.additionsCommentsInput.value = "";
    document.getElementById("washCheckbox").checked = false;
    document.getElementById("brushCheckbox").checked = false;

    const modal = new bootstrap.Modal(
        document.getElementById("productSelectionModal")
    );
    modal.show();
}

function filterProductDropdown() {
    const searchText = elements.productSearchInput.value.toLowerCase();
    const options = elements.productDropdown.options;

    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        option.hidden = !option.text.toLowerCase().includes(searchText);
    }
}

function addProductToTable() {
    if (
        !elements.blendsTotalInput.value.trim() ||
        !elements.blendQtyInput.value.trim()
    ) {
        Swal.fire("Error", "Blends Total and Blend Qty are required!", "error");
        return;
    }

    if (
        !document.getElementById("washCheckbox").checked &&
        !document.getElementById("brushCheckbox").checked
    ) {
        Swal.fire(
            "Error",
            "You must select at least one Blends Action (WASH or BRUSH)!",
            "error"
        );
        return;
    }

    const selectedOption = elements.productDropdown.selectedOptions[0];
    if (!selectedOption) return;

    const product = JSON.parse(selectedOption.dataset.product);

    
    const productsInTable = state.allProducts.filter(
        p => p.table_name === state.currentTable
    );
    const productInProduction = productsInTable.find(
        p => p.start_time && !p.end_time
    );

    if (productInProduction) {
        Swal.fire({
            icon: 'error',
            title: 'Cannot Add Product',
            text: `There is already a product (${productInProduction.code}) in production in this table. Complete it before adding a new one.`,
            confirmButtonText: 'OK'
        });
        return;
    }

   
    state.allProducts.forEach((p) => {
        if (p.code === product.code) {
            p.table_name = "";
        }
    });

    product.table_name = state.currentTable;
    product.blends_total = elements.blendsTotalInput.value;
    product.blend_qty = elements.blendQtyInput.value;
    product.start_time = ""; 
    product.end_time = "";   

    const blendsActions = [];
    if (document.getElementById("washCheckbox").checked)
        blendsActions.push("WASH");
    if (document.getElementById("brushCheckbox").checked)
        blendsActions.push("BRUSH");
    product.blends_actions = blendsActions.join("/");

    product.additions_comments = elements.additionsCommentsInput.value.trim();

   
    const index = state.allProducts.findIndex((p) => p.code === product.code);
    if (index !== -1) {
        state.allProducts[index] = product;
    } else {
        state.allProducts.push(product);
    }

    state.dataChanged = true; 
    saveData().then(() => {
        populateTables();
        const modal = bootstrap.Modal.getInstance(
            document.getElementById("productSelectionModal")
        );
        modal.hide();
    });
}

function populateOrdersTable() {
    clearTable(elements.ordersTable);

    state.serviceOrders.forEach((order) => {
        const row = elements.ordersTable.insertRow();

        [
            order.order_number,
            order.creation_time,
            order.product_code,
            order.service_description,
            order.technician_name,
            order.service_notes,
            order.completed ? "Completed" : "In Progress",
        ].forEach((value, colIndex) => {
            const cell = row.insertCell();
            cell.textContent = value;
        });

        const actionsCell = row.insertCell();
        const actionsDiv = document.createElement("div");
        actionsDiv.className = "d-flex gap-2 justify-content-center";

        if (!order.completed) {
            const completeBtn = document.createElement("button");
            completeBtn.className = "btn btn-sm btn-success";
            completeBtn.textContent = "Complete";
            completeBtn.addEventListener("click", () => completeOrder(order));
            actionsDiv.appendChild(completeBtn);
        }

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "btn btn-sm btn-danger";
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => deleteOrder(order));
        actionsDiv.appendChild(deleteBtn);

        actionsCell.appendChild(actionsDiv);
    });

    filterOrders("all");
}

function filterOrders(filterType) {
    const rows = elements.ordersTable.rows;

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const statusCell = row.cells[6];
        const status = statusCell.textContent.toLowerCase();

        let showRow = false;

        if (filterType === "all") {
            showRow = true;
        } else if (filterType === "in-progress" && status === "in progress") {
            showRow = true;
        } else if (filterType === "completed" && status === "completed") {
            showRow = true;
        }

        row.style.display = showRow ? "" : "none";
    }

    elements.filterAll.classList.remove("active");
    elements.filterInProgress.classList.remove("active");
    elements.filterCompleted.classList.remove("active");

    document
        .getElementById(
            `filter${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`
        )
        .classList.add("active");
}

function completeOrder(order) {
    order.completed = true;
    order.completed_date = new Date().toISOString();
    saveData().then(() => populateOrdersTable());
}

function deleteOrder(order) {
    Swal.fire({
        title: "Delete Order",
        text: `Are you sure you want to delete order ${order.order_number}?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        confirmButtonText: "Delete",
    }).then((result) => {
        if (result.isConfirmed) {
            state.serviceOrders = state.serviceOrders.filter(
                (o) => o.order_number !== order.order_number
            );
            saveData().then(() => populateOrdersTable());
        }
    });
}

function populateNotifications() {
    elements.notificationsContainer.innerHTML = "";

    state.notifications.forEach((notification) => {
        const card = document.createElement("div");
        card.className = "card notification-card";

        card.innerHTML = `
            <div class="card-header">
                <h5 class="card-title mb-0">${notification.title}</h5>
                <button class="close-btn">&times;</button>
            </div>
            <div class="card-body">
                <p class="card-text">${notification.description}</p>
                <div class="text-muted">
                    <p class="mb-1"><strong>Day:</strong> ${notification.day}</p>
                    <p class="mb-1"><strong>Time:</strong> ${notification.time}</p>
                    <p class="mb-0"><strong>Location:</strong> ${notification.location}</p>
                </div>
            </div>
        `;

        card
            .querySelector(".close-btn")
            .addEventListener("click", () => removeNotification(notification));
        elements.notificationsContainer.appendChild(card);
    });
}

function removeNotification(notification) {
    state.notifications = state.notifications.filter(
        (n) =>
            n.title !== notification.title ||
            n.description !== notification.description
    );
    saveData().then(() => populateNotifications());
}

function showAddProductModal() {
    document.getElementById("productCode").value = "";
    document.getElementById("productDescription").value = "";
    document.getElementById("blendsTotal").value = "";
    document.getElementById("blendQty").value = "";
    document.getElementById("allergens").value = "";
    document.getElementById("cures").value = "";
    document.getElementById("blendsActions").value = "";
    document.getElementById("additionsComments").value = "";

    const modal = new bootstrap.Modal(document.getElementById("addProductModal"));
    modal.show();
}

document.getElementById("submitProductBtn").addEventListener("click", () => {
    const code = document.getElementById("productCode").value.trim();
    const description = document
        .getElementById("productDescription")
        .value.trim();
    const blendsTotal = document.getElementById("blendsTotal").value.trim();
    const blendQty = document.getElementById("blendQty").value.trim();
    const allergens = document.getElementById("allergens").value.trim();
    const cures = document.getElementById("cures").value.trim();
    const blendsActions = document.getElementById("blendsActions").value.trim();
    const additionsComments = document
        .getElementById("additionsComments")
        .value.trim();

    if (!code) {
        Swal.fire("Error", "Product code is required!", "error");
        return;
    }

    if (state.allProducts.some((p) => p.code === code)) {
        Swal.fire("Error", "Product code already exists!", "error");
        return;
    }

    if (!blendsTotal || !blendQty) {
        Swal.fire("Error", "Blends Total and Blend Qty are required!", "error");
        return;
    }

    const product = {
        code,
        description,
        blends_total: blendsTotal,
        blend_qty: blendQty,
        allergens,
        cures,
        blends_actions: blendsActions,
        additions_comments: additionsComments,
        table_name: "",
    };

    state.allProducts.push(product);
    state.productCodes.push(code);

    saveData().then(() => {
        populateTables();
        const modal = bootstrap.Modal.getInstance(
            document.getElementById("addProductModal")
        );
        modal.hide();
    });
});

function showServiceOrderModal() {
    document.getElementById("orderNumber").value = `SO${state.serviceOrders.length + 1
        }`.padStart(4, "0");
    document.getElementById("orderDateTime").value = new Date()
        .toISOString()
        .replace("T", " ")
        .substring(0, 19);
    document.getElementById("orderProductCode").value = "";
    document.getElementById("serviceDescription").value = "";
    document.getElementById("technicianName").value = "";
    document.getElementById("serviceNotes").value = "";

    const modal = new bootstrap.Modal(
        document.getElementById("serviceOrderModal")
    );
    modal.show();
}

document
    .getElementById("submitServiceOrderBtn")
    .addEventListener("click", () => {
        const order = {
            order_number: document.getElementById("orderNumber").value,
            product_code: document.getElementById("orderProductCode").value,
            service_description: document.getElementById("serviceDescription").value,
            technician_name: document.getElementById("technicianName").value,
            service_notes: document.getElementById("serviceNotes").value,
            creation_time: document.getElementById("orderDateTime").value,
            completed: false,
        };

        state.serviceOrders.push(order);
        saveData().then(() => {
            populateOrdersTable();
            const modal = bootstrap.Modal.getInstance(
                document.getElementById("serviceOrderModal")
            );
            modal.hide();
        });
    });

function showNotificationModal() {
    document.getElementById("notificationTitle").value = "";
    document.getElementById("notificationDescription").value = "";
    document.getElementById("notificationDay").value = new Date()
        .toISOString()
        .substring(0, 10);
    document.getElementById("notificationTime").value = new Date()
        .toTimeString()
        .substring(0, 5);
    document.getElementById("notificationLocation").value = "";

    const modal = new bootstrap.Modal(
        document.getElementById("notificationModal")
    );
    modal.show();
}

document
    .getElementById("submitNotificationBtn")
    .addEventListener("click", () => {
        const notification = {
            title: document.getElementById("notificationTitle").value,
            description: document.getElementById("notificationDescription").value,
            day: document.getElementById("notificationDay").value,
            time: document.getElementById("notificationTime").value,
            location: document.getElementById("notificationLocation").value,
        };

        if (
            !notification.title ||
            !notification.description ||
            !notification.day ||
            !notification.time ||
            !notification.location
        ) {
            Swal.fire("Error", "All fields are required!", "error");
            return;
        }

        state.notifications.push(notification);
        saveData().then(() => {
            populateNotifications();
            const modal = bootstrap.Modal.getInstance(
                document.getElementById("notificationModal")
            );
            modal.hide();
        });
    });

function handleExcelImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);

            const normalize = (str) => str.trim().toLowerCase().replace(/\s+/g, " ");
            const columnMap = {
                code: "code",
                description: "description",
                "blends total": "blends_total",
                "blend qty": "blend_qty",
                allergens: "allergens",
                cures: "cures",
                "blends actions": "blends_actions",
                "additions comments": "additions_comments",
            };

            const importedProducts = jsonData.map((row) => {
                const product = { table_name: "" };

                Object.keys(row).forEach((col) => {
                    const normalizedCol = normalize(col);
                    if (columnMap[normalizedCol]) {
                        product[columnMap[normalizedCol]] = row[col];
                    }
                });

                return product;
            });

            importedProducts.forEach((product) => {
                if (!product.code || !product.description) return;

                const exists = state.allProducts.some((p) => p.code === product.code);
                if (!exists) {
                    state.allProducts.push(product);
                    state.productCodes.push(product.code);
                }
            });

            saveData().then(() => {
                populateTables();
                Swal.fire(
                    "Success",
                    `${importedProducts.length} products imported`,
                    "success"
                );
            });
        } catch (error) {
            console.error("Import error:", error);
            Swal.fire("Error", "Failed to import Excel file", "error");
        }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = "";
}