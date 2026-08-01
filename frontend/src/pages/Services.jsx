import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaPlus, FaEye, FaPrint, FaSearch, FaCheck, FaTimes } from 'react-icons/fa';
import Modal from '../components/Common/Modal';

const Services = () => {
    const [services, setServices] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        vehicleNumber: '',
        vehicleModel: '',
        vehicleMake: '',
        mileage: '',
        services: [{ serviceName: '', servicePrice: '', laborHours: '1', laborRate: '500' }],
        partsUsed: [{ product: '', productName: '', quantity: '1', unitPrice: '', fromInventory: true }],
        additionalCharges: [{ description: '', amount: '' }],
        billing: {
            taxRate: '0',
            discount: '0',
            discountType: 'fixed',
            paidAmount: '0'
        },
        notes: '',
        status: 'pending',
        assignedTo: '',
    });

    useEffect(() => {
        fetchServices();
        fetchProducts();
    }, []);


    // ============ PAY REMAINING BALANCE ============
    const handlePayRemaining = async (id) => {
        // Find the service
        const service = services.find(s => s._id === id);
        if (!service) return;

        const balance = service.billing?.balance || 0;

        // Show prompt for payment amount
        const amount = prompt(
            `Remaining balance: PKR ${balance.toLocaleString()}\n\nEnter amount to pay:`,
            balance
        );

        if (amount === null) return; // User cancelled

        const payAmount = parseFloat(amount);

        if (payAmount <= 0) {
            toast.error('Amount must be greater than 0');
            return;
        }

        if (payAmount > balance) {
            toast.error(`Amount cannot exceed balance of PKR ${balance.toLocaleString()}`);
            return;
        }

        try {
            const response = await axios.post(
                `https://amb-auto-wheel-pos.onrender.com/api/services/${id}/pay-remaining`,
                {
                    paidAmount: payAmount,
                    paymentMethod: "cash" // You can add a dropdown for this
                }
            );

            toast.success(`✅ Payment of PKR ${payAmount.toLocaleString()} received!`);
            fetchServices(); // Refresh the list
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to process payment');
        }
    };

    const fetchServices = async () => {
        try {
            const response = await axios.get('https://amb-auto-wheel-pos.onrender.com/api/services');
            setServices(response.data.services || []);
            // console.log("set service is: ", response.data.services);
        } catch (error) {
            toast.error('Failed to fetch services');
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await axios.get('https://amb-auto-wheel-pos.onrender.com/api/products');
            setProducts(response.data.products || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const handleChange = (e) => {


        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleServiceChange = (index, field, value) => {
        const updatedServices = [...formData.services];
        updatedServices[index][field] = value;
        setFormData({ ...formData, services: updatedServices });
    };

    const addService = () => {
        setFormData({
            ...formData,
            services: [...formData.services, { serviceName: '', servicePrice: '', laborHours: '1', laborRate: '500' }]
        });
    };

    const removeService = (index) => {
        if (formData.services.length > 1) {
            const updatedServices = formData.services.filter((_, i) => i !== index);
            setFormData({ ...formData, services: updatedServices });
        }
    };

    const handlePartChange = (index, field, value) => {
        const updatedParts = [...formData.partsUsed];
        updatedParts[index][field] = value;

        // If product is selected from dropdown, auto-fill productName and unitPrice
        if (field === 'product' && value) {
            const product = products.find(p => p._id === value);
            if (product) {
                updatedParts[index].productName = product.name;
                updatedParts[index].unitPrice = product.price;
            }
        }

        // If fromInventory is changed to false, clear the product selection
        if (field === 'fromInventory' && value === false) {
            updatedParts[index].product = '';
            // Keep the productName as is (user can type manually)
        }

        setFormData({ ...formData, partsUsed: updatedParts });
    };

    const addPart = () => {
        setFormData({
            ...formData,
            partsUsed: [...formData.partsUsed, { product: '', productName: '', quantity: '1', unitPrice: '', fromInventory: true }]
        });
    };

    const removePart = (index) => {
        if (formData.partsUsed.length > 0) {
            const updatedParts = formData.partsUsed.filter((_, i) => i !== index);
            setFormData({ ...formData, partsUsed: updatedParts });
        }
    };

    const handleChargeChange = (index, field, value) => {
        const updatedCharges = [...formData.additionalCharges];
        updatedCharges[index][field] = value;
        setFormData({ ...formData, additionalCharges: updatedCharges });
    };

    const addCharge = () => {
        setFormData({
            ...formData,
            additionalCharges: [...formData.additionalCharges, { description: '', amount: '' }]
        });
    };

    const removeCharge = (index) => {
        if (formData.additionalCharges.length > 0) {
            const updatedCharges = formData.additionalCharges.filter((_, i) => i !== index);
            setFormData({ ...formData, additionalCharges: updatedCharges });
        }
    };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate assignedTo
    if (!formData.assignedTo || formData.assignedTo.trim() === '') {
        toast.error('Please enter staff name');
        return;
    }
    
    // ============ ✅ FIX: Process parts ============
    const processedParts = formData.partsUsed.map(part => {
        const quantity = parseFloat(part.quantity) || 0;
        const unitPrice = parseFloat(part.unitPrice) || 0;
        
        return {
            product: part.fromInventory && part.product ? part.product : null, // ✅ null instead of ""
            productName: part.productName || 'Custom Item',
            quantity: quantity,
            unitPrice: unitPrice,
            totalPrice: quantity * unitPrice,
            fromInventory: part.fromInventory
        };
    });
    
    const dataToSend = {
        ...formData,
        partsUsed: processedParts,
        billing: {
            ...formData.billing,
            paidAmount: parseFloat(formData.billing.paidAmount) || 0,
            taxRate: parseFloat(formData.billing.taxRate) || 0,
            discount: parseFloat(formData.billing.discount) || 0
        }
    };
    
    try {
        const response = await axios.post('https://amb-auto-wheel-pos.onrender.com/api/services', dataToSend);
        toast.success('Service created successfully');
        fetchServices();
        setShowModal(false);
        resetForm();
    } catch (error) {
        console.error('Error:', error.response?.data);
        toast.error(error.response?.data?.message || 'Failed to create service');
    }
};

    const handleGenerateBill = async (id) => {
        try {
            // Show prompt to enter paid amount
            const paidAmountInput = prompt("Enter paid amount (PKR):", "0");

            if (paidAmountInput === null) {
                return; // User cancelled
            }

            const paidAmount = parseFloat(paidAmountInput) || 0;

            // console.log("paidAmount: ", paidAmount);
            const response = await axios.post(
                `https://amb-auto-wheel-pos.onrender.com/api/services/${id}/generate-bill`,
                {
                    paidAmount: paidAmount,
                    paymentMethod: "cash" // Can add dropdown later
                }
            );

            // console.log("Generate Bill Result:", response.data);
            toast.success('Bill generated successfully');
            fetchServices();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate bill');
        }
    };



    // ============ UPDATE SERVICE STATUS ============
    const updateStatus = async (id, newStatus) => {
        try {
            const response = await axios.put(`https://amb-auto-wheel-pos.onrender.com/api/services/${id}`, {
                status: newStatus
            });

            toast.success(`Status updated to ${newStatus}`);
            fetchServices(); // Refresh the list
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };


    const resetForm = () => {
        setFormData({
            customerName: '',
            customerPhone: '',
            customerAddress: '',
            vehicleNumber: '',
            vehicleModel: '',
            vehicleMake: '',
            mileage: '',
            services: [{ serviceName: '', servicePrice: '', laborHours: '1', laborRate: '500' }],
            partsUsed: [{ product: '', productName: '', quantity: '1', unitPrice: '', fromInventory: true }],
            additionalCharges: [{ description: '', amount: '' }],
            billing: {
                taxRate: '0',
                discount: '0',
                discountType: 'fixed',
                paidAmount: '0'
            },
            notes: '',
            status: 'pending',
            assignedTo: ''
        });
    };

    const viewDetails = (service) => {
        setSelectedService(service);
        setShowDetailsModal(true);
    };

    const filteredServices = services.filter(service =>
        service.customerName.toLowerCase().includes(search.toLowerCase()) ||
        service.vehicleNumber.toLowerCase().includes(search.toLowerCase())
    );


    // console.log("Filtered Services:", filteredServices[0]?.billing.balance);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Services</h2>
                    <p className="text-gray-500">Manage customer services</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="btn-primary"
                >
                    <FaPlus /> New Service
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
                <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by customer name or vehicle number..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input-field pl-10"
                />
            </div>

            {/* Services Table */}
            <div className="card">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="spinner"></div>
                    </div>
                ) : filteredServices.length > 0 ? (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Customer</th>
                                    <th>Vehicle</th>
                                    <th>Services</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Payment</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredServices.map((service) => (
                                    <tr key={service._id}>
                                        <td>
                                            <div className="font-medium">{service.customerName}</div>
                                            <div className="text-xs text-gray-500">{service.customerPhone}</div>
                                        </td>
                                        <td>
                                            <div>{service.vehicleNumber}</div>
                                            <div className="text-xs text-gray-500">{service.vehicleModel}</div>
                                        </td>
                                        <td>
                                            <div className="text-sm">{service.services?.length || 0} services</div>
                                            <div className="text-xs text-gray-500">{service.partsUsed?.length || 0} parts</div>
                                        </td>
                                        <td className="font-medium">PKR {service.billing?.totalAmount?.toLocaleString() || 0}</td>
                                        {/* <td>
                                            <span className={`badge ${service.status === 'completed' ? 'badge-success' :
                                                service.status === 'in-progress' ? 'badge-warning' :
                                                    service.status === 'pending' ? 'badge-info' :
                                                        'badge-danger'
                                                }`}>
                                                {service.status} 
                                            </span>
                                        </td> */}
                                        <td>
                                            {/* ============ STATUS DROPDOWN ============ */}
                                            <select
                                                value={service.status}
                                                onChange={(e) => updateStatus(service._id, e.target.value)}
                                                className={`text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 ${service.status === 'completed' ? 'bg-green-100 text-green-700 focus:ring-green-500 appearance-none ' :
                                                        service.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700 focus:ring-yellow-500' :
                                                            service.status === 'pending' ? 'bg-blue-100 text-blue-700 focus:ring-blue-500' :
                                                                'bg-gray-100 text-gray-700 focus:ring-gray-500'
                                                    }`}
                                                disabled={service.status === 'completed'}
                                            >
                                                <option value="pending">📋 Pending</option>
                                                <option value="in-progress">⏳ In Progress</option>
                                                <option value="completed">✅ Completed</option>
                                            </select>
                                        </td>
                                        <td>
                                            <span className={`badge ${service.billing?.paymentStatus === 'paid' ? 'badge-success' :
                                                service.billing?.paymentStatus === 'partial' ? 'badge-warning' :
                                                    'badge-danger'
                                                }`}>
                                                {service.billing?.paymentStatus || 'unpaid'}
                                            </span>



                                            {/* ✅ Show Balance if NOT completed AND has balance */}
                                            {service.status !== 'completed' && service.billing?.balance > 0 && (
                                                <div className="mt-1 text-xs text-red-600 font-medium">
                                                    Balance: PKR {service.billing.balance.toLocaleString()}
                                                </div>
                                            )}

                                            {/* ✅ Show if completed but has balance (shouldn't happen normally) */}
                                            {service.status === 'completed' && service.billing?.balance > 0 && (
                                                <div className="mt-1 text-xs text-orange-600 font-medium">
                                                    ⚠️ Balance: PKR {service.billing.balance.toLocaleString()}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {/* View Details */}
                                                <button
                                                    onClick={() => viewDetails(service)}
                                                    className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <FaEye />
                                                </button>

                                                {/* ============ BUTTON LOGIC ============ */}

                                                {/* 1. Service NOT completed → Show Generate Bill */}
                                                {service.status !== 'completed' && (
                                                    <button
                                                        onClick={() => handleGenerateBill(service._id)}
                                                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md transition-colors text-sm"
                                                    >
                                                        <FaCheck className="text-xs" />
                                                        Finish & Pay
                                                    </button>
                                                )}

                                                {/* 2. Service COMPLETED + Payment NOT paid → Show Pay Remaining */}
                                                {service.status === 'completed' && service.billing?.paymentStatus !== 'paid' && (
                                                    <button
                                                        onClick={() => handlePayRemaining(service._id)}
                                                        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-md transition-colors text-sm"
                                                    >
                                                        <span>💰</span>
                                                        Pay {service.billing?.balance > 0 ? `PKR ${service.billing.balance.toLocaleString()}` : 'Remaining'}
                                                    </button>
                                                )}

                                                {/* 3. Service COMPLETED + Payment PAID → Show Paid Badge */}
                                                {service.status === 'completed' && service.billing?.paymentStatus === 'paid' && (
                                                    <span className="text-xs px-3 py-1.5 rounded-md border font-medium text-green-600 bg-green-50 border-green-200">
                                                        ✅ Paid
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <p>No services found</p>
                    </div>
                )}
            </div>

            {/* Create Service Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    resetForm();
                }}
                title="New Service"
                size="lg"
                onConfirm={handleSubmit}
                confirmText="Create Service"
            >
                <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
                    {/* Customer Information */}
                    <div className="border-b border-gray-400 pb-4">
                        <h4 className="font-semibold text-gray-700 mb-3">Customer Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Customer Name</label>
                                <input
                                    type="text"
                                    placeholder='Enter Customer Name'
                                    name="customerName"
                                    value={formData.customerName}
                                    onChange={handleChange}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">Phone</label>
                                <input
                                    type="text"
                                    placeholder='Customer Phone No'

                                    name="customerPhone"
                                    value={formData.customerPhone}
                                    onChange={handleChange}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="label">Address</label>
                                <input
                                    type="text"
                                    name="customerAddress"
                                    placeholder='Customer Address'

                                    value={formData.customerAddress}
                                    onChange={handleChange}
                                    className="input-field"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Vehicle Information */}
                    <div className="border-b border-gray-400 pb-4">
                        <h4 className="font-semibold text-gray-700 mb-3">Vehicle Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Vehicle Number</label>
                                <input
                                    type="text"
                                    name="vehicleNumber"
                                    placeholder='e.g. LEA-1234'
                                    value={formData.vehicleNumber}
                                    onChange={handleChange}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">Vehicle Model</label>
                                <input
                                    type="text"
                                    name="vehicleModel"
                                    placeholder='e.g. Corolla Altis 2020'
                                    value={formData.vehicleModel}
                                    onChange={handleChange}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">Make</label>
                                <input
                                    type="text"
                                    name="vehicleMake"
                                    placeholder='e.g. Toyota'
                                    value={formData.vehicleMake}
                                    onChange={handleChange}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="label">Mileage</label>
                                <input
                                    type="number"
                                    name="mileage"
                                    placeholder='e.g. 85000'
                                    value={formData.mileage}
                                    onChange={handleChange}
                                    className="input-field"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Services */}
                    <div className="  pb-1">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-semibold text-gray-700">Services</h4>
                            <button type="button" onClick={addService} className="text-sm text-blue-600 hover:underline">
                                + Add Service
                            </button>
                        </div>
                        {formData.services.map((service, index) => (
                            <div key={index} className="grid grid-cols-4 gap-3 mb-2 items-end bg-gray-50 p-3 rounded-lg">
                                <div className="col-span-2">
                                    <label className="label text-xs">Service Name</label>
                                    <input
                                        type="text"

                                        value={service.serviceName}
                                        onChange={(e) => handleServiceChange(index, 'serviceName', e.target.value)}
                                        className="input-field text-sm"
                                        placeholder="e.g., Oil Change"
                                    />
                                </div>
                                <div>
                                    <label className="label text-xs">Price (PKR)</label>
                                    <input
                                        type="number"
                                        value={service.servicePrice}
                                        onChange={(e) => handleServiceChange(index, 'servicePrice', e.target.value)}
                                        className="input-field text-sm"
                                        placeholder="500"
                                    />
                                </div>
                                <div className="flex items-end gap-2">
                                    <div className="flex-1">
                                        <label className="label text-xs">Hours</label>
                                        <input
                                            type="number"
                                            value={service.laborHours}
                                            onChange={(e) => handleServiceChange(index, 'laborHours', e.target.value)}
                                            className="input-field text-sm"
                                            placeholder="1"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeService(index)}
                                        className="text-red-500 hover:text-red-700 mb-1"
                                        disabled={formData.services.length === 1}
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex-1 border-b pb-4 border-gray-400">
                        <label className="label text-xs">Assigned To  <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="assignedTo"
                            value={formData.assignedTo}
                            onChange={handleChange}
                            className="input-field text-sm"
                            placeholder="Enter Staff Name or ID"
                        />
                        <p className='text-sm w-max bg-blue-100 rounded-md p-1 text-gray-900 mt-2 '>Note: i will add fun that register proper staff then select option and you will add auto </p>
                    </div>

                    {/* Parts Used */}
                    <div className="border-b border-gray-400 pb-4">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-semibold text-gray-700">Parts Used</h4>
                            <button type="button" onClick={addPart} className="text-sm text-blue-600 hover:underline">
                                + Add Part
                            </button>
                        </div>
                        {formData.partsUsed.map((part, index) => (
                            <div key={index} className="grid grid-cols-5 gap-3 mb-2 items-end bg-gray-50 p-3 rounded-lg">

                                {/* Product Selection - Only show when fromInventory is true */}
                                {part.fromInventory ? (
                                    <div className="col-span-2">
                                        <label className="label text-xs">Product</label>
                                        <select
                                            value={part.product}
                                            onChange={(e) => handlePartChange(index, 'product', e.target.value)}
                                            className="input-field text-sm"
                                        >
                                            <option value="">Select Product</option>
                                            {products.map((p) => (
                                                <option key={p._id} value={p._id}>
                                                    {p.name} ({p.sku}) - PKR {p.price}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="col-span-2">
                                        <label className="label text-xs">Product Name (Manual)</label>
                                        <input
                                            type="text"
                                            value={part.productName}
                                            onChange={(e) => handlePartChange(index, 'productName', e.target.value)}
                                            className="input-field text-sm"
                                            placeholder="Enter custom product name"
                                        />
                                    </div>
                                )}

                                {/* Quantity */}
                                <div>
                                    <label className="label text-xs">Qty</label>
                                    <input
                                        type="number"
                                        value={part.quantity}
                                        onChange={(e) => handlePartChange(index, 'quantity', e.target.value)}
                                        className="input-field text-sm"
                                        placeholder="1"
                                        min="1"
                                    />
                                </div>

                                {/* Price */}
                                <div>
                                    <label className="label text-xs">Price (PKR)</label>
                                    <input
                                        type="number"
                                        value={part.unitPrice}
                                        onChange={(e) => handlePartChange(index, 'unitPrice', e.target.value)}
                                        className="input-field text-sm"
                                        placeholder="500"
                                        min="0"
                                    />
                                </div>

                                {/* From Inventory Toggle & Remove */}
                                <div className="flex items-end gap-2">
                                    <div className="flex-1">
                                        <label className="label text-xs">From Inv.</label>
                                        <select
                                            value={part.fromInventory}
                                            onChange={(e) => handlePartChange(index, 'fromInventory', e.target.value === 'true')}
                                            className="input-field text-sm"
                                        >
                                            <option value="true">Yes (From Stock)</option>
                                            <option value="false">No (Custom Item)</option>
                                        </select>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removePart(index)}
                                        className="text-red-500 hover:text-red-700 mb-1"
                                        disabled={formData.partsUsed.length === 0}
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Additional Charges */}
                    <div className="border-b border-gray-400 pb-4">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-semibold text-gray-700">Additional Charges</h4>
                            <button type="button" onClick={addCharge} className="text-sm text-blue-600 hover:underline">
                                + Add Charge
                            </button>
                        </div>
                        {formData.additionalCharges.map((charge, index) => (
                            <div key={index} className="grid grid-cols-3 gap-3 mb-2 items-end bg-gray-50 p-3 rounded-lg">
                                <div className="col-span-2">
                                    <label className="label text-xs">Description</label>
                                    <input
                                        type="text"
                                        value={charge.description}
                                        onChange={(e) => handleChargeChange(index, 'description', e.target.value)}
                                        className="input-field text-sm"
                                        placeholder="e.g., Waste Disposal"
                                    />
                                </div>
                                <div className="flex items-end gap-2">
                                    <div className="flex-1">
                                        <label className="label text-xs">Amount</label>
                                        <input
                                            type="number"
                                            value={charge.amount}
                                            onChange={(e) => handleChargeChange(index, 'amount', e.target.value)}
                                            className="input-field text-sm"
                                            placeholder="100"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeCharge(index)}
                                        className="text-red-500 hover:text-red-700 mb-1"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Billing */}
                    <div className="border-b border-gray-400 pb-4">
                        <h4 className="font-semibold text-gray-700 mb-3">Billing</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Tax Rate (%)</label>
                                <input
                                    type="number"
                                    name="billing.taxRate"
                                    value={formData.billing.taxRate}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        billing: { ...formData.billing, taxRate: e.target.value }
                                    })}
                                    className="input-field"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="label">Discount</label>
                                <input
                                    type="number"
                                    name="billing.discount"
                                    value={formData.billing.discount}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        billing: { ...formData.billing, discount: e.target.value }
                                    })}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="label">Discount Type</label>
                                <select
                                    name="billing.discountType"
                                    value={formData.billing.discountType}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        billing: { ...formData.billing, discountType: e.target.value }
                                    })}
                                    className="input-field"
                                >
                                    <option value="fixed">Fixed</option>
                                    <option value="percentage">Percentage</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Paid Amount</label>
                                <input
                                    type="number"
                                    name="billing.paidAmount"
                                    value={formData.billing.paidAmount}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        billing: { ...formData.billing, paidAmount: e.target.value }
                                    })}
                                    className="input-field"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="label">Notes</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            className="input-field"
                            rows="2"
                            placeholder="Additional notes..."
                        />
                    </div>
                </form>
            </Modal>

            {/* View Details Modal */}
            <Modal
                isOpen={showDetailsModal}
                onClose={() => {
                    setShowDetailsModal(false);
                    setSelectedService(null);
                }}
                title="Service Details"
                size="lg"
                showFooter={false}
            >
                {selectedService && (
                    <div className="space-y-4">
                        {/* Customer & Vehicle */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h5 className="font-semibold text-gray-700 mb-2">Customer</h5>
                                <p><span className="text-gray-500">Name:</span> {selectedService.customerName}</p>
                                <p><span className="text-gray-500">Phone:</span> {selectedService.customerPhone}</p>
                                <p><span className="text-gray-500">Address:</span> {selectedService.customerAddress || 'N/A'}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h5 className="font-semibold text-gray-700 mb-2">Vehicle</h5>
                                <p><span className="text-gray-500">Number:</span> {selectedService.vehicleNumber}</p>
                                <p><span className="text-gray-500">Model:</span> {selectedService.vehicleModel}</p>
                                <p><span className="text-gray-500">Make:</span> {selectedService.vehicleMake || 'N/A'}</p>
                                <p><span className="text-gray-500">Mileage:</span> {selectedService.mileage || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Services */}
                        {selectedService.services && selectedService.services.length > 0 && (
                            <div>
                                <h5 className="font-semibold text-gray-700 mb-2">Services</h5>
                                <div className="table-container">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Service</th>
                                                <th>Hours</th>
                                                <th>Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedService.services.map((s, i) => (
                                                <tr key={i}>
                                                    <td>{s.serviceName}</td>
                                                    <td>{s.laborHours}</td>
                                                    <td>PKR {s.servicePrice}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Parts */}
                        {selectedService.partsUsed && selectedService.partsUsed.length > 0 && (
                            <div>
                                <h5 className="font-semibold text-gray-700 mb-2">Parts Used</h5>
                                <div className="table-container">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Part</th>
                                                <th>Qty</th>
                                                <th>Price</th>
                                                <th>Total</th>
                                                <th>From Inv.</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedService.partsUsed.map((p, i) => (
                                                <tr key={i}>
                                                    <td>{p.productName}</td>
                                                    <td>{p.quantity}</td>
                                                    <td>PKR {p.unitPrice}</td>
                                                    <td>PKR {p.totalPrice}</td>
                                                    <td>{p.fromInventory ? 'Yes' : 'No'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Billing Summary */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h5 className="font-semibold text-gray-700 mb-2">Billing Summary</h5>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Subtotal</p>
                                    <p className="font-semibold">PKR {selectedService.billing?.subtotal?.toLocaleString() || 0}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Tax</p>
                                    <p className="font-semibold">PKR {selectedService.billing?.tax?.toLocaleString() || 0}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Discount</p>
                                    <p className="font-semibold">PKR {selectedService.billing?.discount?.toLocaleString() || 0}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total</p>
                                    <p className="font-semibold text-lg text-blue-600">PKR {selectedService.billing?.totalAmount?.toLocaleString() || 0}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Paid</p>
                                    <p className="font-semibold text-green-600">PKR {selectedService.billing?.paidAmount?.toLocaleString() || 0}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Balance</p>
                                    <p className={`font-semibold ${selectedService.billing?.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        PKR {selectedService.billing?.balance?.toLocaleString() || 0}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="flex justify-between items-center">
                            <div>
                                <span className={`badge ${selectedService.status === 'completed' ? 'badge-success' :
                                    selectedService.status === 'in-progress' ? 'badge-warning' :
                                        'badge-info'
                                    }`}>
                                    Status: {selectedService.status}
                                </span>
                                <span className={`ml-2 badge ${selectedService.billing?.paymentStatus === 'paid' ? 'badge-success' :
                                    selectedService.billing?.paymentStatus === 'partial' ? 'badge-warning' :
                                        'badge-danger'
                                    }`}>
                                    Payment: {selectedService.billing?.paymentStatus}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500">
                                Created: {new Date(selectedService.createdAt).toLocaleString()}
                            </p>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Services;