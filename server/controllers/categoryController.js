import Category from "../models/Category.js";
import Product from "../models/Product.js";

const addCategory = async(req,res) => {


 try {
    const {categoryName, categoryDescription} = req.body;
    
    const existingCategory = await Category.findOne({categoryName});

    if (existingCategory) {
        return res.status(400).json({success: false,message:"Category Already exixts"});
    }

   const  newCategory = new Category({
    categoryName,
    categoryDescription,
   });
   
  await newCategory.save();
  return res.status(201).json({success: true, message: "Ctegory added successful"})

 } catch (error) {
    console.error("Error adding category", error);
    return res.status(500).json({success: false , message: "server error"});
 }
}

const getCategories = async (req,res) => {
   try{
    const categories = await Category.find();
    return res.status(200).json({success: true, categories})
   } catch (error) {
    console.error("Error getting categories", error);
    return res.status(500).json({success: false, message: "server error"});
   }
}

const searchCategories = async (req, res) => {
  try {
    const { query } = req.query;
    if (typeof query !== "string" || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: "A non-empty search query is required",
      });
    }

    const search = query.trim();
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const categories = await Category.find({
      $or: [
        { categoryName: { $regex: escapedSearch, $options: "i" } },
        { categoryDescription: { $regex: escapedSearch, $options: "i" } },
      ],
    });
    return res.status(200).json({ success: true, categories });
  } catch (error) {
    console.error("Error searching categories", error);
    return res.status(500).json({ success: false, message: "server error" });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { categoryName, categoryDescription } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const existingCategory = await Category.findOne({
      categoryName,
      _id: { $ne: category._id },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    category.categoryName = categoryName;
    category.categoryDescription = categoryDescription;
    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
    });
  } catch (error) {
    console.error("Error updating category", error);
    return res.status(500).json({ success: false, message: "server error" });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const linkedProducts = await Product.countDocuments({
      categoryId: category._id,
    });
    if (linkedProducts > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete this category because ${linkedProducts} product${linkedProducts === 1 ? " is" : "s are"} using it. Reassign or delete those products first.`,
        linkedProducts,
      });
    }

    await category.deleteOne();
    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid category ID" });
    }
    console.error("Error deleting category", error);
    return res.status(500).json({ success: false, message: "server error" });
  }
};

export {
  addCategory,
  getCategories,
  searchCategories,
  updateCategory,
  deleteCategory,
};