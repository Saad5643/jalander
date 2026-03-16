#!/usr/bin/env python3
import re
import json

# Category keywords mapping
CATEGORY_KEYWORDS = {
    'Pumps': ['pump', 'amplere', 'motor', 'submersible', 'centrifugal'],
    'Water Tanks': ['tank', 'gallon', 'liter', 'capacity', 'barrel', 'storage'],
    'Bathroom Accessories': ['mixer', 'bib', 'shower', 'bath', 'tap', 'faucet', 'heater', 'geyser'],
    'Sanitary Ware': ['pan', 'seat', 'closet', 'commode', 'toilet', 'basin', 'sink', 'urinal'],
    'Valves': ['valve', 'cock', 'gate', 'check', 'flow', 'foot valve', 'ball cock'],
    'Pipes': ['pipe', 'pvc', 'cpvc', 'hdpe', 'master', 'deluxe', 'popular', 'adamjee', 'super'],
    'Pipe Fittings': ['elbow', 'tee', 'socket', 'coupling', 'nipple', 'union', 'bend', 'fitting', 'connector'],
    'PPRC Fittings': ['ppr', 'pprc', 'hot water'],
    'UPVC Fittings': ['upvc', 'white', 'grey'],
    'Hardware & Tools': ['tool', 'wrench', 'cutter', 'plier', 'key', 'clump', 'band', 'clench', 'ring']
}

def categorize_product(product_name):
    """Categorize a product based on keywords in its name."""
    name_lower = product_name.lower()

    # Check each category's keywords
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in name_lower:
                return category

    # Default category
    return 'Pipes'

def extract_brand(product_name):
    """Extract brand name from product name."""
    parts = product_name.split()
    if len(parts) >= 2:
        # Common brand names
        brands = ['popular', 'adam', 'adamjee', 'deluxe', 'master', 'asia', 'faisal', 'afzal',
                  'dura', 'jps', 'ktc', 'killy', 'goal', 'sultan', 'hd', 'cp', 'pvc', 'brass',
                  'baril', 'barel', 'az', 'dwc', 'rbs', 'vip', 'builtec', 'yonex', 'steel']

        for part in parts:
            if part.lower() in brands:
                return part.title()

    # Extract first word as brand if no match
    return parts[0].title() if parts else 'Generic'

def read_products_from_file(filename):
    """Read products from text file."""
    products = []
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                # Format: "number productname"
                # Extract quantity and product name
                parts = line.split(None, 1)
                if len(parts) >= 2:
                    product_name = parts[1]
                    products.append(product_name)
                elif len(parts) == 1:
                    # Some lines might just have product name
                    products.append(parts[0])
    except Exception as e:
        print(f"Error reading file: {e}")

    return products

def generate_js_content(products):
    """Generate JavaScript content with all products."""
    # Start building the JavaScript file
    js_lines = ["if (!window.PRODUCTS) window.PRODUCTS = [];\nwindow.PRODUCTS = [\n"]

    for idx, product_name in enumerate(products, 1):
        category = categorize_product(product_name)
        brand = extract_brand(product_name)

        # Create product object
        product_obj = {
            "id": idx,
            "category": category,
            "brand": brand,
            "name": product_name.title(),
            "desc": product_name.lower(),
            "sizes": ["Standard"],
            "tags": [category],
            "emoji": "🔧",
            "img": "img-product"
        }

        # Convert to JSON string and format
        json_str = json.dumps(product_obj, ensure_ascii=False, indent=1)
        # Adjust indentation
        json_str = '\n'.join(' ' + line if line.strip() else line for line in json_str.split('\n'))

        js_lines.append(' ' + json_str)
        if idx < len(products):
            js_lines.append(',\n')
        else:
            js_lines.append('\n')

    js_lines.append("];\n\n")

    # Add categories
    categories = {
        "Pipes": 0,
        "Valves": 0,
        "Pipe Fittings": 0,
        "PPRC Fittings": 0,
        "UPVC Fittings": 0,
        "Water Tanks": 0,
        "Pumps": 0,
        "Bathroom Accessories": 0,
        "Sanitary Ware": 0,
        "Hardware & Tools": 0
    }

    for product_name in products:
        category = categorize_product(product_name)
        if category in categories:
            categories[category] += 1

    js_lines.append("var CATEGORIES = [\n")
    cat_list = list(categories.items())
    for idx, (cat_name, count) in enumerate(cat_list):
        js_lines.append(f'  {{ name: "{cat_name}", count: {count} }}')
        if idx < len(cat_list) - 1:
            js_lines.append(",\n")
        else:
            js_lines.append("\n")
    js_lines.append("];\n\n")

    # Add helper functions
    js_lines.append("""function getBrands() {
  return [...new Set(PRODUCTS.map(p => p.brand))].sort();
}

function getCatCount(catName) {
  return PRODUCTS.filter(p => p.category === catName).length;
}
""")

    return ''.join(js_lines)

# Main execution
if __name__ == '__main__':
    input_file = '/tmp/all_products.txt'
    output_file = 'js/products-data.js'

    print(f"Reading products from {input_file}...")
    products = read_products_from_file(input_file)
    print(f"Found {len(products)} products")

    print("Generating JavaScript content...")
    js_content = generate_js_content(products)

    print(f"Writing to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(js_content)

    print(f"Successfully created products-data.js with {len(products)} products")
