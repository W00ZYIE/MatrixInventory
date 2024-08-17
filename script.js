let items = [];
let currentPage = 1;
const itemsPerPage = 10;
let editIndex = null;

// Load items from local storage
const loadItems = () => {
    const savedItems = localStorage.getItem('items');
    items = savedItems ? JSON.parse(savedItems) : [];
};

// Save items to local storage
const saveItems = () => {
    localStorage.setItem('items', JSON.stringify(items));
};

// Render items
const renderItems = () => {
    const itemsTableBody = document.getElementById('items');
    itemsTableBody.innerHTML = '';
    const searchTerm = document.getElementById('search-input').value.toLowerCase();

    const filteredItems = items.filter(item => 
        item.name.toLowerCase().includes(searchTerm) || 
        item.category.toLowerCase().includes(searchTerm)
    );

    const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    paginatedItems.forEach((item, index) => {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.purchaseDate}</td>
            <td>${item.quantity}</td>
            <td>$${item.purchasePrice.toFixed(2)}</td>
            <td>
                <button class="edit-button" onclick="editItem(${index + (currentPage - 1) * itemsPerPage})">Edit</button>
                <button class="delete-button" onclick="deleteItem(${index + (currentPage - 1) * itemsPerPage})">Delete</button>
            </td>
        `;

        itemsTableBody.appendChild(newRow);
    });

    document.getElementById('page-info').textContent = `Page ${currentPage}`;
    document.querySelector('.page-button:nth-of-type(1)').disabled = currentPage === 1;
    document.querySelector('.page-button:nth-of-type(2)').disabled = currentPage === Math.ceil(filteredItems.length / itemsPerPage);
};

// Add new item or update existing item
document.getElementById('item-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const itemName = document.getElementById('item-name').value;
    const category = document.getElementById('category').value;
    const purchaseDate = document.getElementById('purchase-date').value;
    const quantity = document.getElementById('quantity').value;
    const purchasePrice = parseFloat(document.getElementById('purchase-price').value);

    const item = {
        name: itemName,
        category: category,
        purchaseDate: purchaseDate,
        quantity: quantity,
        purchasePrice: purchasePrice
    };

    if (editIndex !== null) {
        items[editIndex] = item;
        showNotification('Item updated successfully!');
        editIndex = null;
    } else {
        items.push(item);
        showNotification('Item added successfully!');
    }

    saveItems();
    renderItems();
    document.getElementById('item-form').reset();
});

// Edit item
const editItem = (index) => {
    const item = items[index];
    document.getElementById('item-name').value = item.name;
    document.getElementById('category').value = item.category;
    document.getElementById('purchase-date').value = item.purchaseDate;
    document.getElementById('quantity').value = item.quantity;
    document.getElementById('purchase-price').value = item.purchasePrice;

    editIndex = index;
};

// Delete item
const deleteItem = (index) => {
    items.splice(index, 1);
    saveItems();
    renderItems();
    showNotification('Item deleted successfully!');
};

// Search functionality
document.getElementById('search-input').addEventListener('input', renderItems);

// Pagination
const changePage = (direction) => {
    const totalPages = Math.ceil(items.length / itemsPerPage);
    currentPage = Math.max(1, Math.min(totalPages, currentPage + direction));
    renderItems();
};

// Export CSV
const exportData = () => {
    const csvRows = [];
    const headers = ['Item Name', 'Category', 'Purchase Date', 'Quantity', 'Purchase Price ($)'];
    csvRows.push(headers.join(','));

    items.forEach(item => {
        const row = [
            item.name,
            item.category,
            item.purchaseDate,
            item.quantity,
            item.purchasePrice.toFixed(2)
        ];
        csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory.csv';
    a.click();
    URL.revokeObjectURL(url);
};

// Render Analytics
const renderAnalytics = () => {
    const ctxSalesValue = document.getElementById('salesValueChart').getContext('2d');
    const ctxProfitMargin = document.getElementById('profitMarginChart').getContext('2d');
    const ctxCategoryPerformance = document.getElementById('categoryPerformanceChart').getContext('2d');

    const totalValue = items.reduce((sum, item) => sum + item.purchasePrice * item.quantity, 0).toFixed(2);
    const totalCost = items.reduce((sum, item) => sum + (item.purchasePrice * 0.7 * item.quantity), 0).toFixed(2); // Assuming 30% profit margin
    const totalProfit = (totalValue - totalCost).toFixed(2);

    const categories = {};
    items.forEach(item => {
        categories[item.category] = (categories[item.category] || 0) + (item.purchasePrice * item.quantity);
    });

    // Sales Value Chart
    new Chart(ctxSalesValue, {
        type: 'bar',
        data: {
            labels: ['Total Sales Value'],
            datasets: [{
                label: 'Value ($)',
                data: [totalValue],
                backgroundColor: '#007bff',
                borderColor: '#0056b3',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (tooltipItem) => `Value: $${tooltipItem.raw}` } }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    // Profit Margin Chart
    new Chart(ctxProfitMargin, {
        type: 'doughnut',
        data: {
            labels: ['Profit', 'Cost'],
            datasets: [{
                label: 'Profit Margin',
                data: [totalProfit, totalCost],
                backgroundColor: ['#28a745', '#dc3545'],
                borderColor: '#fff',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: { callbacks: { label: (tooltipItem) => `Amount: $${tooltipItem.raw}` } }
            }
        }
    });

    // Category Performance Chart
    new Chart(ctxCategoryPerformance, {
        type: 'pie',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                label: 'Value by Category',
                data: Object.values(categories),
                backgroundColor: Object.keys(categories).map(() => `#${Math.floor(Math.random() * 16777215).toString(16)}`),
                borderColor: '#fff',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: { callbacks: { label: (tooltipItem) => `Value: $${tooltipItem.raw}` } }
            }
        }
    });
};

// Tab Switching
const showTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.toggle('active', tab.id === tabId);
    });

    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.toggle('active', button.textContent.toLowerCase().includes(tabId));
    });

    if (tabId === 'analytics') {
        renderAnalytics();
    }
};

// Dark Mode Toggle
const toggleDarkMode = () => {
    document.body.classList.toggle('dark-mode');
    const chartColors = document.body.classList.contains('dark-mode') ? '#fff' : '#000';
    Chart.defaults.color = chartColors;
    renderAnalytics(); // Re-render analytics charts to apply dark mode styles
};


// Show Notification
const showNotification = (message) => {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.remove('hidden');
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
        notification.classList.add('hidden');
    }, 3000);
};

// Initial Load
loadItems();
renderItems();
showTab('add-item');
