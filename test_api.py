import urllib.request
import json
import time

BASE_URL = "http://localhost:8000"

def make_request(path, method="GET", data=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    
    req_data = None
    if data is not None:
        req_data = json.dumps(data).encode("utf-8")
        
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as res:
            status_code = res.status
            res_body = res.read().decode("utf-8")
            if res_body:
                return status_code, json.loads(res_body)
            else:
                return status_code, {}
    except urllib.error.HTTPError as e:
        status_code = e.code
        err_body = e.read().decode("utf-8")
        try:
            return status_code, json.loads(err_body)
        except Exception:
            return status_code, {"detail": err_body}
    except Exception as e:
        print(f"Error connecting to server: {e}")
        return 0, {"detail": str(e)}

def run_tests():
    print("=== STARTING BACKEND INTEGRATION TESTS ===")
    
    # Wait for server to boot if needed
    for i in range(10):
        code, body = make_request("/products")
        if code != 0:
            print("Connected to FastAPI backend successfully.")
            break
        print("Waiting for API to be available...")
        time.sleep(2)
    else:
        print("Could not connect to backend. Make sure the Docker container is running.")
        return

    # Clear database state if necessary (we'll start from clean test items)
    print("\nPreparing clean products for testing...")
    code, products = make_request("/products")
    for p in products:
        make_request(f"/products/{p['id']}", method="DELETE")
        
    print("Preparing clean customers for testing...")
    code, customers = make_request("/customers")
    for c in customers:
        make_request(f"/customers/{c['id']}", method="DELETE")
        
    # ----------------------------------------------------
    # TEST 1: CREATE PRODUCT (Valid)
    # ----------------------------------------------------
    print("\nTEST 1: Creating Product 1 (Laptop)...")
    laptop_payload = {
        "name": "ThinkPad Laptop",
        "sku": "LAP-THINK-01",
        "price": 1200.00,
        "quantity_in_stock": 10
    }
    code, laptop = make_request("/products", method="POST", data=laptop_payload)
    assert code == 201, f"Expected 201, got {code}: {laptop}"
    assert laptop["name"] == "ThinkPad Laptop"
    assert float(laptop["price"]) == 1200.00
    assert laptop["quantity_in_stock"] == 10
    laptop_id = laptop["id"]
    print("[OK] Product 1 created successfully.")

    # ----------------------------------------------------
    # TEST 2: CREATE PRODUCT (Negative price validation)
    # ----------------------------------------------------
    print("\nTEST 2: Creating Product with negative price...")
    bad_product_payload = {
        "name": "Broken Item",
        "sku": "BAD-PRICE",
        "price": -10.50,
        "quantity_in_stock": 5
    }
    code, res = make_request("/products", method="POST", data=bad_product_payload)
    # Pydantic validates inputs and returns 422 Unprocessable Entity
    assert code == 422 or code == 400, f"Expected 422 or 400, got {code}: {res}"
    print("[OK] Negative price validation blocked successfully.")

    # ----------------------------------------------------
    # TEST 3: CREATE CUSTOMER (Valid)
    # ----------------------------------------------------
    print("\nTEST 3: Creating Customer 1 (John)...")
    customer_payload = {
        "full_name": "John Doe",
        "email": "john.doe@example.com",
        "phone_number": "+123456789"
    }
    code, john = make_request("/customers", method="POST", data=customer_payload)
    assert code == 201, f"Expected 201, got {code}: {john}"
    assert john["full_name"] == "John Doe"
    john_id = john["id"]
    print("[OK] Customer 1 created successfully.")

    # ----------------------------------------------------
    # TEST 4: CREATE CUSTOMER (Duplicate Email validation)
    # ----------------------------------------------------
    print("\nTEST 4: Creating customer with duplicate email...")
    dup_customer_payload = {
        "full_name": "Another John",
        "email": "john.doe@example.com",
        "phone_number": "+987654321"
    }
    code, res = make_request("/customers", method="POST", data=dup_customer_payload)
    assert code == 400, f"Expected 400, got {code}: {res}"
    print("[OK] Duplicate email validation blocked successfully.")

    # ----------------------------------------------------
    # TEST 5: CREATE PRODUCT 2 (Mouse)
    # ----------------------------------------------------
    print("\nTEST 5: Creating Product 2 (Mouse)...")
    mouse_payload = {
        "name": "Wireless Mouse",
        "sku": "MOU-WIRE-02",
        "price": 25.50,
        "quantity_in_stock": 5
    }
    code, mouse = make_request("/products", method="POST", data=mouse_payload)
    assert code == 201, f"Expected 201, got {code}: {mouse}"
    mouse_id = mouse["id"]
    print("[OK] Product 2 created successfully.")

    # ----------------------------------------------------
    # TEST 6: CREATE ORDER (Valid Stock & Auto total calculation)
    # ----------------------------------------------------
    print("\nTEST 6: Placing Order for 2 Laptops and 3 Mice...")
    order_payload = {
        "customer_id": john_id,
        "items": [
            {"product_id": laptop_id, "quantity": 2},
            {"product_id": mouse_id, "quantity": 3}
        ]
    }
    # Expected total = 2 * 1200.00 + 3 * 25.50 = 2400.00 + 76.50 = 2476.50
    code, order = make_request("/orders", method="POST", data=order_payload)
    assert code == 201, f"Expected 201, got {code}: {order}"
    assert float(order["total_amount"]) == 2476.50, f"Expected total 2476.50, got {order['total_amount']}"
    order_id = order["id"]
    print("[OK] Order created and total price calculated automatically.")

    # Check stock reduction
    code, laptop_after = make_request(f"/products/{laptop_id}")
    assert laptop_after["quantity_in_stock"] == 8, f"Expected Laptop stock = 8, got {laptop_after['quantity_in_stock']}"
    code, mouse_after = make_request(f"/products/{mouse_id}")
    assert mouse_after["quantity_in_stock"] == 2, f"Expected Mouse stock = 2, got {mouse_after['quantity_in_stock']}"
    print("[OK] Inventory stock successfully decremented.")

    # ----------------------------------------------------
    # TEST 7: CREATE ORDER (Insufficient Stock validation)
    # ----------------------------------------------------
    print("\nTEST 7: Placing Order with insufficient Laptop stock...")
    bad_order_payload = {
        "customer_id": john_id,
        "items": [
            {"product_id": laptop_id, "quantity": 9} # only 8 left
        ]
    }
    code, res = make_request("/orders", method="POST", data=bad_order_payload)
    assert code == 400, f"Expected 400, got {code}: {res}"
    print("[OK] Insufficient stock validation blocked order placement.")

    # ----------------------------------------------------
    # TEST 8: DELETE CUSTOMER / PRODUCT referenced in Order (RESTRICT constraint)
    # ----------------------------------------------------
    print("\nTEST 8: Attempting to delete Customer and Product active in Order...")
    code, res = make_request(f"/customers/{john_id}", method="DELETE")
    assert code == 400, f"Expected 400 restriction, got {code}: {res}"
    
    code, res = make_request(f"/products/{laptop_id}", method="DELETE")
    assert code == 400, f"Expected 400 restriction, got {code}: {res}"
    print("[OK] Customer and Product deletions blocked by RESTRICT logic.")

    # ----------------------------------------------------
    # TEST 9: DELETE ORDER & RESTORE STOCK (Option A)
    # ----------------------------------------------------
    print("\nTEST 9: Cancelling (Deleting) Order to restore stock...")
    code, res = make_request(f"/orders/{order_id}", method="DELETE")
    assert code == 204, f"Expected 204, got {code}: {res}"
    
    # Check if stock has been restored
    code, laptop_restored = make_request(f"/products/{laptop_id}")
    assert laptop_restored["quantity_in_stock"] == 10, f"Expected restored stock = 10, got {laptop_restored['quantity_in_stock']}"
    code, mouse_restored = make_request(f"/products/{mouse_id}")
    assert mouse_restored["quantity_in_stock"] == 5, f"Expected restored stock = 5, got {mouse_restored['quantity_in_stock']}"
    print("[OK] Order cancelled and stock levels restored successfully.")

    # ----------------------------------------------------
    # TEST 10: CLEAN DELETION OF PRODUCTS AND CUSTOMERS
    # ----------------------------------------------------
    print("\nTEST 10: Deleting customer and products now that order is cancelled...")
    code, res = make_request(f"/customers/{john_id}", method="DELETE")
    assert code == 204, f"Expected 204, got {code}"
    
    code, res = make_request(f"/products/{laptop_id}", method="DELETE")
    assert code == 204, f"Expected 204, got {code}"
    
    code, res = make_request(f"/products/{mouse_id}", method="DELETE")
    assert code == 204, f"Expected 204, got {code}"
    print("[OK] Cleanup of customer and products completed successfully.")

    print("\n=== ALL BACKEND INTEGRATION TESTS PASSED ===")

if __name__ == "__main__":
    run_tests()
