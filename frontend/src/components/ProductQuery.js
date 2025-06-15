/**
 * The component for the product query page. This page contains the query
 * information at the top, along with CRUD options for the products.
 * 
 * A list of products that's currently being edited will be maintined by
 * the editProductIds state. This allows the user to query, and have multiple
 * edit forms open at the same time
 * 
 * @component
 */
import React, { useState, useEffect } from "react";
import ProductForm from './ProductForm';

export default function ProductFilterPage({ onSelectProduct }) {
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);

    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedTags, setSelectedTags] = useState([]);
    const [searchDesc, setSearchDesc] = useState("");

    const [products, setProducts] = useState([]);

    const [creating, setCreating] = useState(false);
    const [editProductIds, setEditProductIds] = useState(new Set());


    // Fetch categories and tags on mount
    useEffect(() => {
        async function fetchFilters() {
            try {
                const [catRes, tagRes] = await Promise.all([
                    fetch("/categories"),
                    fetch("/tags"),
                ]);

                const [catData, tagData] = await Promise.all([catRes.json(), tagRes.json()]);
                setCategories(catData);
                setTags(tagData);
            } catch (err) {
                console.error("Error loading categories or tags", err);
            }
        }
        fetchFilters();
    }, []);

    // Fetch products whenever filters change
    useEffect(() => {
        fetchProducts();
    }, [selectedCategory, selectedTags, searchDesc]);

    async function fetchProducts() {
        try {
            const params = new URLSearchParams();

            if (selectedCategory) params.append("category", selectedCategory);
            selectedTags.forEach((tagId) => params.append("tags", tagId));
            if (searchDesc.trim()) params.append("search", searchDesc.trim());

            const res = await fetch(`/products/?${params.toString()}`);
            const data = await res.json();
            setProducts(data);
        } catch (err) {
            console.error("Error fetching products", err);
        }
    }

    // Updates selected tags when any tag is toggled
    const toggleTag = (tagId) => {
        setSelectedTags((prevTags) =>
            prevTags.includes(tagId) ? prevTags.filter((id) => id !== tagId) : [...prevTags, tagId]
        );
    };

    // Handler for product deletion
    const deleteProduct = async (productId) => {
        try {
            const res = await fetch(`/products/${productId}/delete/`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });
        } catch (err) {
            console.error(`Error deleting product ${productId}`)
        }
    }

    return (
        <div style={{ maxWidth: 700, margin: "auto", padding: 20 }}>
            <h2>Filter Products</h2>

            <label>
                Category:
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{ marginLeft: 8 }}
                >
                    <option value="">-- All --</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                </select>
            </label>

            <div style={{ marginTop: 16 }}>
                <label>Tags:</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {tags.map((tag) => (
                        <label key={tag.id} style={{ userSelect: "none" }}>
                            <input
                                type="checkbox"
                                checked={selectedTags.includes(tag.id)}
                                onChange={() => toggleTag(tag.id)}
                            />
                            {" " + tag.name}
                        </label>
                    ))}
                </div>
            </div>

            <div style={{ marginTop: 16 }}>
                <label>
                    Description contains:
                    <input
                        type="text"
                        value={searchDesc}
                        onChange={(e) => setSearchDesc(e.target.value)}
                        placeholder="Enter keywords"
                        style={{ marginLeft: 8, width: "60%" }}
                    />
                </label>
            </div>

            <hr style={{ margin: "24px 0" }} />

            <h3>
                <span style={{ marginRight: '20px' }}>Products ({products.length})</span>
                <button
                    onClick={() => {
                        setCreating(true);
                    }}
                >
                    Create New Product
                </button>
            </h3>
            {creating && (
                <ProductForm
                    mode={"create"}
                    productId={null}
                    onClose={() => setCreating(false)}
                    onSave={() => {
                        setCreating(false);
                        fetchProducts();
                    }}
                />
            )}
            <ul>
                {products.map((prod) => (
                    <li key={prod.id}>
                        <div>
                            <strong>{prod.name}</strong>: {prod.description}
                        </div>
                        <div>
                            <button
                                onClick={() => {
                                    setEditProductIds(prev => new Set(prev).add(prod.id));
                                }}
                                style={{ marginLeft: 10 }}
                            >
                                Edit
                            </button>
                            <button
                                onClick={async () => {
                                    const isConfirmed = window.confirm(`Are you sure you want to delete the product: ${prod.name}?`);
                                    if (isConfirmed) {
                                        await deleteProduct(prod.id);
                                        fetchProducts();
                                    }
                                }}
                                style={{ marginLeft: 10 }}
                            >
                                Delete
                            </button>

                            <button
                                onClick={() => onSelectProduct(prod.id)}
                                style={{ marginLeft: 10 }}
                            >
                                Details
                            </button>

                            {editProductIds.has(prod.id) && (
                                <ProductForm
                                    mode={"edit"}
                                    productId={prod.id}
                                    onClose={() => {
                                        setEditProductIds(prev => {
                                            const updated = new Set(prev);
                                            updated.delete(prod.id);
                                            return updated;
                                        });
                                    }}
                                    onSave={() => {
                                        setEditProductIds(prev => {
                                            const updated = new Set(prev);
                                            updated.delete(prod.id);
                                            return updated;
                                        });
                                        fetchProducts();
                                    }}
                                />
                            )}
                        </div>

                    </li>
                ))}
            </ul>

        </div>
    );
}
