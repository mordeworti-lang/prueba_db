/* ===== MEGASTORE GLOBAL - DARK MAFIA APP ===== */

/* ===== GLOBAL STATE ===== */
const MafiaApp = {
    state: {
        accessToken: localStorage.getItem('accessToken'),
        currentUser: null,
        cart: [],
        realBackendAvailable: false,
        isLoading: false
    },
    
    // ===== CONFIG =====
    config: {
        api: {
            baseUrl: '/api',
            timeout: 10000
        },
        ui: {
            toastDuration: 5000,
            animationDuration: 300
        },
        theme: {
            primary: '#dc2626',
            dark: '#0a0a0a',
            card: '#1a1a1a',
            text: '#e5e5e5',
            muted: '#a0a0a0'
        }
    },

    // ===== INITIALIZATION =====
    init() {
        this.bindEvents();
        this.checkAuth();
        this.setupServiceWorker();
    },

    // ===== EVENT BINDING =====
    bindEvents() {
        document.addEventListener('DOMContentLoaded', () => this.onDOMContentLoaded());
        window.addEventListener('beforeunload', () => this.cleanup());
    },

    // ===== AUTHENTICATION =====
    async checkAuth() {
        if (this.state.accessToken) {
            try {
                const user = await this.apiCall('/auth/me');
                if (user.ok) {
                    this.state.currentUser = user.user;
                    this.state.realBackendAvailable = true;
                    this.showDashboard();
                } else {
                    this.fallbackToDemo();
                }
            } catch (error) {
                this.fallbackToDemo();
            }
        } else {
            this.showAuth();
        }
    },

    async login(email, password) {
        try {
            this.setLoading(true);
            const response = await fetch(`${this.config.api.baseUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (data.ok) {
                this.state.accessToken = data.accessToken;
                this.state.currentUser = data.user;
                this.state.realBackendAvailable = true;
                
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                
                this.showDashboard();
                this.showToast('success', 'ACCESS GRANTED', 'Welcome to the Family');
            } else {
                this.fallbackToDemo();
            }
        } catch (error) {
            this.fallbackToDemo();
        } finally {
            this.setLoading(false);
        }
    },

    async register(name, email, password) {
        try {
            this.setLoading(true);
            const response = await fetch(`${this.config.api.baseUrl}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();
            
            if (data.ok) {
                this.showToast('success', 'REGISTRATION COMPLETE', 'Welcome to the Family');
                this.toggleAuthForm();
            } else {
                this.showToast('error', 'REGISTRATION FAILED', data.error || 'Could not register');
            }
        } catch (error) {
            this.showToast('error', 'CONNECTION ERROR', 'Could not connect to server');
        } finally {
            this.setLoading(false);
        }
    },

    logout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        this.state.accessToken = null;
        this.state.currentUser = null;
        this.state.cart = [];
        this.state.realBackendAvailable = false;
        
        this.showAuth();
        this.showToast('info', 'SESSION ENDED', 'You have been logged out');
    },

    // ===== UI MANAGEMENT =====
    showAuth() {
        this.hideElement('dashboardSection');
        this.showElement('authSection');
    },

    showDashboard() {
        this.hideElement('authSection');
        this.showElement('dashboardSection');
        this.loadUserInfo();
        this.loadDashboardData();
    },

    toggleAuthForm() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const toggleText = document.getElementById('authToggleText');
        
        if (loginForm.classList.contains('hidden')) {
            this.showElement('loginForm');
            this.hideElement('registerForm');
            toggleText.textContent = 'New to Family? Join Us';
        } else {
            this.hideElement('loginForm');
            this.showElement('registerForm');
            toggleText.textContent = 'Already Family? Sign In';
        }
    },

    // ===== API CALLS =====
    async apiCall(endpoint, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.state.accessToken && { 'Authorization': `Bearer ${this.state.accessToken}` })
            },
            timeout: this.config.api.timeout
        };

        if (this.state.realBackendAvailable) {
            try {
                const response = await fetch(`${this.config.api.baseUrl}${endpoint}`, { ...defaultOptions, ...options });
                
                if (response.status === 401) {
                    this.logout();
                    throw new Error('Session expired');
                }
                
                const data = await response.json();
                
                if (!response.ok && endpoint.includes('/')) {
                    throw new Error(data.error || 'API Error');
                }
                
                return data;
            } catch (error) {
                console.error('Backend error, falling back to demo mode:', error);
                this.state.realBackendAvailable = false;
                return this.getMockData(endpoint, options);
            }
        } else {
            return this.getMockData(endpoint, options);
        }
    },

    // ===== MOCK DATA =====
    getMockData(endpoint, options = {}) {
        const mockData = {
            '/auth/me': () => ({ ok: true, user: this.state.currentUser }),
            '/sales': () => ({
                ok: true,
                sales: [
                    { id: 1, client_name: 'Giovanni Rossi', product_name: 'Luxury Watch', quantity: 1, total_amount: 5000.00, sale_date: '2024-01-15' },
                    { id: 2, client_name: 'Marco Ferrari', product_name: 'Italian Leather Bag', quantity: 2, total_amount: 2400.00, sale_date: '2024-01-14' },
                    { id: 3, client_name: 'Antonio Romano', product_name: 'Custom Suit', quantity: 1, total_amount: 3500.00, sale_date: '2024-01-13' },
                    { id: 4, client_name: 'Luca Bianchi', product_name: 'Gold Ring', quantity: 3, total_amount: 9000.00, sale_date: '2024-01-12' },
                    { id: 5, client_name: 'Francesco Conti', product_name: 'Designer Shoes', quantity: 2, total_amount: 1800.00, sale_date: '2024-01-11' }
                ]
            }),
            '/cart': () => ({ ok: true, cart: { items: this.state.cart, totals: this.getCartTotals() } }),
            '/reports/suppliers': () => ({
                ok: true,
                data: [
                    { supplier_name: 'Milano Fashion House', total_items_sold: 250, total_revenue: 125000 },
                    { supplier_name: 'Roma Luxury Goods', total_items_sold: 180, total_revenue: 95000 },
                    { supplier_name: 'Veneto Textiles', total_items_sold: 150, total_revenue: 75000 },
                    { supplier_name: 'Florence Artisans', total_items_sold: 120, total_revenue: 60000 },
                    { supplier_name: 'Napoli Goldsmiths', total_items_sold: 89, total_revenue: 44500 }
                ]
            }),
            '/reports/top-products': () => ({
                ok: true,
                data: [
                    { product_name: 'Luxury Watch', total_quantity_sold: 45, total_revenue: 225000 },
                    { product_name: 'Gold Ring', total_quantity_sold: 78, total_revenue: 234000 },
                    { product_name: 'Custom Suit', total_quantity_sold: 32, total_revenue: 112000 },
                    { product_name: 'Italian Leather Bag', total_quantity_sold: 56, total_revenue: 67200 },
                    { product_name: 'Designer Shoes', total_quantity_sold: 89, total_revenue: 80100 }
                ]
            })
        };

        // Handle dynamic endpoints
        if (endpoint.includes('/reports/clients/')) {
            return {
                ok: true,
                purchases: [
                    { productName: 'Luxury Watch', quantity: 1, unitPrice: 5000, totalAmount: 5000, date: '2024-01-10' },
                    { productName: 'Gold Ring', quantity: 2, unitPrice: 3000, totalAmount: 6000, date: '2024-01-08' },
                    { productName: 'Italian Leather Bag', quantity: 1, unitPrice: 1200, totalAmount: 1200, date: '2024-01-05' }
                ]
            };
        }

        if (endpoint.includes('/reports/audit-logs')) {
            return {
                ok: true,
                data: [
                    { action: 'DELETE', entity: 'sale', entityId: 123, deletedAt: new Date(Date.now() - 3600000).toISOString() },
                    { action: 'DELETE', entity: 'product', entityId: 456, deletedAt: new Date(Date.now() - 7200000).toISOString() },
                    { action: 'DELETE', entity: 'client', entityId: 789, deletedAt: new Date(Date.now() - 10800000).toISOString() },
                    { action: 'DELETE', entity: 'supplier', entityId: 101, deletedAt: new Date(Date.now() - 14400000).toISOString() }
                ]
            };
        }

        if (endpoint.includes('/simulacro/migrate')) {
            return {
                ok: true,
                message: 'Migration completed successfully',
                summary: { clients: 150, products: 75, sales: 450 }
            };
        }

        // Handle cart operations
        if (options.method === 'POST' && endpoint.includes('/cart/items')) {
            const newItem = JSON.parse(options.body);
            this.state.cart.push({ ...newItem, addedAt: new Date().toISOString() });
            return { ok: true, cart: { items: this.state.cart, totals: this.getCartTotals() } };
        }

        if (options.method === 'DELETE' && endpoint.includes('/cart/items/')) {
            const productId = parseInt(endpoint.split('/').pop());
            this.state.cart = this.state.cart.filter(item => item.productId !== productId);
            return { ok: true, cart: { items: this.state.cart, totals: this.getCartTotals() } };
        }

        if (options.method === 'DELETE' && endpoint === '/cart') {
            this.state.cart = [];
            return { ok: true, cart: { items: this.state.cart, totals: this.getCartTotals() } };
        }

        if (options.method === 'POST' && endpoint.includes('/cart/checkout')) {
            const sales = this.state.cart.map(item => ({
                id: Date.now() + Math.random(),
                ...item,
                total_amount: item.quantity * item.unitPrice
            }));
            this.state.cart = [];
            return { ok: true, sales, totalAmount: sales.reduce((sum, s) => sum + s.total_amount, 0) };
        }

        // Return mock data or error
        return mockData[endpoint] ? mockData[endpoint]() : { ok: false, error: 'Endpoint not found' };
    },

    // ===== CART FUNCTIONS =====
    getCartTotals() {
        const subtotal = this.state.cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const itemCount = this.state.cart.reduce((sum, item) => sum + item.quantity, 0);
        return { subtotal, itemCount, itemCountDistinct: this.state.cart.length, currency: 'USD' };
    },

    async addToCart(productId, name, quantity, unitPrice) {
        if (!productId || !quantity || !unitPrice) {
            this.showToast('error', 'ERROR', 'Complete all product fields');
            return;
        }

        try {
            const data = await this.apiCall('/cart/items', {
                method: 'POST',
                body: JSON.stringify({
                    productId: parseInt(productId),
                    name: name || `Product ${productId}`,
                    sku: `SKU-${productId}`,
                    quantity: parseInt(quantity),
                    unitPrice: parseFloat(unitPrice)
                })
            });

            if (data.ok) {
                this.state.cart = data.cart.items || [];
                this.updateCartDisplay();
                this.clearCartForm();
                this.showToast('success', 'ITEM ADDED', 'Product added to cart');
            }
        } catch (error) {
            this.showToast('error', 'ERROR', 'Could not add product to cart');
        }
    },

    // ===== DASHBOARD FUNCTIONS =====
    async loadSales() {
        try {
            const data = await this.apiCall('/sales');
            const tbody = document.getElementById('salesTableBody');
            const noSalesMsg = document.getElementById('noSalesMessage');
            
            if (data.ok && data.sales && data.sales.length > 0) {
                tbody.innerHTML = data.sales.slice(0, 10).map(sale => `
                    <tr class="hover:bg-red-900/10 transition-colors">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-bold font-mafia text-white">#${sale.id}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${sale.client_name}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${sale.product_name}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${sale.quantity}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-400">$${parseFloat(sale.total_amount).toFixed(2)}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">${new Date(sale.sale_date).toLocaleDateString()}</td>
                    </tr>
                `).join('');
                tbody.classList.remove('hidden');
                noSalesMsg.classList.add('hidden');
                
                this.updateStats(data.sales);
            } else {
                tbody.innerHTML = '';
                tbody.classList.add('hidden');
                noSalesMsg.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error loading sales:', error);
            this.showToast('error', 'ERROR', 'Could not load sales data');
        }
    },

    updateStats(sales) {
        const totalSales = sales.length;
        const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0);
        const uniqueClients = new Set(sales.map(s => s.client_name)).size;
        const uniqueProducts = new Set(sales.map(s => s.product_name)).size;
        
        document.getElementById('totalSales').textContent = totalSales;
        document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
        document.getElementById('totalClients').textContent = uniqueClients;
        document.getElementById('totalProducts').textContent = uniqueProducts;
    },

    async loadBIReports() {
        await Promise.all([
            this.loadTopSuppliers(),
            this.loadStarProducts()
        ]);
    },

    async loadTopSuppliers() {
        try {
            const data = await this.apiCall('/reports/suppliers');
            const container = document.getElementById('topSuppliers');
            
            if (data.ok && data.data && data.data.length > 0) {
                container.innerHTML = data.data.map((supplier, index) => `
                    <div class="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-gray-800">
                        <div class="flex items-center">
                            <span class="bg-yellow-900/50 text-yellow-500 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 font-mafia">${index + 1}</span>
                            <div>
                                <p class="font-bold text-sm font-mafia text-white">${supplier.supplier_name}</p>
                                <p class="text-xs text-gray-400">${supplier.total_items_sold} items sold</p>
                            </div>
                        </div>
                        <span class="font-bold text-sm text-green-400 font-mafia">$${supplier.total_revenue.toLocaleString()}</span>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p class="text-gray-500 text-sm font-mafia">No supplier data available</p>';
            }
        } catch (error) {
            console.error('Error loading suppliers:', error);
        }
    },

    async loadStarProducts() {
        try {
            const data = await this.apiCall('/reports/top-products');
            const container = document.getElementById('starProducts');
            
            if (data.ok && data.data && data.data.length > 0) {
                container.innerHTML = data.data.map((product, index) => `
                    <div class="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-gray-800">
                        <div class="flex items-center">
                            <span class="bg-red-900/50 text-red-500 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                <i class="fas fa-star"></i>
                            </span>
                            <div class="ml-3">
                                <p class="font-bold text-sm font-mafia text-white">${product.product_name}</p>
                                <p class="text-xs text-gray-400">${product.total_quantity_sold} sold</p>
                            </div>
                        </div>
                        <span class="font-bold text-sm text-green-400 font-mafia">$${product.total_revenue.toLocaleString()}</span>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p class="text-gray-500 text-sm font-mafia">No product data available</p>';
            }
        } catch (error) {
            console.error('Error loading star products:', error);
        }
    },

    async loadClientHistory() {
        const email = document.getElementById('clientEmailInput').value;
        if (!email) {
            this.showToast('error', 'ERROR', 'Enter client email');
            return;
        }
        
        try {
            const data = await this.apiCall(`/reports/clients/${email}`);
            const container = document.getElementById('clientHistory');
            
            if (data.ok && data.purchases && data.purchases.length > 0) {
                container.innerHTML = data.purchases.map(purchase => `
                    <div class="p-3 bg-black/30 rounded-lg border border-gray-800">
                        <p class="font-bold text-sm font-mafia text-white">${purchase.productName}</p>
                        <p class="text-xs text-gray-400">${purchase.quantity} x $${purchase.unitPrice} = $${purchase.totalAmount}</p>
                        <p class="text-xs text-gray-500">${new Date(purchase.date).toLocaleDateString()}</p>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p class="text-gray-500 text-sm font-mafia">No history found</p>';
            }
        } catch (error) {
            console.error('Error loading client history:', error);
            this.showToast('error', 'ERROR', 'Could not load client history');
        }
    },

    async loadAuditLogs() {
        try {
            const data = await this.apiCall('/reports/audit-logs?limit=10');
            const container = document.getElementById('auditLogs');
            
            if (data.ok && data.data && data.data.length > 0) {
                container.innerHTML = data.data.map(log => `
                    <div class="p-3 bg-red-900/20 border-l-4 border-red-600 rounded">
                        <div class="flex justify-between items-start">
                            <div>
                                <p class="font-bold text-sm font-mafia text-white">${log.action} - ${log.entity}</p>
                                <p class="text-xs text-gray-400">ID: ${log.entityId}</p>
                            </div>
                            <span class="text-xs text-gray-500">${new Date(log.deletedAt).toLocaleString()}</span>
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p class="text-gray-500 text-sm font-mafia">No audit logs available</p>';
            }
        } catch (error) {
            console.error('Error loading audit logs:', error);
        }
    },

    async loadCart() {
        if (this.state.currentUser && this.state.currentUser.role !== 'admin') {
            try {
                const data = await this.apiCall('/cart');
                if (data.ok) {
                    this.state.cart = data.cart.items || [];
                    this.updateCartDisplay();
                }
            } catch (error) {
                console.error('Error loading cart:', error);
            }
        }
    },

    updateCartDisplay() {
        const cartItems = document.getElementById('cartItems');
        const subtotal = document.getElementById('cartSubtotal');
        const itemCount = document.getElementById('cartItemCount');
        
        if (this.state.cart.length === 0) {
            cartItems.innerHTML = '<p class="text-gray-500 text-center font-mafia">Cart is empty</p>';
            subtotal.textContent = '$0.00';
            itemCount.textContent = '0';
            return;
        }
        
        cartItems.innerHTML = this.state.cart.map(item => `
            <div class="flex justify-between items-center p-3 bg-black/30 rounded-lg mb-2 border border-gray-800">
                <div class="flex-1">
                    <p class="font-bold text-sm font-mafia text-white">${item.name}</p>
                    <p class="text-xs text-gray-400">${item.quantity} x $${item.unitPrice.toFixed(2)}</p>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="font-bold text-green-400">$${(item.quantity * item.unitPrice).toFixed(2)}</span>
                    <button onclick="MafiaApp.removeFromCart(${item.productId})" class="text-red-500 hover:text-red-400 transition-colors">
                        <i class="fas fa-trash text-sm"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        const total = this.state.cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const totalItems = this.state.cart.reduce((sum, item) => sum + item.quantity, 0);
        
        subtotal.textContent = `$${total.toFixed(2)}`;
        itemCount.textContent = totalItems;
    },

    async removeFromCart(productId) {
        try {
            const data = await this.apiCall(`/cart/items/${productId}`, {
                method: 'DELETE'
            });
            
            if (data.ok) {
                this.state.cart = data.cart.items || [];
                this.updateCartDisplay();
                this.showToast('success', 'ITEM REMOVED', 'Product removed from cart');
            }
        } catch (error) {
            this.showToast('error', 'ERROR', 'Could not remove item');
        }
    },

    async clearCart() {
        try {
            const data = await this.apiCall('/cart', {
                method: 'DELETE'
            });
            
            if (data.ok) {
                this.state.cart = [];
                this.updateCartDisplay();
                this.showToast('success', 'Cart cleared', 'All items removed');
            }
        } catch (error) {
            this.showToast('error', 'ERROR', 'Could not clear cart');
        }
    },

    async checkout() {
        if (this.state.cart.length === 0) {
            this.showToast('error', 'EMPTY CART', 'Add products before checkout');
            return;
        }
        
        try {
            const data = await this.apiCall('/cart/checkout', {
                method: 'POST',
                body: JSON.stringify({
                    clientId: this.state.currentUser.id
                })
            });
            
            if (data.ok) {
                this.state.cart = [];
                this.updateCartDisplay();
                this.loadSales(); // Refresh sales
                this.showToast('success', 'ORDER COMPLETE', `${data.sales.length} sales created - $${data.totalAmount.toFixed(2)}`);
            }
        } catch (error) {
            this.showToast('error', 'CHECKOUT FAILED', 'Could not complete order');
        }
    },

    async addProduct() {
        const name = document.getElementById('newProductName').value;
        const price = document.getElementById('newProductPrice').value;
        const category = document.getElementById('newProductCategory').value;
        
        if (!name || !price || !category) {
            this.showToast('error', 'ERROR', 'Complete all product fields');
            return;
        }
        
        try {
            await this.apiCall('/products', {
                method: 'POST',
                body: JSON.stringify({ name, price: parseFloat(price), category })
            });
            
            // Clear form
            document.getElementById('newProductName').value = '';
            document.getElementById('newProductPrice').value = '';
            document.getElementById('newProductCategory').value = '';
        } catch (error) {
            this.showToast('error', 'ERROR', 'Could not add product');
        }
    },

    async addSupplier() {
        const name = document.getElementById('newSupplierName').value;
        const email = document.getElementById('newSupplierEmail').value;
        const phone = document.getElementById('newSupplierPhone').value;
        
        if (!name || !email || !phone) {
            this.showToast('error', 'ERROR', 'Complete all supplier fields');
            return;
        }
        
        try {
            await this.apiCall('/suppliers', {
                method: 'POST',
                body: JSON.stringify({ name, email, phone })
            });
            
            // Clear form
            document.getElementById('newSupplierName').value = '';
            document.getElementById('newSupplierEmail').value = '';
            document.getElementById('newSupplierPhone').value = '';
        } catch (error) {
            this.showToast('error', 'ERROR', 'Could not add supplier');
        }
    },

    async migrateData(clearBefore = false) {
        const statusDiv = document.getElementById('migrationStatus');
        statusDiv.classList.remove('hidden');
        statusDiv.className = 'mt-4 p-3 rounded-lg bg-yellow-900/30 border border-yellow-800 text-yellow-400';
        statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Starting migration...';
        
        try {
            const data = await this.apiCall('/simulacro/migrate', {
                method: 'POST',
                body: JSON.stringify({ clearBefore })
            });
            
            if (data.ok) {
                statusDiv.className = 'mt-4 p-3 rounded-lg bg-green-900/30 border border-green-800 text-green-400';
                statusDiv.innerHTML = `
                    <i class="fas fa-check-circle mr-2"></i>
                    <strong class="font-mafia">Migration Complete!</strong><br>
                    <span class="text-sm">Clients: ${data.summary.clients} | Products: ${data.summary.products} | Sales: ${data.summary.sales}</span>
                `;
                
                // Refresh all dashboard data
                await this.loadDashboardData();
                this.showToast('success', 'MIGRATION COMPLETE', 'All data has been imported');
            } else {
                throw new Error(data.error || 'Migration failed');
            }
        } catch (error) {
            statusDiv.className = 'mt-4 p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-400';
            statusDiv.innerHTML = `<i class="fas fa-exclamation-triangle mr-2"></i><strong class="font-mafia">Error:</strong> ${error.message}`;
            this.showToast('error', 'MIGRATION FAILED', error.message);
        }
    },

    updateUserInfo() {
        if (this.state.currentUser) {
            document.getElementById('userInfo').textContent = `${this.state.currentUser.name} (${this.state.currentUser.role})`;
        }
    },

    toggleRoleBasedSections() {
        if (!this.state.currentUser) return;
        
        const cartSection = document.getElementById('cartSection');
        const adminSection = document.getElementById('adminSection');
        
        if (this.state.currentUser.role === 'admin') {
            cartSection.classList.add('hidden');
            adminSection.classList.remove('hidden');
        } else {
            cartSection.classList.remove('hidden');
            adminSection.classList.add('hidden');
        }
    },

    async loadUserInfo() {
        try {
            const data = await this.apiCall('/auth/me');
            if (data.ok) {
                this.state.currentUser = data.user;
                this.updateUserInfo();
                this.toggleRoleBasedSections();
            }
        } catch (error) {
            console.error('Error loading user info:', error);
        }
    },

    async loadDashboardData() {
        await Promise.all([
            this.loadSales(),
            this.loadBIReports(),
            this.loadCart(),
            this.loadAuditLogs()
        ]);
    },

    clearCartForm() {
        document.getElementById('cartProductId').value = '';
        document.getElementById('cartProductName').value = '';
        document.getElementById('cartQuantity').value = '';
        document.getElementById('cartPrice').value = '';
    },

    // ===== UI HELPERS =====
    showElement(id) {
        const element = document.getElementById(id);
        if (element) element.classList.remove('hidden');
    },

    hideElement(id) {
        const element = document.getElementById(id);
        if (element) element.classList.add('hidden');
    },

    setLoading(isLoading) {
        this.state.isLoading = isLoading;
        // Update loading states in UI
        document.querySelectorAll('[data-loading]').forEach(element => {
            if (isLoading) {
                element.classList.add('opacity-50', 'pointer-events-none');
            } else {
                element.classList.remove('opacity-50', 'pointer-events-none');
            }
        });
    },

    showToast(type, title, description = '') {
        const toast = document.getElementById('toast');
        const toastIcon = document.getElementById('toastIcon');
        const toastMessage = document.getElementById('toastMessage');
        const toastDescription = document.getElementById('toastDescription');

        const icons = {
            success: '<i class="fas fa-check-circle text-green-500 text-xl"></i>',
            error: '<i class="fas fa-exclamation-circle text-red-500 text-xl"></i>',
            info: '<i class="fas fa-info-circle text-blue-500 text-xl"></i>'
        };

        toastIcon.innerHTML = icons[type] || icons.info;
        toastMessage.textContent = title;
        toastDescription.textContent = description;

        toast.classList.remove('hidden');

        setTimeout(() => {
            toast.classList.add('hidden');
        }, this.config.ui.toastDuration);
    },

    // ===== FALLBACK =====
    fallbackToDemo() {
        this.state.accessToken = 'demo_token_' + Date.now();
        this.state.currentUser = { 
            id: 1, 
            name: 'Demo Boss', 
            email: 'boss@megastore.com', 
            role: 'admin' 
        };
        this.state.realBackendAvailable = false;
        
        localStorage.setItem('accessToken', this.state.accessToken);
        this.showDashboard();
        this.showToast('success', 'DEMO MODE', 'Backend not available - Running demo');
    },

    // ===== CLEANUP =====
    cleanup() {
        // Save state before leaving
        if (this.state.cart.length > 0) {
            sessionStorage.setItem('cartBackup', JSON.stringify(this.state.cart));
        }
    },

    // ===== SERVICE WORKER =====
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => console.log('SW registered:', registration))
                .catch(error => console.log('SW registration failed:', error));
        }
    },

    // ===== INITIALIZATION =====
    onDOMContentLoaded() {
        this.checkAuth();
    }
};

// ===== GLOBAL FUNCTIONS FOR HTML =====
window.MafiaApp = MafiaApp;

// Expose functions for HTML onclick handlers
window.login = () => {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    MafiaApp.login(email, password);
};

window.register = () => {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    MafiaApp.register(name, email, password);
};

window.logout = () => MafiaApp.logout();
window.toggleAuthForm = () => MafiaApp.toggleAuthForm();

// Cart functions
window.addToCart = () => {
    const productId = document.getElementById('cartProductId').value;
    const name = document.getElementById('cartProductName').value;
    const quantity = document.getElementById('cartQuantity').value;
    const unitPrice = document.getElementById('cartPrice').value;
    MafiaApp.addToCart(productId, name, quantity, unitPrice);
};

// Initialize the app
MafiaApp.init();
