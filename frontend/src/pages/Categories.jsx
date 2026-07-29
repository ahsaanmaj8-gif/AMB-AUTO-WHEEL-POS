import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import Modal from '../components/Common/Modal';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('https://amb-auto-wheel-pos.onrender.com/api/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
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
      if (editingCategory) {
        await axios.put(`https://amb-auto-wheel-pos.onrender.com/api/categories/${editingCategory._id}`, formData);
        toast.success('Category updated successfully');
      } else {
        await axios.post('https://amb-auto-wheel-pos.onrender.com/api/categories', formData);
        toast.success('Category created successfully');
      }
      fetchCategories();
      setShowModal(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await axios.delete(`https://amb-auto-wheel-pos.onrender.com/api/categories/${id}`);
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      slug: category.slug
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      slug: ''
    });
  };

  // Auto-generate slug from name
  const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Categories</h2>
          <p className="text-gray-500">Manage product categories</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary"
        >
          <FaPlus /> Add Category
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 flex justify-center py-8">
            <div className="spinner"></div>
          </div>
        ) : categories.length > 0 ? (
          categories.map((category) => (
            <div key={category._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{category.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{category.slug}</p>
                  {category.description && (
                    <p className="text-sm text-gray-600 mt-2">{category.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Created: {new Date(category.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(category._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center py-8 text-gray-500">
            <p>No categories found</p>
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
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
        onConfirm={handleSubmit}
        confirmText={editingCategory ? 'Update' : 'Create'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Category Name</label>
            <input
              type="text"
              name="name"
              placeholder='e.g. Engine Oil'
              value={formData.name}
              onChange={(e) => {
                const name = e.target.value;
                setFormData({
                  ...formData,
                  name: name,
                  slug: generateSlug(name)
                });
              }}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="label">Slug</label>
            <input
              type="text"
              name="slug"
              placeholder='Auto-generated from category name'
              value={formData.slug}
              onChange={handleChange}
              className="input-field"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Auto-generated from name</p>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              name="description"
              placeholder='e.g. Premium engine oils for petrol and diesel vehicles.'
              value={formData.description}
              onChange={handleChange}
              className="input-field"
              rows="3"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Categories;