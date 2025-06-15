"""
Main view file for ProductCatalog
"""

from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Product, Category, Tag, ProductSimilarity
from .serializers import ProductReadSerializer, ProductWriteSerializer, CategorySerializer, TagSerializer
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

import re

class ProductListView(APIView):
    """
    Filters products based on category, tags, and searches by description.    
    """

    def get(self, request):
        """
        The view function for ProductListView.

        Query Parameters:
            - category (int): The ID of the category to filter by.
            - tags (list of int): A list of tag IDs to filter products by.
            - search (string): A keyword or string to search for in the product descriptions.

        Args:
            - request (Request): The request object containing the query parameters.

        Returns:
            Response: A list of products that match the given filters.
        """
        category_id = request.query_params.get('category')
        tag_ids = request.query_params.getlist('tags')
        search = request.query_params.get('search')

        queryset = Product.objects.all()

        if category_id:
            queryset = queryset.filter(category_id=category_id)

        if tag_ids:
            for tag_id in tag_ids:
                queryset = queryset.filter(tags__id=tag_id)

        if search:
            escaped_search = re.escape(search)
            pattern = r'(^|\s)' + escaped_search + r'(\s|$)'
            queryset = queryset.filter(description__iregex=pattern)

        serializer = ProductReadSerializer(queryset.distinct(), many=True)
        return Response(serializer.data)

class ProductDetailView(APIView):
    """
    Retrieves a product by its id, and the 3 most similar products based on product similarities.
    """

    def get(self, request, pk):
        """
        The view function for ProductDetailView.

        Query Parameters:
            - raw (int): Whether or not to return just the product, or also its 3 recommendations.

        Path Parameters:
            - /<int> (int): The primary key (ID) of the product to be retrieved.

        Args:
            - request (Request): The request object containing the query parameter.
            pk (int): The primary key (ID) of the product to be retrieved.

        Returns:
            Response: The product along with optionally its 3 recommendations.
        """
        product = get_object_or_404(Product, pk=pk)
        product_serializer = ProductReadSerializer(product)

        if request.query_params.get("raw") == "1":
            return Response(product_serializer.data)

        # Get all similarity objects that contain product, order by score, and take the top 3
        similarity_objs = ProductSimilarity.objects.filter(
            Q(product_a=product) | Q(product_b=product)
        ).order_by('-score')[:3]

        recommended_products = []
        for sim in similarity_objs:
            if sim.product_a == product:
                recommended_products.append(sim.product_b)
            else:
                recommended_products.append(sim.product_a)

        recommended_serializer = ProductReadSerializer(recommended_products, many=True)

        return Response({
            'product': product_serializer.data,
            'recommendations': recommended_serializer.data
        })

class UpdateSimilarityView(APIView):
    """
    Updates product similarities based on which recommended product the user clicked in a product detail page.
    It increases the similarity between the current product and the recommended product that was clicked, and
    decreases similarities between the current product and the 2 recommended produts that were not clicked.
    """

    def post(self, request):
        """
        The view function for UpdateSimilarityView.

        Payload:
        - current_product_id (int): The ID of the product being viewed in a product detail page.
        - clicked_product_id (int): The ID of the recommended product that was clicked by the user.
        - other_product_ids (list of int): A list of product IDs of the recommended products that were not clicked.

        Args:
            - request (Request): The request object containing the payload.

        Returns:
            Response: A response with status code 204 (No Content) if the update is successful.
        """
        cur_id = request.data.get('current_product_id')
        clicked_id = request.data.get('clicked_product_id')
        other_ids = request.data.get('other_product_ids', [])

        cur_product = Product.objects.get(pk=cur_id)
        clicked_product = Product.objects.get(pk=clicked_id)
        other_products = Product.objects.filter(pk__in=other_ids)

        # Increase similarity between current and clicked product
        sim_obj = self.get_similarity_object(cur_product, clicked_product)
        sim_obj.score = min(sim_obj.score + 0.1, 1.0)
        sim_obj.save()

        # Decrease similarity between current and each unclicked recommendation
        for other_product in other_products:
            sim_obj = self.get_similarity_object(cur_product, other_product)
            sim_obj.score = max(sim_obj.score - 0.05, 0.0)
            sim_obj.save()

        return Response(status=204)
    
    def get_similarity_object(self, prod1, prod2):
        """
        Retrieve the ProductSimilarity object between two products.

        Ensures that the product with the smaller id will be in the product_a field, and
        the product with the larger id will be in the product_b field of the ProductSimilarity object.

        Args:
            prod1 (Product): One product of the ProductSimilarity object.
            prod2 (Product): The other product of the ProductSimilarity object.

        Returns:
            ProductSimilarity: The ProductSimilarity object between the two products.
        """
        if prod1.id < prod2.id:
            product_a, product_b = prod1, prod2
        else:
            product_a, product_b = prod2, prod1

        sim_obj = get_object_or_404(ProductSimilarity,
            product_a=product_a,
            product_b=product_b,
        )
        return sim_obj
    
