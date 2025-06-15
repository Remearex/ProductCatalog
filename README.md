# ProductCatalog

Welcome to my product catalog! This application supports **CRUD** operations for products, querying products by **category**, **tags**, and **description**, and recommending products based on pairwise product similarity scores that get dynamically updated based on which products the user click.

## System Structure:

### Models:
- **Product**: Represents the product details.
- **Tag**: A label for tagging products.
- **Category**: A classification for products.
- **ProductSimilarity**: Represents the similarity between two products, using the fields `product_a` and `product_b` (both foreign keys to the `Product` model). The similarity is symmetric and distinct — for two products, the one with the smaller ID will be stored in `product_a` and the other in `product_b`.

### Relationships:
- **Product and Tag**: Many-to-many
- **Product and Category**: Many-to-one
- **Product and ProductSimilarity**: Many-to-many (two-to-many strictly speaking)

## Setup Instructions:

1. **Clone the repository**:
2. **Install Python and Node.js**:
3. **Start backend Django server**:

    Open a terminal and navigate to
    ```bash
    .../ProductCatalog/backend
    ```
    Then start the virtual environment. On Windows:
    ```bash
    .\venv\Scripts\activate
    ```
    or for macOS/Linux:
    ```bash
    source venv/bin/activate
    ```
    Then start the django server:
    ```bash
    python manage.py runserver
    ```
4. **Start the React development server to serve the frontend**:

    Open a terminal and navigate to
    ```bash
    .../ProductCatalog/frontend
    ```
    Then run
    ```bash
    npm start
    ```

## Features

### Product Querying:
- Query products using category, tags, and description
- Fitler are combinable — results are the intersection of all applied filters

### Product Management:
- Create, update, and delete products
- Thanks to React's state system, you can edit multiple products while filtering/searching

### Recommendation System:
- Click "Details" on any product to open the corresponding product detail page.
- The product detail page shows the current product's information and 3 recommended products by ranking all other products by their similarity to the current product, and taking the top 3.

#### Dynamic Similarity Updates:
- Clicking on a recommenation increases its similarity score with the current product
- The recommended products that didn't get clicked on have their similarity scores decreased with the current product
- Recommendations are re-ranked in real time

#

To view the source code, navigate to ProductCatalog/backend/catalog, and all the relevant models, views, serializers, and urls are located in that folder.