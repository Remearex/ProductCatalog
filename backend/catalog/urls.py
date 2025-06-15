from django.urls import path
from .views import ProductListView, ProductDetailView, CreateProductView, UpdateProductView, DeleteProductView, UpdateSimilarityView, CategoryListView, TagListView

urlpatterns = [
    path('products/', ProductListView.as_view(), name='product-list'),
    path('products/create/', CreateProductView.as_view(), name='product-create'),
    path('products/<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
    path('products/<int:pk>/update/', UpdateProductView.as_view(), name='product-update'),
    path('products/<int:pk>/delete/', DeleteProductView.as_view(), name='product-delete'),

    path('similarity/update/', UpdateSimilarityView.as_view(), name='update-similarity'),

    path('categories', CategoryListView.as_view(), name='categories'),
    path('tags', TagListView.as_view(), name='tags'),
]