# Retrieval of all categories and tags --------------------------------

class CategoryListView(generics.ListAPIView):
    """
    View to list all categories.

    This view returns a list of all categories in the database.

    Returns:
        Response: A list of categories, serialized in the format defined by CategorySerializer.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class TagListView(generics.ListAPIView):
    """
    View to list all tags.

    This view returns a list of all tags in the database.

    Returns:
        Response: A list of tags, serialized in the format defined by TagSerializer.
    """
    queryset = Tag.objects.all()
    serializer_class = TagSerializer

# CRUD operations for Product -----------------------------------------

@method_decorator(csrf_exempt, name='dispatch')
class CreateProductView(APIView):
    """
    View to create a new product and automatically generate similarity scores with other products.

    This view accepts a POST request with the product data, creates a new product, and then creates a ProductSimilarity
    object between the newly-created product, and all other existing products in the database with score initialized to 0.5
    """

    def post(self, request):
        """
        The view function for CreateProductView

        Payload:
            - name: The name of the product.
            - description: A description of the product.
            - category: The category ID of the product.
            - tags: A list of tag IDs associated with the product.

        Args:
            - request (Request): The request object containing the payload.

        Returns:
            Response: A response containing the serialized data of the created product and a `201 Created` status
                      if successful. If the data is invalid, a `400 Bad Request` status with error details.
        """
        serializer = ProductWriteSerializer(data=request.data)
        if serializer.is_valid():
            new_product = serializer.save()
            for other_product in Product.objects.exclude(id=new_product.id):
                product_a, product_b = (new_product, other_product) if new_product.id < other_product.id else (other_product, new_product)
                ProductSimilarity.objects.create(
                    product_a=product_a,
                    product_b=product_b,
                    score=0.5,
                )
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class UpdateProductView(APIView):
    """
    View to update an existing product.

    This view accepts a PUT request to update the details of an existing product in the database. 
    The product to be updated is identified by its primary key from the first path parameter in the URL.
    """

    def put(self, request, pk):
        """
        The view function for UpdateProductView.

        Path parameters:
            - /<int> (int): The primary key (ID) of the product to be updated.

        Payload:
            - name: The name of the product.
            - description: A description of the product.
            - category: The category ID of the product.
            - tags: A list of tag IDs associated with the product.

        Args:
            request (Request): The request object containing the payload.
            pk (int): The primary key (ID) of the product to be updated.

        Returns:
            Response: A response containing the updated product data and a `200 OK` status if the update is successful.
                      If the data is invalid, a `400 Bad Request` status with validation errors.
        """
        product = get_object_or_404(Product, pk=pk)
        serializer = ProductWriteSerializer(product, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


class DeleteProductView(APIView):
    """
    View to delete an existing product.

    This view accepts a DELETE request to remove a product from the database. 
    The product to be deleted is identified by the `pk` (primary key) path parameter in the URL.
    """

    def delete(self, request, pk):
        """
        The view function for DeleteProductView

        Path Parameters:
            - /<int> (int): The primary key (ID) of the product to be deleted.

        Args:
            request (Request): The request object (not used in this case as no body is required).
            pk (int): The primary key (ID) of the product to be deleted.

        Returns:
            Response: A response with a `204 No Content` status if the product is successfully deleted.
                      If the product is not found, a `404 Not Found` status is automatically returned.
        """
        product = get_object_or_404(Product, pk=pk)
        product.delete()
        return Response(status=204)