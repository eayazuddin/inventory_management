import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const Categories = () => {
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const latestCategoryRequest = useRef(0);

  const handleRead = async (query = searchQuery) => {
    const requestId = ++latestCategoryRequest.current;
    try {
      const trimmedQuery = query.trim();
      const endpoint = trimmedQuery
        ? "http://localhost:3000/api/category/search"
        : "http://localhost:3000/api/category";
      const response = await axios.get(endpoint, {
        ...(trimmedQuery && { params: { query: trimmedQuery } }),
        headers: {
          Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
        },
      });

      if (requestId === latestCategoryRequest.current) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      if (requestId === latestCategoryRequest.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      handleRead(searchQuery);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:3000/api/category/add",
        { categoryName, categoryDescription },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
          },
        },
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Unable to add category");
      }

      alert("Category added successfully");
      setCategoryName("");
      setCategoryDescription("");
      await handleRead(searchQuery);
    } catch (error) {
      console.error("Error adding category", error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : error instanceof Error
          ? error.message
          : "Unable to add category";
      alert(`Error adding category: ${message}`);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.patch(
        `http://localhost:3000/api/category/${editingCategoryId}`,
        { categoryName, categoryDescription },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
          },
        },
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Unable to update category");
      }

      alert("Category updated successfully");
      setCategoryName("");
      setCategoryDescription("");
      setEditingCategoryId(null);
      await handleRead(searchQuery);
    } catch (error) {
      console.error("Error updating category", error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : error instanceof Error
          ? error.message
          : "Unable to update category";
      alert(`Error updating category: ${message}`);
    }
  };

  const handleEdit = (category) => {
    setEditingCategoryId(category._id);
    setCategoryName(category.categoryName);
    setCategoryDescription(category.categoryDescription);
  };

  const handleCancelEdit = () => {
    setEditingCategoryId(null);
    setCategoryName("");
    setCategoryDescription("");
  };

  const handleDelete = async (category) => {
    if (!window.confirm(
      `Delete "${category.categoryName}"? Categories used by products cannot be deleted.`
    )) {
      return;
    }

    try {
      const response = await axios.delete(
        `http://localhost:3000/api/category/${category._id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
          },
        },
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Unable to delete category");
      }

      if (editingCategoryId === category._id) {
        handleCancelEdit();
      }

      await handleRead(searchQuery);
    } catch (error) {
      console.error("Error deleting category", error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : error instanceof Error
          ? error.message
          : "Unable to delete category";
      alert(`Error deleting category: ${message}`);
    }
  };

  if (loading) return <div>Loading ...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-8">Categories Management</h1>
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:w-1/3">
          <div className="bg-white shadow-md rounded-lg p-4">
            <h2 className="text-center text-xl font-bold mb-4">
              {editingCategoryId ? "Edit Category" : "Add Categories"}
            </h2>
            <form
              className="space-y-4"
              onSubmit={editingCategoryId ? handleUpdate : handleCreate}
            >
              <div>
                <input
                  type="text"
                  placeholder="Category Name"
                  className="border w-full p-2 rounded-md"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Category Description"
                  className="border w-full p-2 rounded-md"
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-md bg-green-500 text-white p-3 cursor-pointer hover:bg-green-400"
              >
                {editingCategoryId ? "Update Category" : "Add Category"}
              </button>
              {editingCategoryId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="w-full rounded-md bg-gray-500 text-white p-3 cursor-pointer hover:bg-gray-600"
                >
                  Cancel
                </button>
              )}
            </form>
          </div>
        </div>

        <div className="lg:w-2/3">
          <div className="bg-white shadow-md rounded-lg p-4">
            <input
              type="search"
              placeholder="Search categories..."
              aria-label="Search categories"
              className="border w-full p-2 rounded-md mb-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-200 p-2">S No</th>
                  <th className="border border-gray-200 p-2">Category Name</th>
                  <th className="border border-gray-200 p-2">Action</th>
                </tr>
              </thead>

              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td
                      className="border border-gray-200 p-4 text-center text-gray-500"
                      colSpan={3}
                    >
                      No categories found.
                    </td>
                  </tr>
                ) : (
                  categories.map((category, index) => (
                    <tr key={category._id}>
                      <td className="border border-gray-200 p-2">
                        {index + 1}
                      </td>

                      <td className="border border-gray-200 p-2">
                        {category.categoryName}
                      </td>

                      <td className="border border-gray-200 p-2">
                        <button
                          type="button"
                          className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 mr-2"
                          onClick={() => handleEdit(category)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600"
                          onClick={() => handleDelete(category)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;
