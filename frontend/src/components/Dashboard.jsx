
export default function Dashboard({ products, customers, orders, onNavigate }) {
  const totalProducts = products.length;
  const totalCustomers = customers.length;
  const totalOrders = orders.length;

  const lowStockThreshold = 5;
  const lowStockProducts = products.filter(p => p.quantity_in_stock <= lowStockThreshold);
  const totalLowStock = lowStockProducts.length;

  return (
    <div className="dashboard-view">
      <header className="view-header">
        <h1>Dashboard Overview</h1>
        <p className="subtitle">Real-time statistics and inventory status summary</p>
      </header>

      <div className="dashboard-grid">
        <div className="glass-card metric-card" onClick={() => onNavigate('products')} style={{ cursor: 'pointer' }}>
          <div className="metric-header">
            <span className="metric-title">Total Products</span>
            <div className="metric-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
          </div>
          <div className="metric-value">{totalProducts}</div>
          <span className="metric-indicator badge badge-info">View inventory</span>
        </div>

        <div className="glass-card metric-card" onClick={() => onNavigate('customers')} style={{ cursor: 'pointer' }}>
          <div className="metric-header">
            <span className="metric-title">Total Customers</span>
            <div className="metric-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
          <div className="metric-value">{totalCustomers}</div>
          <span className="metric-indicator badge badge-info">View clients</span>
        </div>

        <div className="glass-card metric-card" onClick={() => onNavigate('orders')} style={{ cursor: 'pointer' }}>
          <div className="metric-header">
            <span className="metric-title">Total Orders</span>
            <div className="metric-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
          </div>
          <div className="metric-value">{totalOrders}</div>
          <span className="metric-indicator badge badge-info">Track transactions</span>
        </div>

        <div className="glass-card metric-card" style={{ border: totalLowStock > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-light)' }}>
          <div className="metric-header">
            <span className="metric-title">Low Stock Alert</span>
            <div className="metric-icon-wrapper" style={{ background: totalLowStock > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={totalLowStock > 0 ? 'var(--color-danger)' : 'var(--color-warning)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
          </div>
          <div className="metric-value" style={{ color: totalLowStock > 0 ? 'var(--color-danger)' : '#ffffff' }}>{totalLowStock}</div>
          <span className={`metric-indicator badge ${totalLowStock > 0 ? 'badge-danger' : 'badge-success'}`}>
            {totalLowStock > 0 ? 'Needs attention' : 'Inventory healthy'}
          </span>
        </div>
      </div>

      <div className="glass-card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>Low Stock Products</span>
          {totalLowStock > 0 && <span className="badge badge-danger">{totalLowStock} Alerts</span>}
        </h2>
        <p className="subtitle" style={{ marginBottom: '1.25rem' }}>
          Products with quantity equal to or less than {lowStockThreshold} units
        </p>

        {lowStockProducts.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem', opacity: 0.5 }}>
              <circle cx="12" cy="12" r="10" />
              <path d="M8 11.5L10.5 14L16 8.5" />
            </svg>
            <p>All products are adequately stocked!</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU / Code</th>
                  <th>Price</th>
                  <th>Qty In Stock</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((product) => (
                  <tr key={product.id}>
                    <td style={{ fontWeight: 600 }}>{product.name}</td>
                    <td><code>{product.sku}</code></td>
                    <td>₹{Number(product.price).toFixed(2)}</td>
                    <td>
                      <span className="badge badge-danger" style={{ fontWeight: 700 }}>
                        {product.quantity_in_stock} remaining
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('products')}>
                        Restock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
