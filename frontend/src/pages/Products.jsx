import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaEye } from 'react-icons/fa';
import Modal from '../components/Common/Modal';
import { useLocation } from 'react-router-dom';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    costPrice: '',
    category: '',
    quantity: '',
    minQuantity: '5',
    sku: '',
    supplier: '',
    location: 'shop-floor',
    unit: 'pcs',
    status: 'active'
  });


  const location = useLocation();
  // const [search, setSearch] = useState('');


 useEffect(() => {
    // Get search parameter from URL
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setSearch(searchParam);
    }
  }, [location.search]);



  useEffect(() => {

     

    fetchProducts();
    fetchCategories();
  }, []);



  // Auto-generate slug from name
 const generateSlug = (name) => {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/products');
      setProducts(response.data.products || []);
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {

        // console.log("yes buddy");
        
        // console.log(formData);
        let slug = generateSlug(formData.name);
        formData.slug = slug;
        // console.log(formData);
        
        
      if (editingProduct) {
        await axios.put(`http://localhost:5000/api/products/${editingProduct._id}`, formData);
        toast.success('Product updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/products', formData);
        toast.success('Product created successfully');
      }
      fetchProducts();
      setShowModal(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      costPrice: product.costPrice || '',
      category: product.category?._id || product.category,
      quantity: product.quantity,
      minQuantity: product.minQuantity,
      sku: product.sku,
      supplier: product.supplier || '',
      location: product.location,
      unit: product.unit,
      status: product.status
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      price: '',
      costPrice: '',
      category: '',
      quantity: '',
      minQuantity: '5',
      sku: '',
      supplier: '',
      location: 'shop-floor',
      unit: 'pcs',
      status: 'active'
    });
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.sku.toLowerCase().includes(search.toLowerCase())
  );


  // In Products.jsx
const handleSellProduct = async (product) => {
  const quantity = prompt(`Enter quantity to sell (Available: ${product.quantity}):`);
  if (!quantity) return;
  
  if (quantity > product.quantity) {
    toast.error('Insufficient stock!');
    return;
  }
  
  const price = prompt('Enter selling price per unit:');
  if (!price) return;
  
  try {
    await axios.put(`http://localhost:5000/api/products/${product._id}/stock`, {
      quantity: parseInt(quantity),
      type: 'sale-out',
      notes: `Sold to customer at PKR ${price}`,
      unitPrice: parseFloat(price)
    });
    toast.success('Product sold successfully!');
    fetchProducts();
  } catch (error) {
    toast.error('Failed to sell product');
  }
};

// In Products.jsx
const handleReturnStock = async (product) => {
  const quantity = prompt(`Enter quantity to return (Available: ${product.quantity}):`);
  if (!quantity) return;
  
  try {
    await axios.put(`http://localhost:5000/api/products/${product._id}/stock`, {
      quantity: parseInt(quantity),
      type: 'return-in',
      notes: 'Customer returned product'
    });
    toast.success('Stock returned successfully!');
    fetchProducts();
  } catch (error) {
    toast.error('Failed to return stock');
  }
};



const handleAdjustStock = async (product) => {
    const newQuantity = prompt(`Enter new quantity (Current: ${product.quantity}):`);
    if (!newQuantity) return;
    
    const newQty = parseInt(newQuantity);
    const difference = newQty - product.quantity;
    
    if (difference === 0) {
        toast.success('No change in quantity');
        return;
    }
    
    try {
        // ✅ Use only "adjustment" type with positive or negative quantity
        await axios.put(`http://localhost:5000/api/products/${product._id}/stock`, {
            quantity: difference,  // Can be positive or negative
            type: 'adjustment',    // ✅ Single type
            notes: `Manual adjustment from ${product.quantity} to ${newQty}`
        });
        toast.success('Stock adjusted successfully!');
        fetchProducts();
    } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to adjust stock');
    }
};



// In Products.jsx
const handleWastage = async (product) => {
  const quantity = prompt(`Enter quantity to mark as wastage (Available: ${product.quantity}):`);
  if (!quantity) return;
  
  if (quantity > product.quantity) {
    toast.error('Insufficient stock!');
    return;
  }
  
  const reason = prompt('Enter reason for wastage (e.g., expired, damaged):');
  if (!reason) return;
  
  try {
    await axios.put(`http://localhost:5000/api/products/${product._id}/stock`, {
      quantity: parseInt(quantity),
      type: 'wastage',
      notes: reason
    });
    toast.success('Wastage recorded successfully!');
    fetchProducts();
  } catch (error) {
    toast.error('Failed to record wastage');
  }
};



  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Products</h2>
          <p className="text-gray-500">Manage your inventory</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary"
        >
          <FaPlus /> Add Product
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
        <input
          type="text"
          placeholder="Search products by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Products Table */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="spinner"></div>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product._id}>
                    <td className="font-medium">{product.name}</td>
                    <td>{product.sku}</td>
                    <td>{product.category?.name || 'N/A'}</td>
                    <td>PKR {product.price}</td>
                    <td>
                      <span className={product.quantity <= product.minQuantity ? 'text-red-600 font-medium' : 'text-gray-700'}>
                        {product.quantity}
                      </span>
                      {product.quantity <= product.minQuantity && (
                        <span className="ml-2 badge badge-danger">Low</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${product.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {product.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FaTrash />
                        </button>



                        {/* NEW BUTTONS - Only show for Admin */}
  <button onClick={() => handleSellProduct(product)} className="text-purple-600">
    💰 Sell
  </button>
  <button onClick={() => handleReturnStock(product)} className="text-blue-600">
    🔄 Return
  </button>
  <button onClick={() => handleAdjustStock(product)} className="text-orange-600">
    📊 Adjust
  </button>
  <button onClick={() => handleWastage(product)} className="text-red-600">
    🗑️ Wastage
  </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No products found</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        onConfirm={handleSubmit}
        confirmText={editingProduct ? 'Update' : 'Create'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Product Name</label>
              <input
                type="text"
                name="name"
                placeholder='e.g. Engine Oil 5W-30'
                value={formData.name}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="label">SKU</label>
              <input
                type="text"
                name="sku"
                placeholder='e.g. EO-001'
                value={formData.sku}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              name="description"
              placeholder='e.g. Premium synthetic engine oil for petrol vehicles.'
              value={formData.description}
              onChange={handleChange}
              className="input-field"
              rows="2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Price (PKR)</label>
              <input
                type="number"
                name="price"
                placeholder='e.g. 2500'
                value={formData.price}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="label">Cost Price (PKR)</label>
              <input
                type="number"
                name="costPrice"
                placeholder='e.g. 3000'
                value={formData.costPrice}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Supplier</label>
              <input
                type="text"
                name="supplier"
                placeholder='e.g. Toyota Parts Supplier'
                value={formData.supplier}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Quantity</label>
              <input
                type="number"
                name="quantity"
                placeholder='e.g. 50'
                value={formData.quantity}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="label">Min Quantity</label>
              <input
                type="number"
                name="minQuantity"
                placeholder='e.g. 5'
                value={formData.minQuantity}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Location</label>
              <select
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="input-field"
              >
                <option value="warehouse">Warehouse</option>
                <option value="shop-floor">Shop Floor</option>
                <option value="storage">Storage</option>
              </select>
            </div>
            <div>
              <label className="label">Unit</label>
              <input
                type="text"
                name="unit"
                placeholder='e.g. pcs, bottle, set'
                value={formData.unit}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="label">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="input-field"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Products;