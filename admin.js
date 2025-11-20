document.addEventListener('DOMContentLoaded', function() {
    // Initialize the dashboard
    initDashboard();
    
    // Check if admin is already logged in
    if (localStorage.getItem('adminLoggedIn') === 'true') {
        showDashboard();
    }
    
    // Login form handling
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (username === orderSystem.adminCredentials.username && 
            password === orderSystem.adminCredentials.password) {
            localStorage.setItem('adminLoggedIn', 'true');
            showDashboard();
            showNotification('Login berhasil!', 'success');
        } else {
            showNotification('Username atau password salah!', 'error');
        }
    });
    
    // Navigation handling
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all nav items
            document.querySelectorAll('.nav-item').forEach(nav => {
                nav.classList.remove('active');
            });
            
            // Add active class to clicked nav item
            this.classList.add('active');
            
            // Get the target section
            const targetSection = this.getAttribute('data-section');
            
            // Hide all sections
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show target section
            document.getElementById(`${targetSection}Section`).classList.add('active');
            
            // Update page title
            updatePageTitle(targetSection);
            
            // Load section-specific data
            if (targetSection === 'orders') {
                loadOrders();
            } else if (targetSection === 'customers') {
                loadCustomers();
            } else if (targetSection === 'overview') {
                loadOverview();
            }
        });
    });
    
    // Logout handling
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('adminLoggedIn');
        document.getElementById('dashboardSection').style.display = 'none';
        document.getElementById('loginSection').style.display = 'flex';
        showNotification('Logout berhasil!', 'success');
    });
    
    // Search functionality
    const searchOrders = document.getElementById('searchOrders');
    if (searchOrders) {
        searchOrders.addEventListener('input', function() {
            filterOrders(this.value);
        });
    }
    
    const searchCustomers = document.getElementById('searchCustomers');
    if (searchCustomers) {
        searchCustomers.addEventListener('input', function() {
            filterCustomers(this.value);
        });
    }
});

// Initialize dashboard
function initDashboard() {
    // Set current date
    const currentDate = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = currentDate.toLocaleDateString('id-ID', options);
    
    // Initialize charts
    initCharts();
}

// Show dashboard after login
function showDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'flex';
    
    // Load initial data
    loadOverview();
}

// Update page title based on active section
function updatePageTitle(section) {
    const titles = {
        'overview': 'Dashboard Overview',
        'orders': 'Manajemen Pemesanan',
        'customers': 'Data Customers'
    };
    
    const subtitles = {
        'overview': 'Ringkasan statistik dan aktivitas terbaru',
        'orders': 'Kelola semua pemesanan dari customers',
        'customers': 'Data lengkap semua customers'
    };
    
    document.getElementById('pageTitle').textContent = titles[section] || 'Dashboard';
    document.getElementById('pageSubtitle').textContent = subtitles[section] || '';
}

// Load overview data
function loadOverview() {
    const orders = orderSystem.getOrders();
    updateStatistics(orders);
    updateRecentActivities(orders);
    updateOrdersChart(orders);
}

// Update statistics cards
function updateStatistics(orders) {
    document.getElementById('totalOrders').textContent = orders.length;
    document.getElementById('pendingOrders').textContent = orders.filter(o => o.status === 'pending').length;
    document.getElementById('paidOrders').textContent = orders.filter(o => o.status === 'paid').length;
    document.getElementById('completedOrders').textContent = orders.filter(o => o.status === 'completed').length;
    document.getElementById('cancelledOrders').textContent = orders.filter(o => o.status === 'cancelled').length;
    
    // Update orders badge
    document.getElementById('ordersBadge').textContent = orders.length;
}

