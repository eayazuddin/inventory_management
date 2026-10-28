import mongoose, { Types } from "mongoose";

const categorySchema = new mongoose.Schema({

   categoryName : {type: String},
   categoryDescription : {type: String, required : true},
})


const CategoryModel = mongoose.model("Category", categorySchema);
export default CategoryModel;