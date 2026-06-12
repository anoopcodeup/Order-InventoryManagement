import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Customers from './components/Customers';
import Orders from './components/Orders';
import Toast from './components/Toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((title, message, type = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, title, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const apiRequest = useCallback(async (path, options = {}) => {
    const url = `${API_BASE_URL}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      if (response.status === 204) {
        return { success: true, data: null };
      }

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail || `Server error: ${response.statusText}`);
      }

      return { success: true, data: body };
    } catch (err) {
      console.error(`API Error on ${path}:`, err);
      showToast('Action Failed', err.message, 'error');
      return { success: false, error: err.message };
    }
  }, [showToast]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [pRes, cRes, oRes] = await Promise.all([
      apiRequest('/products'),
      apiRequest('/customers'),
      apiRequest('/orders'),
    ]);

    if (pRes.success) setProducts(pRes.data);
    if (cRes.success) setCustomers(cRes.data);
    if (oRes.success) setOrders(oRes.data);
    setIsLoading(false);
  }, [apiRequest]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const handleAddProduct = async (productData) => {
    const res = await apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });

    if (res.success) {
      showToast('Product Created', `"${productData.name}" has been successfully added.`, 'success');
      fetchData();
      return true;
    }
    return false;
  };

  const handleUpdateProduct = async (productId, productData) => {
    const res = await apiRequest(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });

    if (res.success) {
      showToast('Product Updated', `Changes to product SKU ${productData.sku} saved successfully.`, 'success');
      fetchData();
      return true;
    }
    return false;
  };

  const handleDeleteProduct = async (productId) => {
    const res = await apiRequest(`/products/${productId}`, {
      method: 'DELETE',
    });

    if (res.success) {
      showToast('Product Deleted', 'The product was removed from inventory.', 'success');
      fetchData();
      return true;
    }
    return false;
  };

  const handleAddCustomer = async (customerData) => {
    const res = await apiRequest('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });

    if (res.success) {
      showToast('Customer Registered', `"${customerData.full_name}" registered successfully.`, 'success');
      fetchData();
      return true;
    }
    return false;
  };

  const handleDeleteCustomer = async (customerId) => {
    const res = await apiRequest(`/customers/${customerId}`, {
      method: 'DELETE',
    });

    if (res.success) {
      showToast('Customer Removed', 'The customer profile has been deleted.', 'success');
      fetchData();
      return true;
    }
    return false;
  };

  const handleCreateOrder = async (orderData) => {
    const res = await apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });

    if (res.success) {
      showToast('Order Placed', `Order #${res.data.id} has been successfully recorded.`, 'success');
      fetchData();
      return true;
    }
    return false;
  };

  const handleDeleteOrder = async (orderId) => {
    const res = await apiRequest(`/orders/${orderId}`, {
      method: 'DELETE',
    });

    if (res.success) {
      showToast('Order Cancelled', `Order #${orderId} was cancelled and stock restored.`, 'success');
      fetchData();
      return true;
    }
    return false;
  };

  const renderActiveView = () => {
    if (isLoading && products.length === 0) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
          <div className="status-dot" style={{ width: '16px', height: '16px', marginBottom: '1rem' }}></div>
          <span>Loading System Data...</span>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            products={products}
            customers={customers}
            orders={orders}
            onNavigate={setActiveTab}
          />
        );
      case 'products':
        return (
          <Products
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        );
      case 'customers':
        return (
          <Customers
            customers={customers}
            onAddCustomer={handleAddCustomer}
            onDeleteCustomer={handleDeleteCustomer}
          />
        );
      case 'orders':
        return (
          <Orders
            orders={orders}
            products={products}
            customers={customers}
            onCreateOrder={handleCreateOrder}
            onDeleteOrder={handleDeleteOrder}
          />
        );
      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div className="app-container">
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            title={toast.title}
            message={toast.message}
            type={toast.type}
            onClose={removeToast}
          />
        ))}
      </div>

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="main-content">
        {renderActiveView()}
      </main>
    </div>
  );
}
