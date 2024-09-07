document.addEventListener('DOMContentLoaded', function() {
    let allProducts = JSON.parse(localStorage.getItem('allProducts')) || [];
    let products = {
        productTable1: JSON.parse(localStorage.getItem('productTable1')) || [],
        productTable2: JSON.parse(localStorage.getItem('productTable2')) || [],
        productTable3: JSON.parse(localStorage.getItem('productTable3')) || []
    };
    let serviceOrders = JSON.parse(localStorage.getItem('serviceOrders')) || [];
    let currentFilter = 'all';
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];

    function saveToLocalStorage() {
        localStorage.setItem('productTable1', JSON.stringify(products.productTable1));
        localStorage.setItem('productTable2', JSON.stringify(products.productTable2));
        localStorage.setItem('productTable3', JSON.stringify(products.productTable3));
        localStorage.setItem('allProducts', JSON.stringify(allProducts));
        localStorage.setItem('serviceOrders', JSON.stringify(serviceOrders));
        localStorage.setItem('notifications', JSON.stringify(notifications));
    }

    function removeProductFromList(productCode) {
        allProducts = allProducts.filter(product => product.code !== productCode);
        saveToLocalStorage();
        populateProductList();
    }

    function createRemoveButton(removeCallback) {
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.className = 'hidden-button';
        removeButton.style.backgroundColor = '#d9534f';
        removeButton.style.color = '#fff';
        removeButton.style.border = 'none';
        removeButton.style.padding = '5px 10px';
        removeButton.style.cursor = 'pointer';
        removeButton.style.borderRadius = '5px';
        removeButton.addEventListener('click', removeCallback);
        return removeButton;
    }

    function createCheckbox(tableId, product, isChecked) {
        const label = document.createElement('label');
        label.className = 'checkbox-label';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = isChecked;
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                products[tableId].push(product);
            } else {
                products[tableId] = products[tableId].filter(p => p.code !== product.code);
            }
            saveToLocalStorage();
            updateAllTables();
        });

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(tableId));
        return label;
    }

    function populateProductList(productsToDisplay = allProducts) {
        const productList = document.getElementById('productList');
        if (!productList) return;
        productList.innerHTML = '';

        productsToDisplay.forEach((product) => {
            const listItem = document.createElement('div');
            listItem.className = 'product-list-item';

            const productInfo = document.createElement('span');
            productInfo.textContent = `${product.code} - ${product.description}`;
            listItem.appendChild(productInfo);

            const checkboxGroup = document.createElement('div');
            checkboxGroup.className = 'checkbox-group';

            const checkbox1 = createCheckbox('productTable1', product, products.productTable1.some(p => p.code === product.code));
            const checkbox2 = createCheckbox('productTable2', product, products.productTable2.some(p => p.code === product.code));
            const checkbox3 = createCheckbox('productTable3', product, products.productTable3.some(p => p.code === product.code));

            checkboxGroup.appendChild(checkbox1);
            checkboxGroup.appendChild(checkbox2);
            checkboxGroup.appendChild(checkbox3);

            listItem.appendChild(checkboxGroup);

            listItem.appendChild(createRemoveButton(() => {
                removeProductFromList(product.code);
            }));

            productList.appendChild(listItem);
        });
    }

    function populateTable(tableId) {
        const tableBody = document.querySelector(`#${tableId} tbody`);
        if (!tableBody) return;
        tableBody.innerHTML = '';

        products[tableId].forEach((product) => {
            const row = document.createElement('tr');
            Object.keys(product).forEach((key) => {
                // Exclude the timestamps
                if (key !== 'startTime' && key !== 'endTime') {
                    const cell = document.createElement('td');
                    cell.textContent = product[key];
                    row.appendChild(cell);
                }
            });

            const actionCell = document.createElement('td');
            const actionButton = document.createElement('button');
            actionButton.textContent = 'Start';
            actionButton.classList.add('start-stop-button');
            actionButton.addEventListener('click', () => handleStartStopClick(actionButton, product, tableId));
            actionCell.appendChild(actionButton);
            row.appendChild(actionCell);

            tableBody.appendChild(row);
        });
    }

    function updateAllTables() {
        populateTable('productTable1');
        populateTable('productTable2');
        populateTable('productTable3');
    }

    function handleStartStopClick(button, product, tableId) {
        if (button.textContent === 'Start') {
            product.startTime = new Date();
            button.textContent = 'Stop';
            button.classList.add('stop');
            
            // Exibir o modal de checklist
            const checklistModal = document.getElementById('checklistModal');
            const checklistItemsContainer = document.getElementById('checklistItemsContainer');
            checklistItemsContainer.innerHTML = ''; // Limpa o checklist anterior
            
            // Simular produtos e pesos para o checklist (substitua com seus produtos reais)
            const productsToCheck = [
                { code: 'P001', weight: '500kg' },
                { code: 'P002', weight: '300kg' },
                { code: 'P003', weight: '700kg' }
            ];
            
            // Gerar dinamicamente os itens do checklist com checkbox antes do código do produto e peso
            productsToCheck.forEach((prod) => {
                const checklistItem = document.createElement('div');
                checklistItem.classList.add('checklist-item');
                checklistItem.innerHTML = `
                    <label class="checklist-label">
                        <input type="checkbox" name="check_${prod.code}" value="${prod.code}">
                        <span>Produto: ${prod.code} &nbsp;&nbsp; Peso: ${prod.weight}</span>
                    </label>
                `;
                checklistItemsContainer.appendChild(checklistItem);
            });
            
            checklistModal.style.display = 'block';
    
            // Fechar o modal ao clicar no "X"
            const closeChecklistModal = document.getElementById('closeChecklistModal');
            closeChecklistModal.onclick = function() {
                checklistModal.style.display = 'none';
            };
    
            // Fechar o modal ao concluir o checklist
            const checklistForm = document.getElementById('checklistForm');
            checklistForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const checkedProducts = Array.from(checklistForm.querySelectorAll('input[type="checkbox"]:checked'))
                    .map(input => input.value);
    
                if (checkedProducts.length === productsToCheck.length) {
                    alert('Checklist concluído com sucesso!');
    
                    // Adicionar o status "Verificado" ao lado do botão "Stop"
                    const statusElement = document.createElement('span');
                    statusElement.classList.add('status-verified');
                    statusElement.textContent = 'Verificado';
                    
                    button.insertAdjacentElement('afterend', statusElement); // Colocar o status ao lado do botão "Stop"
                } else {
                    alert('Por favor, verifique todos os produtos antes de concluir.');
                }
                checklistModal.style.display = 'none';
            });
    
        } else {
            product.endTime = new Date();
            button.style.display = 'none';
            button.classList.remove('stop');
            createPostItCard(product, tableId);
        }
    }
    
    // Fechar o modal se clicar fora dele
    window.onclick = function(event) {
        const checklistModal = document.getElementById('checklistModal');
        if (event.target === checklistModal) {
            checklistModal.style.display = 'none';
        }
    };
    
    

    function createPostItCard(product, tableId) {
        const card = document.createElement('div');
        card.className = 'post-it-card';
        const startTime = new Date(product.startTime).toLocaleTimeString();
        const endTime = new Date(product.endTime).toLocaleTimeString();
        const duration = calculateDuration(product.startTime, product.endTime);

        const tableName = {
            productTable1: '3,000L Schedule',
            productTable2: '1,000L Schedule',
            productTable3: '660L Schedule'
        };

        card.innerHTML = `
            <h3>${tableName[tableId]}</h3>
            <p><strong>Code:</strong> ${product.code}</p>
            <p><strong>Description:</strong> ${product.description}</p>
            <p><strong>Blends Total:</strong> ${product.blendsTotal}</p>
            <p><strong>Start Time:</strong> ${startTime}</p>
            <p><strong>End Time:</strong> ${endTime}</p>
            <p><strong>Duration:</strong> ${duration}</p>
        `;
        
        let postItContainer;
        switch (tableId) {
            case 'productTable1':
                postItContainer = document.getElementById('postItContainer1');
                break;
            case 'productTable2':
                postItContainer = document.getElementById('postItContainer2');
                break;
            case 'productTable3':
                postItContainer = document.getElementById('postItContainer3');
                break;
        }

        postItContainer.appendChild(card);
        updatePostItContainerVisibility(postItContainer.id);
    }

    function calculateDuration(startTime, endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const diffMs = Math.abs(end - start);
        const diffMins = Math.floor((diffMs / 1000) / 60);
        const diffHrs = Math.floor(diffMins / 60);
        const remainingMins = diffMins % 60;

        if (diffHrs > 0) {
            return `${diffHrs} hours ${remainingMins} minutes`;
        } else {
            return `${remainingMins} minutes`;
        }
    }

    function generateOrderNumber() {
        return 'SO' + (serviceOrders.length + 1).toString().padStart(4, '0');
    }

    function displayServiceOrders() {
        const serviceOrdersList = document.getElementById('serviceOrdersList');
        if (!serviceOrdersList) return;
        serviceOrdersList.innerHTML = '';

        let filteredOrders = [];
        if (currentFilter === 'in-progress') {
            filteredOrders = serviceOrders.filter(order => !order.completed);
        } else if (currentFilter === 'completed') {
            filteredOrders = serviceOrders.filter(order => order.completed);
        } else {
            filteredOrders = serviceOrders;
        }

        filteredOrders.forEach(order => {
            const orderItem = document.createElement('div');
            orderItem.className = 'service-order-item';

            const timeToAccept = order.startTime ? calculateDuration(order.creationTime, order.startTime) : 'N/A';
            const duration = order.completed ? calculateDuration(order.startTime, order.completedDate) : 'N/A';

            orderItem.innerHTML = `
                <h3>Order: ${order.orderNumber}</h3>
                <p><strong>Date and Time:</strong> ${order.serviceDateTime}</p>
                <p><strong>Product:</strong> ${order.productCode}</p>
                <p><strong>Description:</strong> ${order.serviceDescription}</p>
                <p><strong>Technician:</strong> ${order.technicianName}</p>
                <p><strong>Notes:</strong> ${order.serviceNotes}</p>
                <p><strong>Status:</strong> ${order.completed ? `Completed on ${order.completedDate}` : 'Pending'}</p>
                <p><strong>Time to accept:</strong> ${timeToAccept}</p>
                <p><strong>Duration:</strong> ${duration}</p>
                <div class="buttons">
                    ${order.startTime ? '' : '<button class="accept-button">Accept Service</button>'}
                    ${order.completed ? '' : '<button class="complete-button">Complete</button>'}
                    ${order.completed ? '' : '<button class="remove-button">Remove</button>'}
                </div>
            `;

            if (!order.startTime) {
                orderItem.querySelector('.accept-button').addEventListener('click', () => {
                    acceptServiceOrder(order.orderNumber);
                });
            }

            if (!order.completed) {
                orderItem.querySelector('.complete-button').addEventListener('click', () => {
                    completeServiceOrder(order.orderNumber);
                });
            }

            if (!order.completed) {
                orderItem.querySelector('.remove-button').addEventListener('click', () => {
                    removeServiceOrder(order.orderNumber);
                });
            }

            serviceOrdersList.appendChild(orderItem);
        });
    }

    function acceptServiceOrder(orderNumber) {
        const order = serviceOrders.find(o => o.orderNumber === orderNumber);
        if (order) {
            order.startTime = new Date().toLocaleString();
            saveToLocalStorage();
            displayServiceOrders();
        }
    }

    function completeServiceOrder(orderNumber) {
        const order = serviceOrders.find(o => o.orderNumber === orderNumber);
        if (order) {
            order.completed = true;
            order.completedDate = new Date().toLocaleString();
            saveToLocalStorage();
            displayServiceOrders();
        }
    }

    function removeServiceOrder(orderNumber) {
        serviceOrders = serviceOrders.filter(o => o.orderNumber !== orderNumber);
        saveToLocalStorage();
        displayServiceOrders();
    }

    function updatePostItContainerVisibility(containerId) {
        const container = document.getElementById(containerId);
        if (container.children.length === 0) {
            container.style.display = 'none';
        } else {
            container.style.display = 'grid';
        }
    }

    const fullscreenButton = document.getElementById('fullscreenButton');
    const addProductButton = document.getElementById('addProductButton');
    const importButton = document.getElementById('importButton');
    const fileInput = document.getElementById('fileInput');
    const container = document.querySelector('.container');
    const openServiceOrderFormButton = document.getElementById('openServiceOrderFormButton');
    const backToTablesButtonFromServiceOrder = document.getElementById('backToTablesButtonFromServiceOrder');
    const serviceOrderFormScreen = document.getElementById('serviceOrderFormScreen');
    const serviceOrdersContainer = document.getElementById('serviceOrdersContainer');
    const serviceOrderForm = document.getElementById('serviceOrderForm');
    const filterAllButton = document.getElementById('filterAll');
    const filterInProgressButton = document.getElementById('filterInProgress');
    const filterCompletedButton = document.getElementById('filterCompleted');
    const showNotificationButton = document.getElementById('showNotificationButton');
    const notificationInputContainer = document.getElementById('notificationInputContainer');
    const createNotificationButton = document.getElementById('createNotificationButton');
    const notificationInput = document.getElementById('notificationInput');

    if (fullscreenButton) {
        fullscreenButton.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                container.requestFullscreen().catch(err => {
                    alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                });
            } else {
                document.exitFullscreen();
            }
        });
    }

    let mouseTimer;
    document.body.addEventListener('mousemove', () => {
        document.body.classList.add('active');
        clearTimeout(mouseTimer);
        mouseTimer = setTimeout(() => {
            document.body.classList.remove('active');
        }, 2000);
    });

    const loginScreen = document.getElementById('loginScreen');
    const signUpScreen = document.getElementById('signUpScreen');
    const mainContent = document.getElementById('mainContent');
    const addProductScreen = document.getElementById('addProductScreen');
    const loginForm = document.getElementById('loginForm');
    const signUpForm = document.getElementById('signUpForm');
    const addProductForm = document.getElementById('addProductForm');
    const showSignUp = document.getElementById('showSignUp');
    const showLogin = document.getElementById('showLogin');
    const backToTablesButton = document.getElementById('backToTablesButton');

    let users = [
        { username: 'admin', password: 'password', email: 'admin@example.com' }
    ];

    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            const user = users.find(user => user.username === username && user.password === password);
            if (user) {
                window.location.href = 'index.html';
            } else {
                alert('Invalid username or password');
            }
        });
    }

    if (signUpForm) {
        signUpForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const newUsername = document.getElementById('newUsername').value;
            const email = document.getElementById('email').value;
            const newPassword = document.getElementById('newPassword').value;

            if (users.some(user => user.username === newUsername)) {
                alert('Username already exists');
            } else if (users.some(user => user.email === email)) {
                alert('Email already exists');
            } else {
                users.push({ username: newUsername, password: newPassword, email: email });
                alert('User registered successfully');
                window.location.href = 'login.html';
            }
        });
    }

    if (showSignUp) {
        showSignUp.addEventListener('click', function(event) {
            event.preventDefault();
            window.location.href = 'signup.html';
        });
    }

    if (showLogin) {
        showLogin.addEventListener('click', function(event) {
            event.preventDefault();
            window.location.href = 'login.html';
        });
    }

    if (addProductButton) {
        addProductButton.addEventListener('click', function() {
            document.getElementById('addProductModal').style.display = 'block';
        });
    }

    if (backToTablesButton) {
        backToTablesButton.addEventListener('click', function() {
            document.getElementById('addProductModal').style.display = 'none';
        });
    }

    if (importButton) {
        importButton.addEventListener('click', function() {
            fileInput.click();
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    // Ignoring the first row if it contains headers
                    json.slice(1).forEach(row => {
                        const newProduct = {
                            code: row[0],
                            description: row[1],
                            blendsTotal: row[2],
                            blendQty: row[3],
                            allergens: row[4],
                            cures: row[5],
                            blendsActions: row[6],
                            additionsComments: row[7]
                        };
                        // Check if the product already exists in the list
                        const existingProductIndex = allProducts.findIndex(product => product.code === newProduct.code);
                        if (existingProductIndex !== -1) {
                            // Update the existing product
                            allProducts[existingProductIndex] = newProduct;
                        } else {
                            // Add new product
                            allProducts.push(newProduct);
                        }
                    });

                    saveToLocalStorage();
                    populateProductList();
                    updateAllTables();
                };
                reader.readAsArrayBuffer(file);
            }
        });
    }

    if (addProductForm) {
        addProductForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const newProduct = {
                code: document.getElementById('productCode').value,
                description: document.getElementById('productDescription').value,
                blendsTotal: document.getElementById('blendsTotal').value,
                blendQty: document.getElementById('blendQty').value,
                allergens: document.getElementById('allergens').value,
                cures: document.getElementById('cures').value,
                blendsActions: document.getElementById('blendsActions').value,
                additionsComments: document.getElementById('additionsComments').value
            };

            const existingProductIndex = allProducts.findIndex(product => product.code === newProduct.code);
            if (existingProductIndex !== -1) {
                allProducts[existingProductIndex] = newProduct;
            } else {
                allProducts.push(newProduct);
            }
            saveToLocalStorage();
            populateProductList();
            updateAllTables();

            // Clear the form fields
            addProductForm.reset();
        });
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = searchInput.value.toLowerCase();
            const matchedProducts = allProducts.filter(product => product.code.toLowerCase().includes(query));
            populateProductList(matchedProducts);
        });
    }

    if (document.getElementById('togglePassword')) {
        document.getElementById('togglePassword').addEventListener('click', function() {
            const passwordInput = document.getElementById('password');
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    if (document.getElementById('toggleNewPassword')) {
        document.getElementById('toggleNewPassword').addEventListener('click', function() {
            const newPasswordInput = document.getElementById('newPassword');
            const type = newPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            newPasswordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    if (openServiceOrderFormButton) {
        openServiceOrderFormButton.addEventListener('click', function() {
            const orderNumberInput = document.getElementById('orderNumber');
            const serviceDateTimeInput = document.getElementById('serviceDateTime');
            orderNumberInput.value = generateOrderNumber();
            serviceDateTimeInput.value = new Date().toLocaleString();
            document.getElementById('serviceOrderModal').style.display = 'block';
        });
    }

    if (backToTablesButtonFromServiceOrder) {
        backToTablesButtonFromServiceOrder.addEventListener('click', function() {
            document.getElementById('serviceOrderModal').style.display = 'none';
        });
    }

    const modalCloseButtons = document.querySelectorAll('.close');
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            modal.style.display = 'none';
        });
    });

    window.onclick = function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    };

    function closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    // Handle the Create Notification modal
    if (showNotificationButton) {
        showNotificationButton.addEventListener('click', function() {
            document.getElementById('notificationModal').style.display = 'block';
        });
    }

    const notificationForm = document.getElementById('notificationForm');
    if (notificationForm) {
        notificationForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const title = document.getElementById('notificationTitle').value;
            const description = document.getElementById('notificationDescription').value;
            const day = document.getElementById('notificationDay').value;
            const time = document.getElementById('notificationTime').value;
            const location = document.getElementById('notificationLocation').value;

            if (title && description && day && time && location) {
                const notification = {
                    title,
                    description,
                    day,
                    time,
                    location
                };
                notifications.push(notification);
                saveToLocalStorage();
                renderNotifications();
                document.getElementById('notificationModal').style.display = 'none';
                notificationForm.reset();
            }
        });
    }

    function renderNotifications() {
        const container = document.getElementById('notifications-container');
        container.innerHTML = '';
        notifications.forEach((notification, index) => {
            const notificationElement = document.createElement('div');
            notificationElement.className = 'notification-card';
            notificationElement.innerHTML = `
                <button class="close-btn" onclick="removeNotification(${index})">&times;</button>
                <div class="header">
                    <h1>${notification.title}</h1>
                </div>
                <div class="content">
                    <p>${notification.description}</p>
                </div>
                <div class="event-details">
                    <p><strong>Event Details</strong></p>
                    <p>Day: ${new Date(notification.day).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                    })}</p>
                    <p>Time: ${formatTime(notification.time)}</p>
                    <p>Location: ${notification.location}</p>
                </div>
                <div class="footer">
                    <img src="https://allinall.ie/wp-content/uploads/2017/02/cropped-AllinAll-logo-1.jpg" alt="All in All Ingredients Logo">
                </div>
            `;
            container.appendChild(notificationElement);
    
            const eventTime = new Date(`${notification.day}T${notification.time}:00`);
            const now = new Date();
            const diffMs = eventTime.getTime() - now.getTime();
            if (diffMs > 0) {
                setTimeout(() => {
                    removeNotification(index);
                }, diffMs + 30 * 60 * 1000);
            }
        });
    }

    function removeNotification(index) {
        notifications.splice(index, 1);
        saveToLocalStorage();
        renderNotifications();
    }

    function formatTime(time) {
        const timeParts = time.split(':');
        const hour = parseInt(timeParts[0]);
        const minute = timeParts[1];
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
        return `${formattedHour}:${minute} ${ampm}`;
    }

    // Function to set min date for notification day
    function setMinDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('notificationDay').setAttribute('min', today);
    }

    // Function to focus on next input and show picker
    function focusOnNextInput() {
        const inputs = document.querySelectorAll('#notificationForm input, #notificationForm textarea');
        inputs.forEach((input, index) => {
            input.addEventListener('keydown', function(event) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    const nextInput = inputs[index + 1];
                    if (nextInput) {
                        nextInput.focus();
                        if (nextInput.type === 'date' || nextInput.type === 'time') {
                            setTimeout(() => nextInput.showPicker(), 0);
                        }
                    }
                }
            });
        });
    }

    // Handle the Service Order form submission
    if (serviceOrderForm) {
        serviceOrderForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const newOrder = {
                orderNumber: document.getElementById('orderNumber').value,
                serviceDateTime: document.getElementById('serviceDateTime').value,
                productCode: document.getElementById('productCode').value,
                serviceDescription: document.getElementById('serviceDescription').value,
                technicianName: document.getElementById('technicianName').value,
                serviceNotes: document.getElementById('serviceNotes').value,
                creationTime: new Date().toLocaleString(),
                completed: false
            };

            serviceOrders.push(newOrder);
            saveToLocalStorage();
            displayServiceOrders();

            document.getElementById('serviceOrderModal').style.display = 'none';
            serviceOrderForm.reset();
        });
    }

    // Initial population
    populateProductList();
    updateAllTables();
    displayServiceOrders();
    setMinDate();
    focusOnNextInput();

    // Initial visibility check for Post-It containers
    updatePostItContainerVisibility('postItContainer1');
    updatePostItContainerVisibility('postItContainer2');
    updatePostItContainerVisibility('postItContainer3');
});

