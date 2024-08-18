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

// Render items in the table
const renderItems = () => {
    const itemsTableBody = document.getElementById('items');
    itemsTableBody.innerHTML = '';
    const searchTerm = document.getElementById('search-input').value.toLowerCase();

    // Filter items based on search term
    const filteredItems = items.filter(item => {
        const nameMatch = item.name.toLowerCase().includes(searchTerm);
        const categoryMatch = item.category.toLowerCase().includes(searchTerm);
        return nameMatch || categoryMatch;
    });

    // Paginate filtered items
    const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Render each item in the table
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

    // Update page info
    document.getElementById('page-info').textContent = `Page ${currentPage}`;
    document.querySelector('.page-button:nth-of-type(1)').disabled = currentPage === 1;
    document.querySelector('.page-button:nth-of-type(2)').disabled = currentPage === Math.ceil(filteredItems.length / itemsPerPage);

    // Update analytics
    renderAnalytics();
};

// Listen for search input changes
document.getElementById('search-input').addEventListener('input', renderItems);

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
    renderItems(); // Renders the items and updates analytics
    document.getElementById('item-form').reset();
});

// Edit an item
const editItem = (index) => {
    console.log('Editing item at index:', index);
    editIndex = index;
    const item = items[index];
    document.getElementById('item-name').value = item.name;
    document.getElementById('category').value = item.category;
    document.getElementById('purchase-date').value = item.purchaseDate;
    document.getElementById('quantity').value = item.quantity;
    document.getElementById('purchase-price').value = item.purchasePrice;
    document.querySelector('.tab-button:nth-child(1)').click(); // Switch to 'Add Item' tab
};

// Delete an item
const deleteItem = (index) => {
    console.log('Deleting item at index:', index);
    items.splice(index, 1);
    saveItems();
    renderItems();
    showNotification('Item deleted successfully!');
};


// Function to render all charts in the Analytics section
const renderAnalytics = () => {
    const ctxPurchasePrice = document.getElementById('purchasePriceChart').getContext('2d');
    const ctxCategoryPerformance = document.getElementById('categoryPerformanceChart').getContext('2d');
    const ctxPurchasesTrend = document.getElementById('purchasesTrendChart').getContext('2d');
    const ctxAgeOfInventory = document.getElementById('ageOfInventoryChart').getContext('2d');

    // Destroy existing charts to avoid duplication
    Chart.getChart(ctxPurchasePrice)?.destroy();
    Chart.getChart(ctxCategoryPerformance)?.destroy();
    Chart.getChart(ctxPurchasesTrend)?.destroy();
    Chart.getChart(ctxAgeOfInventory)?.destroy();

    // Calculate data for the charts
    const totalPurchasePrice = items.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0).toFixed(2);
    const avgPurchasePricePerItem = items.length ? (totalPurchasePrice / items.length).toFixed(2) : 0;

    const categories = {};
    items.forEach(item => {
        const category = item.category || 'Uncategorized';
        categories[category] = (categories[category] || 0) + (item.purchasePrice * item.quantity);
    });

    const purchaseDates = items.map(item => item.purchaseDate);
    const purchaseCounts = purchaseDates.reduce((acc, date) => {
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {});

    const ageOfInventoryData = items.map(item => {
        const purchaseDate = new Date(item.purchaseDate);
        const today = new Date();
        return Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24));
    });

    // Render charts with the calculated data
    new Chart(ctxPurchasePrice, {
        type: 'doughnut',
        data: {
            labels: ['Total Purchase Price', 'Average Purchase Price per Item'],
            datasets: [{
                label: 'Purchase Price Analysis',
                data: [totalPurchasePrice, avgPurchasePricePerItem],
                backgroundColor: ['#007bff', '#28a745'],
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

    new Chart(ctxPurchasesTrend, {
        type: 'line',
        data: {
            labels: Object.keys(purchaseCounts),
            datasets: [{
                label: 'Purchases Over Time',
                data: Object.values(purchaseCounts),
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: { callbacks: { label: (tooltipItem) => `Purchases: ${tooltipItem.raw}` } }
            }
        }
    });

    new Chart(ctxAgeOfInventory, {
        type: 'bar',
        data: {
            labels: items.map(item => item.name),
            datasets: [{
                label: 'Age of Inventory (days)',
                data: ageOfInventoryData,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: { callbacks: { label: (tooltipItem) => `Days: ${tooltipItem.raw}` } }
            }
        }
    });
};

// Ensure charts are rendered when the page loads
document.addEventListener('DOMContentLoaded', renderAnalytics);


// Call renderAnalytics when the analytics tab is shown
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
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

// Show Notification
const showNotification = (message) => {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
};

// Initial Load
loadItems();
renderItems();
showTab('add-item');
