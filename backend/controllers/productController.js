const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Transaction = require("../models/transactionModel");
const { createNotification } = require("./notificationController");

// ============ CREATE PRODUCT ============
const createProduct = async (req, res) => {
    try {
        const {
            name,
            slug,
            description,
            price,
            costPrice,
            category,
            quantity,
            minQuantity,
            sku,
            supplier,
            location,
            unit,
            status
        } = req.body;

        // ✅ Check if category exists and belongs to workshop
        const categoryExists = await Category.findOne({ 
            _id: category, 
            workshopId: req.user.workshopId 
        });
        if (!categoryExists) {
            return res.status(400).json({
                success: false,
                message: "Category not found in your workshop"
            });
        }

        // ✅ Check if SKU already exists in workshop
        const existingProduct = await Product.findOne({ 
            sku, 
            workshopId: req.user.workshopId 
        });
        if (existingProduct) {
            return res.status(400).json({
                success: false,
                message: "Product with this SKU already exists in your workshop"
            });
        }

        // ✅ Create product with workshopId
        const product = await Product.create({
            name,
            slug,
            description,
            price,
            costPrice,
            category,
            quantity: quantity || 0,
            minQuantity: minQuantity || 5,
            sku,
            supplier,
            location,
            unit,
            status,
            workshopId: req.user.workshopId  // ✅ ADD THIS
        });

        // ✅ Create notification for new product
        await createNotification(
            req.user.id,
            "📦 New Product Added",
            `${name} (${sku}) added to inventory - PKR ${price}`,
            "general",
            "/products"
        );

        // ✅ Check initial stock
        if (product.quantity <= product.minQuantity) {
            await createNotification(
                req.user.id,
                "⚠️ Low Stock Alert",
                `${product.name} has low initial stock (${product.quantity} units, Min: ${product.minQuantity})`,
                "low-stock",
                "/products"
            );
        }

        // If quantity > 0, create initial transaction
        if (quantity > 0) {
            await Transaction.create({
                product: product._id,
                type: "purchase-in",
                quantity: quantity,
                previousQuantity: 0,
                newQuantity: quantity,
                reference: "Initial Stock",
                notes: "Initial product creation",
                performedBy: req.user.id,
                unitPrice: costPrice || price,
                totalPrice: (costPrice || price) * quantity,
                workshopId: req.user.workshopId  // ✅ ADD THIS
            });
        }

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            product: product
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ GET ALL PRODUCTS ============
const getAllProducts = async (req, res) => {
    try {
        const { search } = req.query;
        
        let query = { workshopId: req.user.workshopId };  // ✅ ADD WORKSHOP FILTER
        
        // console.log(req.user.workshopId)

        if (search && search.trim() !== '') {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        const products = await Product.find(query).populate("category", "name slug");
        
        return res.status(200).json({
            success: true,
            total: products.length,
            products: products,
            search: search || ''
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ GET PRODUCT BY ID ============
const getProductById = async (req, res) => {
    try {
        const product = await Product.findOne({ 
            _id: req.params.id, 
            workshopId: req.user.workshopId 
        }).populate("category", "name slug");
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            product: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ UPDATE PRODUCT ============
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findOne({ 
            _id: req.params.id, 
            workshopId: req.user.workshopId 
        });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product: updatedProduct
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ DELETE PRODUCT ============
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findOne({ 
            _id: req.params.id, 
            workshopId: req.user.workshopId 
        });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        await product.deleteOne();
        res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ UPDATE STOCK ============
const updateStock = async (req, res) => {
    try {
        const { quantity, type, notes, reference, unitPrice } = req.body;
        const product = await Product.findOne({ 
            _id: req.params.id, 
            workshopId: req.user.workshopId 
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (!quantity || quantity === 0) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be greater than 0"
            });
        }

        const previousQuantity = product.quantity;
        let newQuantity = product.quantity;

        switch(type) {
            case "purchase-in":
            case "return-in":
                if (quantity < 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Quantity must be positive for this transaction type"
                    });
                }
                newQuantity = product.quantity + quantity;
                break;

            case "service-out":
            case "sale-out":
            case "wastage":
                if (quantity < 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Quantity must be positive for this transaction type"
                    });
                }
                if (product.quantity < quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient stock! Available: ${product.quantity}, Required: ${quantity}`
                    });
                }
                newQuantity = product.quantity - quantity;
                break;

            case "adjustment":
                if (quantity < 0 && Math.abs(quantity) > product.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient stock! Available: ${product.quantity}, Required: ${Math.abs(quantity)}`
                    });
                }
                newQuantity = product.quantity + quantity;
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: "Invalid transaction type"
                });
        }

        product.quantity = newQuantity;
        await product.save();

        // ✅ Check low stock
        if (newQuantity <= product.minQuantity) {
            await createNotification(
                req.user.id,
                "⚠️ Low Stock Alert",
                `${product.name} is running low (${newQuantity} units left, Min: ${product.minQuantity})`,
                "low-stock",
                "/products"
            );
        }

        await Transaction.create({
            product: product._id,
            type: type,
            quantity: Math.abs(quantity),
            previousQuantity: previousQuantity,
            newQuantity: newQuantity,
            reference: reference || `STOCK-${Date.now()}`,
            notes: notes || `${type} transaction`,
            performedBy: req.user.id,
            unitPrice: unitPrice || product.price,
            totalPrice: (unitPrice || product.price) * Math.abs(quantity),
            workshopId: req.user.workshopId  // ✅ ADD THIS
        });

        res.status(200).json({
            success: true,
            message: "Stock updated successfully",
            product: product
        });

    } catch (error) {
        console.error("Update Stock Error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ GET LOW STOCK PRODUCTS ============
const getLowStockProducts = async (req, res) => {
    try {
        const products = await Product.find({
            workshopId: req.user.workshopId,  // ✅ ADD THIS
            $expr: {
                $lte: ["$quantity", "$minQuantity"]
            }
        }).populate("category", "name");
        
        res.status(200).json({
            success: true,
            count: products.length,
            products: products
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    updateStock,
    getLowStockProducts
};