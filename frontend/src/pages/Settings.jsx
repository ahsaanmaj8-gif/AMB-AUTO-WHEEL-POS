import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaSave, FaUpload, FaTrash } from 'react-icons/fa';

const Settings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        headerImage: '',
        footerImage: '',
        logo: '',
        companyName: '',
        companyPhone: '',
        companyEmail: '',
        companyAddress: '',
        signatureName: '',
        termsAndConditions: '',
        paymentDetails: {
            bankName: '',
            accountName: '',
            accountNumber: '',
            iban: ''
        }
    });

    // ✅ File states
    const [headerImageFile, setHeaderImageFile] = useState(null);
    const [footerImageFile, setFooterImageFile] = useState(null);
    const [logoFile, setLogoFile] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await axios.get('https://amb-auto-wheel-pos.onrender.com/api/settings');
            setSettings(response.data.settings || {});
        } catch (error) {
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePaymentChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            paymentDetails: {
                ...prev.paymentDetails,
                [name]: value
            }
        }));
    };

    // ✅ Handle file changes
    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (type === 'headerImage') setHeaderImageFile(file);
        else if (type === 'footerImage') setFooterImageFile(file);
        else if (type === 'logo') setLogoFile(file);
    };

    // ✅ Remove image
    const removeImage = (type) => {
        if (type === 'headerImage') {
            setHeaderImageFile(null);
            setSettings(prev => ({ ...prev, headerImage: '' }));
        } else if (type === 'footerImage') {
            setFooterImageFile(null);
            setSettings(prev => ({ ...prev, footerImage: '' }));
        } else if (type === 'logo') {
            setLogoFile(null);
            setSettings(prev => ({ ...prev, logo: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const formData = new FormData();
            
            // ✅ Append files
            if (headerImageFile) formData.append('headerImage', headerImageFile);
            if (footerImageFile) formData.append('footerImage', footerImageFile);
            if (logoFile) formData.append('logo', logoFile);
            
            // ✅ Append text fields
            formData.append('companyName', settings.companyName || '');
            formData.append('companyPhone', settings.companyPhone || '');
            formData.append('companyEmail', settings.companyEmail || '');
            formData.append('companyAddress', settings.companyAddress || '');
            formData.append('signatureName', settings.signatureName || '');
            formData.append('termsAndConditions', settings.termsAndConditions || '');
            
            if (settings.paymentDetails) {
                formData.append('paymentDetails[bankName]', settings.paymentDetails.bankName || '');
                formData.append('paymentDetails[accountName]', settings.paymentDetails.accountName || '');
                formData.append('paymentDetails[accountNumber]', settings.paymentDetails.accountNumber || '');
                formData.append('paymentDetails[iban]', settings.paymentDetails.iban || '');
            }

            const response = await axios.put('https://amb-auto-wheel-pos.onrender.com/api/settings', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success('Settings saved successfully!');
            setHeaderImageFile(null);
            setFooterImageFile(null);
            setLogoFile(null);
            fetchSettings();
        } catch (error) {
            console.error('Save error:', error);
            toast.error(error.response?.data?.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Invoice Settings</h2>
                <p className="text-gray-500">Customize your invoice appearance and details</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Images Section */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Images</h3>
                    
                    {/* Header Image */}
                    <div className="mb-4">
                        <label className="label">Header Image</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, 'headerImage')}
                                className="input-field"
                            />
                            {headerImageFile && (
                                <span className="text-sm text-green-600">{headerImageFile.name}</span>
                            )}
                            {settings.headerImage && !headerImageFile && (
                                <div className="flex items-center gap-2">
                                    <img src={settings.headerImage} alt="Header" className="h-10 object-contain" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage('headerImage')}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Image */}
                    <div className="mb-4">
                        <label className="label">Footer Image</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, 'footerImage')}
                                className="input-field"
                            />
                            {footerImageFile && (
                                <span className="text-sm text-green-600">{footerImageFile.name}</span>
                            )}
                            {settings.footerImage && !footerImageFile && (
                                <div className="flex items-center gap-2">
                                    <img src={settings.footerImage} alt="Footer" className="h-10 object-contain" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage('footerImage')}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Logo */}
                    <div>
                        <label className="label">Logo</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, 'logo')}
                                className="input-field"
                            />
                            {logoFile && (
                                <span className="text-sm text-green-600">{logoFile.name}</span>
                            )}
                            {settings.logo && !logoFile && (
                                <div className="flex items-center gap-2">
                                    <img src={settings.logo} alt="Logo" className="h-10 object-contain" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage('logo')}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Company Details */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Company Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Company Name</label>
                            <input
                                type="text"
                                name="companyName"
                                value={settings.companyName || ''}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="Enter Your Company Name"
                            />
                        </div>
                        <div>
                            <label className="label">Phone Number</label>
                            <input
                                type="text"
                                name="companyPhone"
                                value={settings.companyPhone || ''}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="Enter Your Phone Number"
                            />
                        </div>
                        <div>
                            <label className="label">Email Address</label>
                            <input
                                type="email"
                                name="companyEmail"
                                value={settings.companyEmail || ''}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="Enter Your Email Address"
                            />
                        </div>
                        <div>
                            <label className="label">Address</label>
                            <input
                                type="text"
                                name="companyAddress"
                                value={settings.companyAddress || ''}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="123 Main St, City, Country"
                            />
                        </div>
                        <div>
                            <label className="label">Signature Name</label>
                            <input
                                type="text"
                                name="signatureName"
                                value={settings.signatureName || ''}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="Enter Your Signature Name"
                            />
                        </div>
                    </div>
                </div>

                {/* Payment Details */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Bank Name</label>
                            <input
                                type="text"
                                name="bankName"
                                value={settings.paymentDetails?.bankName || ''}
                                onChange={handlePaymentChange}
                                className="input-field"
                                placeholder="Enter Your Bank Name"
                            />
                        </div>
                        <div>
                            <label className="label">Account Name</label>
                            <input
                                type="text"
                                name="accountName"
                                value={settings.paymentDetails?.accountName || ''}
                                onChange={handlePaymentChange}
                                className="input-field"
                                placeholder="Enter Your Account Name"
                            />
                        </div>
                        <div>
                            <label className="label">Account Number</label>
                            <input
                                type="text"
                                name="accountNumber"
                                value={settings.paymentDetails?.accountNumber || ''}
                                onChange={handlePaymentChange}
                                className="input-field"
                                placeholder="Enter Your Account Number"
                            />
                        </div>
                        <div>
                            <label className="label">IBAN / Swift Code</label>
                            <input
                                type="text"
                                name="iban"
                                value={settings.paymentDetails?.iban || ''}
                                onChange={handlePaymentChange}
                                className="input-field"
                                placeholder="Enter Your IBAN or Swift Code"
                            />
                        </div>
                    </div>
                </div>

                {/* Terms & Conditions */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Terms & Conditions</h3>
                    <div>
                        <label className="label">Terms and Conditions</label>
                        <textarea
                            name="termsAndConditions"
                            value={settings.termsAndConditions || ''}
                            onChange={handleChange}
                            className="input-field"
                            rows="6"
                            placeholder="Enter your terms and conditions..."
                        />
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn-primary"
                    >
                        <FaSave className="mr-2" />
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Settings;