// Update recent activities
function updateRecentActivities(orders) {
    const activitiesContainer = document.getElementById('recentActivities');
    const recentOrders = orders.slice(0, 5); // Get 5 most recent orders
    
    if (recentOrders.length === 0) {
        activitiesContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Belum ada aktivitas</p>';
        return;
    }
    
    activitiesContainer.innerHTML = recentOrders.map(order => {
        const packageDetails = orderSystem.getPackageDetails(order.package);
        const statusIcon = getStatusIcon(order.status);
        const statusClass = getStatusClass(order.status);
        
        return `
            <div class="activity-item">
                <div class="customer-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="activity-icon ${statusClass}">
                    <i class="${statusIcon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${order.name} - ${packageDetails.name}</div>
                    <div class="activity-time">${formatDate(order.createdAt)}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Get status icon
function getStatusIcon(status) {
    const icons = {
        'pending': 'fas fa-clock',
        'paid': 'fas fa-check-circle',
        'completed': 'fas fa-trophy',
        'cancelled': 'fas fa-times-circle'
    };
    return icons[status] || 'fas fa-info-circle';
}

// Get status class
function getStatusClass(status) {
    const classes = {
        'pending': 'warning',
        'paid': 'primary',
        'completed': 'success',
        'cancelled': 'danger'
    };
    return classes[status] || 'primary';
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format date for CSV (without time)
function formatDateForCSV(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

// Initialize charts
function initCharts() {
    const ctx = document.getElementById('ordersChart').getContext('2d');
    
    // Create initial chart with empty data
    window.ordersChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Pemesanan',
                data: [12, 19, 8, 15, 12, 18],
                backgroundColor: 'rgba(67, 97, 238, 0.7)',
                borderColor: 'rgba(67, 97, 238, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Update orders chart with real data
function updateOrdersChart(orders) {
    if (!window.ordersChart) return;
    
    // Group orders by month for the chart
    const monthlyData = {};
    orders.forEach(order => {
        const date = new Date(order.createdAt);
        const monthYear = `${date.getFullYear()}-${date.getMonth()}`;
        
        if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = 0;
        }
        monthlyData[monthYear]++;
    });
    
    // Update chart data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentData = months.map((month, index) => {
        const monthYear = `${new Date().getFullYear()}-${index}`;
        return monthlyData[monthYear] || 0;
    });
    
    window.ordersChart.data.datasets[0].data = currentData;
    window.ordersChart.update();
}

// Load orders
function loadOrders() {
    const orders = orderSystem.getOrders();
    const ordersList = document.getElementById('ordersList');
    
    if (orders.length === 0) {
        ordersList.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-shopping-cart" style="font-size: 2rem; margin-bottom: 10px; display: block; opacity: 0.5;"></i>
                    Belum ada pesanan
                </td>
            </tr>
        `;
        return;
    }
    
    ordersList.innerHTML = orders.map(order => {
        const packageDetails = orderSystem.getPackageDetails(order.package);
        const statusClass = `status-badge status-${order.status}`;
        const statusText = getStatusText(order.status);
        
        return `
            <tr>
                <td>
                    <div style="display: flex; align-items: center;">
                        <div class="customer-avatar" style="margin-right: 10px;">
                            <i class="fas fa-user"></i>
                        </div>
                        <div>
                            <strong>${order.name}</strong><br>
                            <small>${order.email}</small>
                        </div>
                    </div>
                </td>
                <td>${packageDetails.name}</td>
                <td>${formatDate(order.createdAt)}</td>
                <td>${formatCurrency(order.packagePrice)}</td>
                <td><span class="${statusClass}">${statusText}</span></td>
                <td>
                    <div style="display: flex; gap: 5px;">
                        <button onclick="viewOrderDetail('${order.id}')" class="btn btn-primary btn-sm">
                            <i class="fas fa-eye"></i>
                        </button>
                        <select onchange="updateOrderStatus('${order.id}', this.value)" style="padding: 5px; border-radius: 4px; border: 1px solid #ddd; font-size: 0.8rem;">
                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="paid" ${order.status === 'paid' ? 'selected' : ''}>Paid</option>
                            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Load customers
function loadCustomers() {
    const orders = orderSystem.getOrders();
    const customersList = document.getElementById('customersList');
    
    // Extract unique customers
    const customersMap = {};
    orders.forEach(order => {
        if (!customersMap[order.email]) {
            customersMap[order.email] = {
                name: order.name,
                email: order.email,
                phone: order.phone,
                orders: 0,
                totalSpent: 0
            };
        }
        customersMap[order.email].orders++;
        customersMap[order.email].totalSpent += order.packagePrice;
    });
    
    const customers = Object.values(customersMap);
    
    if (customers.length === 0) {
        customersList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666; grid-column: 1 / -1;">
                <i class="fas fa-users" style="font-size: 2rem; margin-bottom: 10px; display: block; opacity: 0.5;"></i>
                Belum ada customer
            </div>
        `;
        return;
    }
    
    customersList.innerHTML = customers.map(customer => {
        return `
            <div class="customer-card">
                <div class="customer-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="customer-info">
                    <h4>${customer.name}</h4>
                    <p>${customer.email}</p>
                    <p>${customer.phone}</p>
                    <p><strong>${customer.orders}</strong> pesanan • ${formatCurrency(customer.totalSpent)}</p>
                </div>
            </div>
        `;
    }).join('');
}

// Filter orders
function filterOrders(searchTerm) {
    const orders = orderSystem.getOrders();
    const filteredOrders = orders.filter(order => 
        order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.package.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const ordersList = document.getElementById('ordersList');
    
    if (filteredOrders.length === 0) {
        ordersList.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
                    Tidak ditemukan pesanan yang sesuai dengan pencarian
                </td>
            </tr>
        `;
        return;
    }
    
    ordersList.innerHTML = filteredOrders.map(order => {
        const packageDetails = orderSystem.getPackageDetails(order.package);
        const statusClass = `status-badge status-${order.status}`;
        const statusText = getStatusText(order.status);
        
        return `
            <tr>
                <td>
                    <div style="display: flex; align-items: center;">
                        <div class="customer-avatar" style="margin-right: 10px;">
                            <i class="fas fa-user"></i>
                        </div>
                        <div>
                            <strong>${order.name}</strong><br>
                            <small>${order.email}</small>
                        </div>
                    </div>
                </td>
                <td>${packageDetails.name}</td>
                <td>${formatDate(order.createdAt)}</td>
                <td>${formatCurrency(order.packagePrice)}</td>
                <td><span class="${statusClass}">${statusText}</span></td>
                <td>
                    <div style="display: flex; gap: 5px;">
                        <button onclick="viewOrderDetail('${order.id}')" class="btn btn-primary btn-sm">
                            <i class="fas fa-eye"></i>
                        </button>
                        <select onchange="updateOrderStatus('${order.id}', this.value)" style="padding: 5px; border-radius: 4px; border: 1px solid #ddd; font-size: 0.8rem;">
                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="paid" ${order.status === 'paid' ? 'selected' : ''}>Paid</option>
                            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Filter customers
function filterCustomers(searchTerm) {
    const orders = orderSystem.getOrders();
    const customersMap = {};
    
    orders.forEach(order => {
        if (!customersMap[order.email]) {
            customersMap[order.email] = {
                name: order.name,
                email: order.email,
                phone: order.phone,
                orders: 0,
                totalSpent: 0
            };
        }
        customersMap[order.email].orders++;
        customersMap[order.email].totalSpent += order.packagePrice;
    });
    
    const customers = Object.values(customersMap);
    const filteredCustomers = customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const customersList = document.getElementById('customersList');
    
    if (filteredCustomers.length === 0) {
        customersList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666; grid-column: 1 / -1;">
                Tidak ditemukan customer yang sesuai dengan pencarian
            </div>
        `;
        return;
    }
    
    customersList.innerHTML = filteredCustomers.map(customer => {
        return `
            <div class="customer-card">
                <div class="customer-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="customer-info">
                    <h4>${customer.name}</h4>
                    <p>${customer.email}</p>
                    <p>${customer.phone}</p>
                    <p><strong>${customer.orders}</strong> pesanan • ${formatCurrency(customer.totalSpent)}</p>
                </div>
            </div>
        `;
    }).join('');
}

// View order detail
function viewOrderDetail(orderId) {
    const orders = orderSystem.getOrders();
    const order = orders.find(o => o.id === orderId);
    
    if (!order) return;
    
    const packageDetails = orderSystem.getPackageDetails(order.package);
    const modal = document.getElementById('orderModal');
    const content = document.getElementById('orderDetailContent');
    
    // Create payment proof section
    let paymentProofSection = '';
    if (order.paymentProof) {
        paymentProofSection = `
            <div class="form-group">
                <h4>Bukti Pembayaran</h4>
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button onclick="viewPaymentProof('${order.id}')" class="btn btn-primary">
                        <i class="fas fa-eye"></i> Lihat Bukti
                    </button>
                    <button onclick="downloadPaymentProof('${order.id}')" class="btn btn-secondary">
                        <i class="fas fa-download"></i> Download Bukti
                    </button>
                </div>
                <p style="margin-top: 10px; font-size: 0.9rem; color: #666;">
                    <i class="fas fa-info-circle"></i> File: ${order.paymentProof.name}
                </p>
            </div>
        `;
    }
    
    content.innerHTML = `
        <div class="form-group">
            <h4>Informasi Customer</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px;">
                <div>
                    <label>Nama Lengkap</label>
                    <div class="form-control" style="background: #f8f9fa;">${order.name}</div>
                </div>
                <div>
                    <label>Email</label>
                    <div class="form-control" style="background: #f8f9fa;">${order.email}</div>
                </div>
                <div>
                    <label>No. WhatsApp</label>
                    <div class="form-control" style="background: #f8f9fa;">${order.phone}</div>
                </div>
                <div>
                    <label>Status</label>
                    <div class="form-control" style="background: #f8f9fa;">
                        <span class="status-badge status-${order.status}">${getStatusText(order.status)}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="form-group">
            <h4>Detail Pemesanan</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px;">
                <div>
                    <label>Paket</label>
                    <div class="form-control" style="background: #f8f9fa;">${packageDetails.name}</div>
                </div>
                <div>
                    <label>Harga</label>
                    <div class="form-control" style="background: #f8f9fa;">${formatCurrency(order.packagePrice)}</div>
                </div>
                <div>
                    <label>Tanggal Pemesanan</label>
                    <div class="form-control" style="background: #f8f9fa;">${formatDate(order.createdAt)}</div>
                </div>
                <div>
                    <label>Jadwal Meeting</label>
                    <div class="form-control" style="background: #f8f9fa;">${new Date(order.meetingDate).toLocaleString('id-ID')}</div>
                </div>
            </div>
        </div>
        
        <div class="form-group">
            <h4>Deskripsi Kebutuhan</h4>
            <div class="form-control" style="background: #f8f9fa; min-height: 100px;">${order.description}</div>
        </div>
        
        ${order.notes ? `
        <div class="form-group">
            <h4>Catatan Tambahan</h4>
            <div class="form-control" style="background: #f8f9fa; min-height: 80px;">${order.notes}</div>
        </div>
        ` : ''}
        
        ${paymentProofSection}
        
        <div style="margin-top: 25px; text-align: center;">
            <button onclick="closeModal()" class="btn btn-secondary">Tutup</button>
        </div>
    `;
    
    modal.style.display = 'flex';
}

// Update order status
function updateOrderStatus(orderId, newStatus) {
    if (orderSystem.updateOrderStatus(orderId, newStatus)) {
        showNotification('Status pesanan berhasil diupdate!', 'success');
        // Reload current section
        const activeSection = document.querySelector('.content-section.active').id;
        if (activeSection === 'ordersSection') {
            loadOrders();
        } else if (activeSection === 'overviewSection') {
            loadOverview();
        }
    } else {
        showNotification('Gagal mengupdate status pesanan!', 'error');
    }
}

// View payment proof
function viewPaymentProof(orderId) {
    const orders = orderSystem.getOrders();
    const order = orders.find(o => o.id === orderId);
    
    if (!order || !order.paymentProof) {
        showNotification('Bukti pembayaran tidak ditemukan!', 'error');
        return;
    }
    
    const modal = document.getElementById('paymentProofModal');
    const content = document.getElementById('paymentProofContent');
    
    const fileExtension = order.paymentProof.name.split('.').pop().toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(fileExtension);
    const isPDF = fileExtension === 'pdf';
    
    let proofContent = '';
    
    if (isImage) {
        proofContent = `
            <div style="text-align: center;">
                <img src="${order.paymentProof.data}" 
                     alt="Bukti Pembayaran" 
                     style="max-width: 100%; max-height: 70vh; border: 1px solid #ddd; border-radius: 5px;">
                <p style="margin-top: 15px; color: #666;">${order.paymentProof.name}</p>
            </div>
        `;
    } else if (isPDF) {
        proofContent = `
            <div style="text-align: center;">
                <embed src="${order.paymentProof.data}" 
                       type="application/pdf" 
                       width="100%" 
                       height="600px"
                       style="border: 1px solid #ddd; border-radius: 5px;">
                <p style="margin-top: 15px; color: #666;">${order.paymentProof.name}</p>
                <div style="margin-top: 15px;">
                    <a href="${order.paymentProof.data}" 
                       download="${order.paymentProof.name}" 
                       class="btn btn-primary">
                        <i class="fas fa-download"></i> Download PDF
                    </a>
                </div>
            </div>
        `;
    } else {
        proofContent = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-file fa-3x" style="color: #666; margin-bottom: 15px;"></i>
                <p>Format file tidak dapat ditampilkan preview</p>
                <p style="color: #666;">${order.paymentProof.name}</p>
                <div style="margin-top: 15px;">
                    <a href="${order.paymentProof.data}" 
                       download="${order.paymentProof.name}" 
                       class="btn btn-primary">
                        <i class="fas fa-download"></i> Download File
                    </a>
                </div>
            </div>
        `;
    }
    
    content.innerHTML = proofContent;
    modal.style.display = 'flex';
}

// Download payment proof
function downloadPaymentProof(orderId) {
    const orders = orderSystem.getOrders();
    const order = orders.find(o => o.id === orderId);
    
    if (!order || !order.paymentProof) {
        showNotification('Bukti pembayaran tidak ditemukan!', 'error');
        return;
    }
    
    try {
        const link = document.createElement('a');
        link.href = order.paymentProof.data;
        link.download = order.paymentProof.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Download bukti pembayaran berhasil!', 'success');
    } catch (error) {
        console.error('Error downloading file:', error);
        showNotification('Gagal mendownload bukti pembayaran!', 'error');
    }
}

// Export orders to CSV
function exportOrders() {
    const orders = orderSystem.getOrders();
    
    if (orders.length === 0) {
        showNotification('Tidak ada data pemesanan untuk di-export!', 'warning');
        return;
    }
    
    // Prepare CSV content
    const headers = ['Nama Customer', 'Email', 'No. WhatsApp', 'Paket', 'Harga', 'Status', 'Tanggal Pemesanan', 'Jadwal Meeting', 'Deskripsi Kebutuhan', 'Catatan Tambahan'];
    
    let csvContent = headers.join(',') + '\n';
    
    orders.forEach(order => {
        const packageDetails = orderSystem.getPackageDetails(order.package);
        const statusText = getStatusText(order.status);
        
        const row = [
            `"${order.name}"`,
            `"${order.email}"`,
            `"${order.phone}"`,
            `"${packageDetails.name}"`,
            `"${formatCurrency(order.packagePrice)}"`,
            `"${statusText}"`,
            `"${formatDateForCSV(order.createdAt)}"`,
            `"${new Date(order.meetingDate).toLocaleString('id-ID')}"`,
            `"${order.description.replace(/"/g, '""')}"`,
            `"${(order.notes || '').replace(/"/g, '""')}"`
        ];
        
        csvContent += row.join(',') + '\n';
    });
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const currentDate = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `data-pemesanan-${currentDate}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Data pemesanan berhasil di-export!', 'success');
}

// Close modal
function closeModal() {
    document.getElementById('orderModal').style.display = 'none';
}

// Close payment proof modal
function closePaymentProofModal() {
    document.getElementById('paymentProofModal').style.display = 'none';
}

// Helper function to get status text
function getStatusText(status) {
    const statusMap = {
        'pending': 'Menunggu Pembayaran',
        'paid': 'Sudah Bayar',
        'completed': 'Selesai',
        'cancelled': 'Dibatalkan'
    };
    return statusMap[status] || status;
}