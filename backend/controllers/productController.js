const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Transaction = require("../models/transactionModel");
const { createNotification } = require("./notificationController");

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


        // console.log("hn bhai create prod me hi: ",req.user);
        
        // Check if category exists
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            return res.status(400).json({
                success: false,
                message: "Category not found"
            });
        }

        // Check if SKU already exists
        const existingProduct = await Product.findOne({ sku });
        if (existingProduct) {
            return res.status(400).json({
                success: false,
                message: "Product with this SKU already exists"
            });
        }

        // Create product
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
            status
        });




        // ============ ✅ CREATE NOTIFICATION FOR NEW PRODUCT ============
await createNotification(
    req.user.id,
    "New Product Added",
    `${name} (${sku}) has been added to inventory - PKR ${price}`,
    "general",  // or "inventory"
    "/products"
);




        // ============ ADD THIS: CHECK INITIAL STOCK ============
if (product.quantity <= product.minQuantity) {
    const { createNotification } = require("./notificationController");
    await createNotification(
        req.user.id,
        "Low Stock Alert",
        `${product.name} has low initial stock (${product.quantity} units, Min: ${product.minQuantity})`,
        "low-stock",
        "/products"
    );
}


        console.log(req.user);
        

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
                // performedBy: req.user._id,
                performedBy: req.user.id,
                unitPrice: costPrice || price,
                totalPrice: (costPrice || price) * quantity
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


const getAllProducts = async (req, res) => {
    try {
        const { search } = req.query;  // ✅ Get search query from URL
        
        let query = {};
        
        // ✅ If search parameter exists, add to query
        if (search && search.trim() !== '') {
            query = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { sku: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ]
            };
        }
        
        const products = await Product.find(query).populate("category", "name slug");
        
        return res.status(200).json({
            success: true,
            total: products.length,
            products: products,
            search: search || ''  // ✅ Return search term for reference
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate("category", "name slug");
        
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

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
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

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
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

// @desc    Update product stock
// @route   PUT /api/products/:id/stock
// @access  Private/Admin
const updateStock = async (req, res) => {
    try {
        const { quantity, type, notes, reference, unitPrice } = req.body;
        const product = await Product.findById(req.params.id);

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
            // Increase Stock
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

            // Decrease Stock
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

            // Adjustment - Can be positive or negative
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




        // ============ ADD THIS: CHECK LOW STOCK ============
if (newQuantity <= product.minQuantity) {
    await createNotification(
        req.user.id,
        "Low Stock Alert",
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
            totalPrice: (unitPrice || product.price) * Math.abs(quantity)
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

// @desc    Get low stock products
// @route   GET /api/products/low-stock
// @access  Private
const getLowStockProducts = async (req, res) => {
    try {
        const products = await Product.find({
  $expr: {
    $lte: ["$quantity", "$minQuantity"]
  }
}).populate("category", "name");
        // console.log("Low stock products fetched:", products);
        
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