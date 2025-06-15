/**
 * A Product creation/update form
 * 
 * @component
 */
import React, { useState, useEffect } from "react";

export default function ProductForm({ mode, productId, onClose, onSave }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [tags, setTags] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [allTags, setAllTags] = useState([]);

    // Fetch all categories and tags in the database on mount to display them in the form
    useEffect(() => {
        async function loadOptions() {
            const [catRes, tagRes] = await Promise.all([
                fetch("/categories"),
                fetch("/tags"),
            ]);
            setAllCategories(await catRes.json());
            setAllTags(await tagRes.json());
        }
        loadOptions();
    }, []);

    // Fetches the product details, without its recommendations, if the mode is edit
    useEffect(() => {
        async function fetchProduct() {
            if (mode === "edit" && productId) {
                const res = await fetch(`/products/${productId}/?raw=1`);
                const data = await res.json();
                setName(data.name);
                setDescription(data.description);
                setCategory(data.category.id);
                setTags(data.tags.map((tag) => tag.id));
            }
        }
        fetchProduct();
    }, [mode, productId]);

    // Update the tags state whenever a tag is toggled
    const toggleTag = (tagId) => {
        setTags((prev) =>
            prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
        );
    };

    // Creates or updates the product on submit depending on the mode
    const handleSubmit = async () => {
        const payload = {
            name,
            description,
            category: parseInt(category),
            tags,
        };

        const url =
            mode === "edit" ? `/products/${productId}/update/` : "/products/create/";
        const method = mode === "edit" ? "PUT" : "POST";

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            onSave();
            onClose();
        } else {
            console.error("Save failed", await res.json());
        }
    };

    return (
        <div style={{ padding: 20, background: "#eee", width: 400 }}>
            <h3>{mode === "edit" ? "Edit Product" : "Create Product"}</h3>

            <label>
                Name:
                <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>

            <br />

            <label>
                Description:
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>

            <br />

            <label>
                Category:
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">-- Select --</option>
                    {allCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
            </label>

            <br />

            <label>Tags:</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {allTags.map((tag) => (
                    <label key={tag.id}>
                        <input
                            type="checkbox"
                            checked={tags.includes(tag.id)}
                            onChange={() => toggleTag(tag.id)}
                        />
                        {tag.name}
                    </label>
                ))}
            </div>

            <br />

            <button onClick={handleSubmit}>{mode === "edit" ? "Update" : "Create"}</button>
            <button onClick={onClose} style={{ marginLeft: 10 }}>
                Cancel
            </button>
        </div>
    );
}
