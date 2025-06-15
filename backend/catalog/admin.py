from django.contrib import admin
from .models import Product, Category, Tag, ProductSimilarity

admin.site.register(Product)
admin.site.register(Category)
admin.site.register(Tag)
admin.site.register(ProductSimilarity)