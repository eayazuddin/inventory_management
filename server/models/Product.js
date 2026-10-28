import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0, validate: Number.isInteger },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
  createdAt: { type: Date, default: Date.now },
});

const ProductModel = mongoose.model("Product", productSchema);
export default ProductModel;
