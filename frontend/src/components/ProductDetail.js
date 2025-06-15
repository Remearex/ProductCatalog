/**
 * Component that displays the product details page. This component also displays
 * 3 recommended products for the current product being viewed, and clicking on
 * any of the recommendations will take you to the corresponding product's details page,
 * and update product similarities.
 * 
 * @component
 */
import React, { useState, useEffect } from "react";

export default function ProductDetail({ productId, onBack, onSelectRecommendation }) {
    const [product, setProduct] = useState(null);
    const [recommendations, setRecommendations] = useState([]);

    // fetches a product's details along with its recommendations
    async function fetchDetails() {
        const res = await fetch(`/products/${productId}/?raw=0`);
        const data = await res.json();
        setProduct(data.product);
        setRecommendations(data.recommendations);
    }

    // fetch product details on mount, unless productId is null
    useEffect(() => {
        if (productId) {
            fetchDetails();
        } else {
            setProduct(null);
        }
    }, [productId]);

    // Updates similarity scores, then loads the product details for the
    // recommended product that was just clicked on.
    const handleRecommendationClick = async (clickedId) => {
        const otherIds = recommendations
            .filter((rec) => rec.id !== clickedId)
            .map((rec) => rec.id);

        await fetch("/similarity/update/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                current_product_id: productId,
                clicked_product_id: clickedId,
                other_product_ids: otherIds,
            }),
        });

        onSelectRecommendation(clickedId);
    };

    return (
        <div style={{ padding: 20 }}>
            <button onClick={onBack}>← Back</button>
            {product ? (
                <>
                    <h2>{product.name}</h2>
                    <p>{product.description}</p>
                    <p><strong>Category:</strong> {product.category.name}</p>
                    <p><strong>Tags:</strong> {product.tags.map((t) => t.name).join(", ")}</p>

                    <h3>Recommended Products</h3>
                    <ul>
                        {recommendations.map((rec) => (
                            <li key={rec.id}>
                                <button onClick={() => handleRecommendationClick(rec.id)}>
                                    {rec.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
}
