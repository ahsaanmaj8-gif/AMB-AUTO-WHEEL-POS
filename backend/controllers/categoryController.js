const Category = require("../models/categoryModel");

// ============ CREATE CATEGORY ============
const createCategory = async (req, res) => {
    try {
        const { name, description, slug } = req.body;

        const existingCategory = await Category.findOne({ 
            name, 
            workshopId: req.user.workshopId 
        });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: "Category already exists in your workshop"
            });
        }

        const category = await Category.create({
            name,
            description,
            slug,
            workshopId: req.user.workshopId
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

// ============ GET ALL CATEGORIES ============
const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find({ 
            workshopId: req.user.workshopId 
        });
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

// ============ GET SINGLE CATEGORY ============
const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findOne({ 
            _id: req.params.id, 
            workshopId: req.user.workshopId 
        });
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

// ============ UPDATE CATEGORY ============
const updateCategory = async (req, res) => {
    try {
        const category = await Category.findOne({ 
            _id: req.params.id, 
            workshopId: req.user.workshopId 
        });
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        const { name, description, slug } = req.body;
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

// ============ DELETE CATEGORY ============
const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findOne({ 
            _id: req.params.id, 
            workshopId: req.user.workshopId 
        });
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