document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('.tab-link');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            contents.forEach(content => content.classList.remove('active'));
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });
});
document.addEventListener('DOMContentLoaded', function() {
    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');
    const openLoginModalBtn = document.getElementById('openLoginModal');
    const openSignUpModalBtn = document.getElementById('openSignUpModal');
    const closeLoginModalBtn = document.getElementById('closeLoginModal');
    const closeSignUpModalBtn = document.getElementById('closeSignUpModal');
    const showSignUpLink = document.getElementById('showSignUp');
    const showLoginLink = document.getElementById('showLogin');

    // Abrir o modal de Login
    if (openLoginModalBtn) {
        openLoginModalBtn.addEventListener('click', () => {
            loginModal.style.display = 'block';
            signupModal.style.display = 'none';  // Certifique-se de que o modal de signup está fechado
        });
    }

    // Abrir o modal de Signup
    if (openSignUpModalBtn) {
        openSignUpModalBtn.addEventListener('click', () => {
            signupModal.style.display = 'block';
            loginModal.style.display = 'none';  // Certifique-se de que o modal de login está fechado
        });
    }

    // Fechar o modal de Login
    if (closeLoginModalBtn) {
        closeLoginModalBtn.addEventListener('click', () => {
            loginModal.style.display = 'none';
        });
    }

    // Fechar o modal de Signup
    if (closeSignUpModalBtn) {
        closeSignUpModalBtn.addEventListener('click', () => {
            signupModal.style.display = 'none';
        });
    }

    // Alternar para o modal de Sign Up a partir do modal de Login
    if (showSignUpLink) {
        showSignUpLink.addEventListener('click', (event) => {
            event.preventDefault();
            loginModal.style.display = 'none';
            signupModal.style.display = 'block';
        });
    }

    // Alternar para o modal de Login a partir do modal de Sign Up
    if (showLoginLink) {
        showLoginLink.addEventListener('click', (event) => {
            event.preventDefault();
            signupModal.style.display = 'none';
            loginModal.style.display = 'block';
        });
    }

    // Fechar o modal ao clicar fora dele
    window.addEventListener('click', (event) => {
        if (event.target === loginModal) {
            loginModal.style.display = 'none';
        }
        if (event.target === signupModal) {
            signupModal.style.display = 'none';
        }
    });
});
