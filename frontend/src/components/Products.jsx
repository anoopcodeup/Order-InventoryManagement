import { useState } from 'react';

export default function Products({ products, onAddProduct, onUpdateProduct, onDeleteProduct }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('0');
  
  const [errors, setErrors] = useState({});

  const resetForm = () => {
    setName('');
    setSku('');
    setPrice('');
    setQuantity('0');
    setErrors({});
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validate = () => {
    const tempErrors = {};
    if (!name.trim()) tempErrors.name = 'Product name is required';
    if (!sku.trim()) tempErrors.sku = 'SKU / Code is required';
    
    if (price === '' || isNaN(Number(price))) {
      tempErrors.price = 'Price must be a valid number';
    } else if (Number(price) < 0) {
      tempErrors.price = 'Price cannot be negative';
    }

    if (quantity === '' || isNaN(Number(quantity))) {
      tempErrors.quantity = 'Quantity must be a valid integer';
    } else if (Number(quantity) < 0 || !Number.isInteger(Number(quantity))) {
      tempErrors.quantity = 'Quantity must be a non-negative integer';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const success = await onAddProduct({
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      price: Number(price),
      quantity_in_stock: parseInt(quantity, 10),
    });

    if (success) {
      setIsAddModalOpen(false);
      resetForm();
    }
  };

  const handleEditClick = (product) => {
    setCurrentProduct(product);
    setName(product.name);
    setSku(product.sku);
    setPrice(Number(product.price).toString());
    setQuantity(product.quantity_in_stock.toString());
    setErrors({});
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const success = await onUpdateProduct(currentProduct.id, {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      price: Number(price),
      quantity_in_stock: parseInt(quantity, 10),
    });

    if (success) {
      setIsEditModalOpen(false);
      resetForm();
      setCurrentProduct(null);
    }
  };

  const handleDeleteClick = async (product) => {
    const confirmed = window.confirm(`Are you sure you want to delete product "${product.name}"?`);
    if (confirmed) {
      await onDeleteProduct(product.id);
    }
  };

  return (
    <div className="products-view">
      <header className="view-header">
        <h1>Product Management</h1>
        <p className="subtitle">Maintain inventory products, codes, pricing, and stock counts</p>
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
            placeholder="Search by name or SKU..."
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
          Add Product
        </button>
      </div>

      <div className="glass-card">
        {filteredProducts.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem', opacity: 0.5 }}>
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
            <p>{products.length === 0 ? 'No products registered yet.' : 'No products match your search.'}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU / Code</th>
                  <th>Price</th>
                  <th>In Stock</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td style={{ fontWeight: 600 }}>{product.name}</td>
                    <td><code>{product.sku}</code></td>
                    <td>₹{Number(product.price).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${product.quantity_in_stock <= 5 ? 'badge-danger' : 'badge-success'}`}>
                        {product.quantity_in_stock} units
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleEditClick(product)}>
                          Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteClick(product)}>
                          Delete
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
          <div className="modal-container">
            <div className="modal-header">
              <h3>Add New Product</h3>
              <button className="modal-close" onClick={() => setIsAddModalOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2.5"></line>
                  <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2.5"></line>
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Wireless Mouse"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  {errors.name && <div className="form-error-msg">{errors.name}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">SKU / Code (Unique)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. MOU-WIRE-02"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                  />
                  {errors.sku && <div className="form-error-msg">{errors.sku}</div>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                    {errors.price && <div className="form-error-msg">{errors.price}</div>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Initial Stock</label>
                    <input
                      type="number"
                      step="1"
                      className="form-input"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                    {errors.quantity && <div className="form-error-msg">{errors.quantity}</div>}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Edit Product: {currentProduct?.name}</h3>
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2.5"></line>
                  <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2.5"></line>
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  {errors.name && <div className="form-error-msg">{errors.name}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">SKU / Code (Unique)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                  />
                  {errors.sku && <div className="form-error-msg">{errors.sku}</div>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                    {errors.price && <div className="form-error-msg">{errors.price}</div>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Stock Quantity</label>
                    <input
                      type="number"
                      step="1"
                      className="form-input"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                    {errors.quantity && <div className="form-error-msg">{errors.quantity}</div>}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
