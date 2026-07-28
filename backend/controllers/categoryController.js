const Category = require("../models/categoryModel");


const createCategory = async (req, res) => {
    try {
        const { name, description, slug } = req.body;

        // Check if category exists
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: "Category already exists"
            });
        }

        // Create category
        const category = await Category.create({
            name,
            description,
            slug
        });

        res.status(201).json({
            success: true,
            message: "Category created successfully",
            category: category
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find({});
        res.status(200).json({
            success: true,
            total: categories.length,
            categories: categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }
        res.status(200).json({
            success: true,
            category: category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const updateCategory = async (req, res) => {
    try {
        const { name, description, slug } = req.body;
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        // Update fields
        category.name = name || category.name;
        category.description = description || category.description;
        category.slug = slug || category.slug;

        await category.save();

        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            category: category
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        await category.deleteOne();
        res.status(200).json({
            success: true,
            message: "Category deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
};