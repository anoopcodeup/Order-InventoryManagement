import { useState } from 'react';

export default function Orders({ orders, products, customers, onCreateOrder, onDeleteOrder }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);

  const [customerId, setCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState([{ product_id: '', quantity: 1 }]);
  const [errors, setErrors] = useState({});

  const resetForm = () => {
    setCustomerId('');
    setOrderItems([{ product_id: '', quantity: 1 }]);
    setErrors({});
  };

  const filteredOrders = orders.filter((o) => {
    const custName = o.customer_name || '';
    const custEmail = o.customer_email || '';
    return (
      custName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      custEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleAddItemRow = () => {
    setOrderItems([...orderItems, { product_id: '', quantity: 1 }]);
  };

  const handleRemoveItemRow = (index) => {
    const items = [...orderItems];
    items.splice(index, 1);
    setOrderItems(items);
  };

  const handleItemChange = (index, field, value) => {
    const items = [...orderItems];
    if (field === 'product_id') {
      items[index].product_id = value;
    } else if (field === 'quantity') {
      items[index].quantity = parseInt(value, 10) || 0;
    }
    setOrderItems(items);
  };

  const calculateEstimatedTotal = () => {
    return orderItems.reduce((sum, item) => {
      if (!item.product_id) return sum;
      const product = products.find((p) => p.id === parseInt(item.product_id, 10));
      return sum + (product ? Number(product.price) * item.quantity : 0);
    }, 0);
  };

  const validate = () => {
    const tempErrors = {};
    if (!customerId) {
      tempErrors.customerId = 'Please select a customer';
    }

    if (orderItems.length === 0) {
      tempErrors.items = 'Please add at least one product';
    } else {
      const itemErrors = [];
      const chosenProductIds = new Set();

      orderItems.forEach((item, index) => {
        if (!item.product_id) {
          itemErrors[index] = 'Select a product';
        } else if (chosenProductIds.has(item.product_id)) {
          itemErrors[index] = 'Duplicate product';
        } else {
          chosenProductIds.add(item.product_id);
          const product = products.find((p) => p.id === parseInt(item.product_id, 10));
          if (!product) {
            itemErrors[index] = 'Product not found';
          } else if (item.quantity <= 0) {
            itemErrors[index] = 'Quantity must be > 0';
          } else if (product.quantity_in_stock < item.quantity) {
            itemErrors[index] = `Insufficient stock (Available: ${product.quantity_in_stock})`;
          }
        }
      });

      if (itemErrors.some((e) => e)) {
        tempErrors.items = itemErrors;
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      customer_id: parseInt(customerId, 10),
      items: orderItems.map((item) => ({
        product_id: parseInt(item.product_id, 10),
        quantity: item.quantity,
      })),
    };

    const success = await onCreateOrder(payload);
    if (success) {
      setIsAddModalOpen(false);
      resetForm();
    }
  };

  const handleViewDetails = (order) => {
    setCurrentOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleCancelClick = async (order) => {
    const confirmed = window.confirm(`Are you sure you want to cancel order #${order.id}? This will restore stock levels.`);
    if (confirmed) {
      await onDeleteOrder(order.id);
    }
  };

  return (
    <div className="orders-view">
      <header className="view-header">
        <h1>Order Management</h1>
        <p className="subtitle">Create new orders, cancel active sales, and inspect line subtotals</p>
      </header>

      <div className="actions-bar">
        <div className="search-wrapper">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="form-input"
            placeholder="Search by customer name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Create Order
        </button>
      </div>

      <div className="glass-card">
        {filteredOrders.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem', opacity: 0.5 }}>
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <p>{orders.length === 0 ? 'No orders recorded yet.' : 'No orders match your search.'}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Total Amount</th>
                  <th>Order Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 600 }}>#{order.id}</td>
                    <td>{order.customer_name || <em style={{ color: 'var(--text-muted)' }}>Deleted Customer</em>}</td>
                    <td>{order.customer_email || '—'}</td>
                    <td style={{ fontWeight: 600, color: 'var(--color-success)' }}>
                      ₹{Number(order.total_amount).toFixed(2)}
                    </td>
                    <td>{new Date(order.created_at).toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleViewDetails(order)}>
                          View Details
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleCancelClick(order)}>
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-container modal-lg">
            <div className="modal-header">
              <h3>Create New Order</h3>
              <button className="modal-close" onClick={() => setIsAddModalOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2.5"></line>
                  <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2.5"></line>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Customer</label>
                  <select
                    className="form-input"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} ({c.email})
                      </option>
                    ))}
                  </select>
                  {errors.customerId && <div className="form-error-msg">{errors.customerId}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Order Items</span>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddItemRow}>
                      Add Item Row
                    </button>
                  </label>

                  <div className="order-items-builder">
                    {orderItems.map((item, index) => {
                      const itemError = errors.items ? errors.items[index] : null;
                      return (
                        <div key={index} style={{ marginBottom: '1rem' }}>
                          <div className="order-item-row">
                            <select
                              className="form-input"
                              value={item.product_id}
                              onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                            >
                              <option value="">-- Select Product --</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id} disabled={p.quantity_in_stock <= 0}>
                                  {p.name} (SKU: {p.sku}) - ₹{Number(p.price).toFixed(2)} [Stock: {p.quantity_in_stock}]
                                </option>
                              ))}
                            </select>

                            <input
                              type="number"
                              min="1"
                              className="form-input"
                              placeholder="Qty"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            />

                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.6rem', color: 'var(--color-danger)' }}
                              onClick={() => handleRemoveItemRow(index)}
                              disabled={orderItems.length === 1}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          </div>
                          {itemError && <div className="form-error-msg">{itemError}</div>}
                        </div>
                      );
                    })}
                  </div>
                  {errors.items && typeof errors.items === 'string' && (
                    <div className="form-error-msg">{errors.items}</div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>Estimated Order Total:</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-success)' }}>
                    ₹{calculateEstimatedTotal().toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={calculateEstimatedTotal() === 0}>
                  Submit Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailModalOpen && currentOrder && (
        <div className="modal-backdrop">
          <div className="modal-container modal-lg">
            <div className="modal-header">
              <h3>Order details: #{currentOrder.id}</h3>
              <button className="modal-close" onClick={() => setIsDetailModalOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2.5"></line>
                  <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2.5"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                <div>
                  <h4 style={{ color: '#ffffff', marginBottom: '0.25rem' }}>Customer Contact</h4>
                  <p style={{ fontWeight: 600 }}>{currentOrder.customer_name || 'Deleted Customer'}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{currentOrder.customer_email || '—'}</p>
                </div>
                <div>
                  <h4 style={{ color: '#ffffff', marginBottom: '0.25rem' }}>Order Details</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Placed: {new Date(currentOrder.created_at).toLocaleString()}
                  </p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '0.25rem' }}>
                    Total: ₹{Number(currentOrder.total_amount).toFixed(2)}
                  </p>
                </div>
              </div>

              <h4 style={{ color: '#ffffff', marginBottom: '0.75rem' }}>Ordered Line Items</h4>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>SKU / Code</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOrder.items?.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>{item.product_name || 'Deleted Product'}</td>
                        <td><code>{item.product_sku || '—'}</code></td>
                        <td>{item.quantity}</td>
                        <td>₹{Number(item.unit_price).toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          ₹{(Number(item.unit_price) * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsDetailModalOpen(false)}>
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
