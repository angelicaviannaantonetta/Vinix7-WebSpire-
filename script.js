// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenu = document.querySelector('.mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenu) {
        mobileMenu.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }

    // FAQ Accordion
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', () => {
            const item = question.parentNode;
            item.classList.toggle('active');
        });
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if(targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                }
            }
        });
    });

    // Navbar background on scroll
    window.addEventListener('scroll', function() {
        const header = document.querySelector('header');
        if(window.scrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.backdropFilter = 'blur(10px)';
        } else {
            header.style.background = 'white';
            header.style.backdropFilter = 'none';
        }
    });
});

// Order System Functions
class OrderSystem {
    constructor() {
        this.orders = JSON.parse(localStorage.getItem('orders')) || [];
        this.adminCredentials = {
            username: 'admin',
            password: 'admin123'
        };
    }

    // Save orders to localStorage
    saveOrders() {
        localStorage.setItem('orders', JSON.stringify(this.orders));
    }

    // Create new order
    createOrder(orderData) {
        const order = {
            id: Date.now().toString(),
            ...orderData,
            status: 'pending',
            createdAt: new Date().toISOString(),
            paymentProof: null
        };
        
        this.orders.push(order);
        this.saveOrders();
        return order;
    }

    // Get all orders
    getOrders() {
        return this.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Update order status
    updateOrderStatus(orderId, status) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            order.status = status;
            this.saveOrders();
            return true;
        }
        return false;
    }

    // Add payment proof
    addPaymentProof(orderId, fileData) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            order.paymentProof = fileData;
            order.status = 'paid';
            this.saveOrders();
            return true;
        }
        return false;
    }

    // Package prices
    getPackagePrice(packageType) {
        const prices = {
            'standard': 2500000,
            'business': 5000000,
            'premium': 8500000
        };
        return prices[packageType] || 0;
    }

    // Package details
    getPackageDetails(packageType) {
        const details = {
            'standard': {
                name: 'Standard',
                price: 2500000,
                description: 'Cocok untuk bisnis kecil atau profil perusahaan'
            },
            'business': {
                name: 'Business',
                price: 5000000,
                description: 'Ideal untuk UMKM yang ingin berkembang'
            },
            'premium': {
                name: 'Premium',
                price: 8500000,
                description: 'Solusi lengkap untuk perusahaan besar'
            }
        };
        return details[packageType] || details.standard;
    }
}

// Initialize order system
const orderSystem = new OrderSystem();

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4bb543' : '#dc3545'};
        color: white;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add these functions to your existing script.js file

// Show notification function
function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add notification styles if not already added
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                background: white;
                color: #333;
                border-radius: 8px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.15);
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 10px;
                max-width: 400px;
                border-left: 4px solid #4bb543;
                animation: slideInRight 0.3s ease;
            }
            .notification.error {
                border-left-color: #e63946;
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
                flex: 1;
            }
            .notification.success .notification-content i {
                color: #4bb543;
            }
            .notification.error .notification-content i {
                color: #e63946;
            }
            .notification-close {
                background: none;
                border: none;
                color: #666;
                cursor: pointer;
                padding: 5px;
                border-radius: 4px;
            }
            .notification-close:hover {
                background: #f5f5f5;
            }
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Format currency function
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}