from django.core.management.base import BaseCommand
from catalog.models import Product, ProductSimilarity
from itertools import combinations

class Command(BaseCommand):
    help = 'Initializes ProductSimilarity for every unique pair of Products'

    def handle(self, *args, **kwargs):
        products = list(Product.objects.all())
        total_pairs = 0
        new_created = 0

        for prod1, prod2 in combinations(products, 2):
            product_a, product_b = (prod1, prod2) if prod1.id < prod2.id else (prod2, prod1)

            obj, created = ProductSimilarity.objects.get_or_create(
                product_a=product_a,
                product_b=product_b,
                score=0.5,
            )
            total_pairs += 1
            if created:
                new_created += 1

        self.stdout.write(self.style.SUCCESS(
            f'Processed {total_pairs} pairs. Created {new_created} new similarities.'
        ))
