from django.db import models

class Category(models.Model):
    """
    Represents a product category.

    Each category can have many products associated with it.

    Fields:
        - name: Name of the category
    """
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

class Tag(models.Model):
    """
    Represents a tag that can be associated with products.

    Each tag can be linked to multiple products.

    Fields:
        - name: Name of the tag
    """
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

class Product(models.Model):
    """
    Represents a product in the catalog.

    Each Product can have multiple tags, but only belong to one category.

    Fields:
        - name: Name of the product
        - description: A textual description
        - category: Foreign key to Category (many-to-one)
        - tags: Many-to-many relationship with Tag
    """
    name = models.CharField(max_length=255)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    tags = models.ManyToManyField(Tag, related_name='products')

    def __str__(self):
        return self.name

class ProductSimilarity(models.Model):
    """
    Represents a similarity score between two distinct products.

    Constraints:
        - Symmetric: similarity(a, b) == similarity(b, a)
        - Unique: only one entry per product pair (a, b) where a.id < b.id

    Fields:
        - product_a: First product (smaller ID)
        - product_b: Second product (larger ID)
        - score: A float indicating similarity strength
    """
    product_a = models.ForeignKey(Product, related_name='similarities_from', on_delete=models.CASCADE)
    product_b = models.ForeignKey(Product, related_name='similarities_to', on_delete=models.CASCADE)
    score = models.FloatField()

    def save(self, *args, **kwargs):
        """
        Ensures product_a always has the smaller ID to enforce ordering.
        """
        if self.product_a.id > self.product_b.id:
            self.product_a, self.product_b = self.product_b, self.product_a
        super().save(*args, **kwargs)

    class Meta:
        unique_together = ('product_a', 'product_b')

    def __str__(self):
        return f"Similarity({self.product_a} <-> {self.product_b}): {self.score}"
