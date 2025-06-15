/**
 * Main App component that displays the product catalog and handles navigation 
 * between the product query page and product details page
 * 
 * This component manages two view modes: 
 * - **"query"** for the product query page.
 * - **"detail"** for the product detail page.
 * 
 * It also handles updating the page title on mount and manages the selected product 
 * via `selectedProductId` state.
 * 
 * @component
 */
import React, { useState, useEffect } from "react";
import ProductFilterPage from "./ProductQuery";
import ProductDetail from "./ProductDetail";
import "./App.css";

export default function App() {
    const [viewMode, setViewMode] = useState("query");
    const [selectedProductId, setSelectedProductId] = useState(null);

    useEffect(() => {
        document.title = "Product Catalog";
    }, []);

    return (
        <div className="container">
            <div className={`page ${viewMode === "query" ? "active-left" : "slide-left"}`}>
                <ProductFilterPage
                    onSelectProduct={(id) => {
                        setSelectedProductId(id);
                        setViewMode("detail");
                    }}
                />
            </div>

            <div className={`page ${viewMode === "detail" ? "active-right" : "slide-right"}`}>
                <ProductDetail
                    productId={selectedProductId}
                    onBack={() => {
                        setSelectedProductId(null);
                        setViewMode("query");
                    }}
                    onSelectRecommendation={(newId) => {
                        setSelectedProductId(newId);
                    }}
                />
            </div>
        </div>
    );
}
