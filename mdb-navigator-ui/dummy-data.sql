-- Dummy PostgreSQL Database Schema and Data
-- This script creates sample tables with dummy data for testing

-- Drop tables if they exist (in reverse order due to foreign keys)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- Create Departments table
CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Employees table
CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    hire_date DATE NOT NULL,
    salary DECIMAL(10, 2),
    department_id INTEGER REFERENCES departments(department_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Categories table
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Customers table
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(200),
    city VARCHAR(50),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    country VARCHAR(50) DEFAULT 'USA',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Products table
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(category_id),
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Orders table
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(customer_id),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    shipping_address VARCHAR(200),
    shipping_city VARCHAR(50),
    shipping_state VARCHAR(50),
    shipping_zip VARCHAR(10)
);

-- Create Order Items table
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id),
    product_id INTEGER REFERENCES products(product_id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL
);

-- Insert dummy data for Departments
INSERT INTO departments (department_name, location) VALUES
('Engineering', 'Building A, Floor 3'),
('Sales', 'Building B, Floor 1'),
('Marketing', 'Building B, Floor 2'),
('Human Resources', 'Building A, Floor 1'),
('Customer Support', 'Building C, Floor 1');

-- Insert dummy data for Employees
INSERT INTO employees (first_name, last_name, email, phone, hire_date, salary, department_id) VALUES
('John', 'Doe', 'john.doe@company.com', '555-0101', '2020-01-15', 75000.00, 1),
('Jane', 'Smith', 'jane.smith@company.com', '555-0102', '2019-03-20', 82000.00, 1),
('Mike', 'Johnson', 'mike.johnson@company.com', '555-0103', '2021-06-10', 65000.00, 2),
('Emily', 'Brown', 'emily.brown@company.com', '555-0104', '2020-08-22', 58000.00, 3),
('David', 'Wilson', 'david.wilson@company.com', '555-0105', '2018-11-05', 70000.00, 4),
('Sarah', 'Martinez', 'sarah.martinez@company.com', '555-0106', '2022-02-14', 55000.00, 5),
('Robert', 'Taylor', 'robert.taylor@company.com', '555-0107', '2019-09-30', 78000.00, 1),
('Lisa', 'Anderson', 'lisa.anderson@company.com', '555-0108', '2021-04-18', 62000.00, 2);

-- Insert dummy data for Categories
INSERT INTO categories (category_name, description) VALUES
('Electronics', 'Electronic devices and accessories'),
('Clothing', 'Apparel and fashion items'),
('Books', 'Physical and digital books'),
('Home & Garden', 'Home improvement and garden supplies'),
('Sports & Outdoors', 'Sports equipment and outdoor gear'),
('Toys & Games', 'Toys, games, and entertainment');

-- Insert dummy data for Customers
INSERT INTO customers (first_name, last_name, email, phone, address, city, state, zip_code, country) VALUES
('Alice', 'Cooper', 'alice.cooper@email.com', '555-1001', '123 Main St', 'Springfield', 'IL', '62701', 'USA'),
('Bob', 'Miller', 'bob.miller@email.com', '555-1002', '456 Oak Ave', 'Portland', 'OR', '97201', 'USA'),
('Carol', 'Davis', 'carol.davis@email.com', '555-1003', '789 Pine Rd', 'Austin', 'TX', '78701', 'USA'),
('Daniel', 'Garcia', 'daniel.garcia@email.com', '555-1004', '321 Elm St', 'Miami', 'FL', '33101', 'USA'),
('Emma', 'Rodriguez', 'emma.rodriguez@email.com', '555-1005', '654 Maple Dr', 'Seattle', 'WA', '98101', 'USA'),
('Frank', 'Martinez', 'frank.martinez@email.com', '555-1006', '987 Cedar Ln', 'Denver', 'CO', '80201', 'USA'),
('Grace', 'Hernandez', 'grace.hernandez@email.com', '555-1007', '147 Birch Way', 'Boston', 'MA', '02101', 'USA'),
('Henry', 'Lopez', 'henry.lopez@email.com', '555-1008', '258 Spruce Ct', 'Phoenix', 'AZ', '85001', 'USA'),
('Iris', 'Gonzalez', 'iris.gonzalez@email.com', '555-1009', '369 Willow Ave', 'Atlanta', 'GA', '30301', 'USA'),
('Jack', 'Wilson', 'jack.wilson@email.com', '555-1010', '741 Ash Blvd', 'San Diego', 'CA', '92101', 'USA');

-- Insert dummy data for Products
INSERT INTO products (product_name, description, category_id, price, stock_quantity) VALUES
('Laptop Pro 15', 'High-performance laptop with 16GB RAM', 1, 1299.99, 50),
('Wireless Mouse', 'Ergonomic wireless mouse with USB receiver', 1, 29.99, 200),
('USB-C Cable', '6ft USB-C charging cable', 1, 12.99, 500),
('Cotton T-Shirt', 'Comfortable cotton t-shirt, various colors', 2, 19.99, 300),
('Denim Jeans', 'Classic fit denim jeans', 2, 49.99, 150),
('Programming in Python', 'Comprehensive Python programming guide', 3, 39.99, 100),
('Science Fiction Novel', 'Bestselling sci-fi adventure', 3, 14.99, 250),
('Garden Hose', '50ft expandable garden hose', 4, 34.99, 80),
('LED Light Bulbs (4-pack)', 'Energy-efficient LED bulbs', 4, 24.99, 400),
('Yoga Mat', 'Non-slip exercise yoga mat', 5, 29.99, 120),
('Basketball', 'Official size basketball', 5, 24.99, 90),
('Board Game Deluxe', 'Family board game for 2-6 players', 6, 44.99, 60),
('Building Blocks Set', '500-piece construction set', 6, 34.99, 75);

-- Insert dummy data for Orders
INSERT INTO orders (customer_id, order_date, total_amount, status, shipping_address, shipping_city, shipping_state, shipping_zip) VALUES
(1, '2024-11-01 10:30:00', 1329.98, 'delivered', '123 Main St', 'Springfield', 'IL', '62701'),
(2, '2024-11-05 14:20:00', 79.98, 'delivered', '456 Oak Ave', 'Portland', 'OR', '97201'),
(3, '2024-11-10 09:15:00', 54.98, 'shipped', '789 Pine Rd', 'Austin', 'TX', '78701'),
(4, '2024-11-12 16:45:00', 119.97, 'processing', '321 Elm St', 'Miami', 'FL', '33101'),
(5, '2024-11-15 11:30:00', 1299.99, 'pending', '654 Maple Dr', 'Seattle', 'WA', '98101'),
(1, '2024-11-18 13:20:00', 69.98, 'delivered', '123 Main St', 'Springfield', 'IL', '62701'),
(6, '2024-11-20 10:00:00', 94.97, 'shipped', '987 Cedar Ln', 'Denver', 'CO', '80201'),
(7, '2024-11-22 15:30:00', 44.99, 'processing', '147 Birch Way', 'Boston', 'MA', '02101'),
(8, '2024-11-25 12:15:00', 149.96, 'pending', '258 Spruce Ct', 'Phoenix', 'AZ', '85001'),
(9, '2024-11-28 09:45:00', 39.99, 'delivered', '369 Willow Ave', 'Atlanta', 'GA', '30301');

-- Insert dummy data for Order Items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES
(1, 1, 1, 1299.99, 1299.99),
(1, 2, 1, 29.99, 29.99),
(2, 4, 2, 19.99, 39.99),
(2, 5, 1, 49.99, 49.99),
(3, 7, 2, 14.99, 29.99),
(3, 6, 1, 39.99, 39.99),
(4, 10, 1, 29.99, 29.99),
(4, 11, 1, 24.99, 24.99),
(4, 12, 1, 44.99, 44.99),
(5, 1, 1, 1299.99, 1299.99),
(6, 8, 2, 34.99, 69.98),
(7, 9, 1, 24.99, 24.99),
(7, 3, 2, 12.99, 25.98),
(7, 12, 1, 44.99, 44.99),
(8, 13, 1, 34.99, 34.99),
(9, 6, 1, 39.99, 39.99),
(10, 2, 5, 29.99, 149.96);

-- Create some useful views
CREATE OR REPLACE VIEW customer_order_summary AS
SELECT 
    c.customer_id,
    c.first_name,
    c.last_name,
    c.email,
    COUNT(o.order_id) as total_orders,
    SUM(o.total_amount) as total_spent
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.first_name, c.last_name, c.email;

CREATE OR REPLACE VIEW product_sales_summary AS
SELECT 
    p.product_id,
    p.product_name,
    c.category_name,
    p.price,
    p.stock_quantity,
    COALESCE(SUM(oi.quantity), 0) as total_sold,
    COALESCE(SUM(oi.subtotal), 0) as total_revenue
FROM products p
LEFT JOIN categories c ON p.category_id = c.category_id
LEFT JOIN order_items oi ON p.product_id = oi.product_id
GROUP BY p.product_id, p.product_name, c.category_name, p.price, p.stock_quantity;

-- Create some indexes for better query performance
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- ==========================================
-- STORED PROCEDURES
-- ==========================================

-- Procedure 1: Get customer orders with details
CREATE OR REPLACE PROCEDURE get_customer_orders(
    IN p_customer_id INTEGER,
    INOUT result_count INTEGER DEFAULT 0
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Create a temporary table to store results
    CREATE TEMP TABLE IF NOT EXISTS temp_customer_orders (
        order_id INTEGER,
        order_date TIMESTAMP,
        total_amount DECIMAL(10,2),
        status VARCHAR(20),
        product_name VARCHAR(200),
        quantity INTEGER
    ) ON COMMIT DROP;

    -- Insert order details
    INSERT INTO temp_customer_orders
    SELECT 
        o.order_id,
        o.order_date,
        o.total_amount,
        o.status,
        p.product_name,
        oi.quantity
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    JOIN products p ON oi.product_id = p.product_id
    WHERE o.customer_id = p_customer_id
    ORDER BY o.order_date DESC;

    -- Get count of results
    SELECT COUNT(*) INTO result_count FROM temp_customer_orders;

    RAISE NOTICE 'Found % order items for customer %', result_count, p_customer_id;
END;
$$;

-- Procedure 2: Update product stock after order
CREATE OR REPLACE PROCEDURE update_product_stock(
    IN p_order_id INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_product_id INTEGER;
    v_quantity INTEGER;
    v_current_stock INTEGER;
    item_cursor CURSOR FOR 
        SELECT product_id, quantity 
        FROM order_items 
        WHERE order_id = p_order_id;
BEGIN
    OPEN item_cursor;
    
    LOOP
        FETCH item_cursor INTO v_product_id, v_quantity;
        EXIT WHEN NOT FOUND;
        
        -- Get current stock
        SELECT stock_quantity INTO v_current_stock
        FROM products
        WHERE product_id = v_product_id;
        
        -- Update stock
        UPDATE products
        SET stock_quantity = stock_quantity - v_quantity
        WHERE product_id = v_product_id;
        
        RAISE NOTICE 'Product % stock updated from % to %', 
            v_product_id, v_current_stock, (v_current_stock - v_quantity);
    END LOOP;
    
    CLOSE item_cursor;
    
    RAISE NOTICE 'Stock updated for all items in order %', p_order_id;
END;
$$;

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Function 1: Calculate customer lifetime value
CREATE OR REPLACE FUNCTION get_customer_lifetime_value(p_customer_id INTEGER)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_value DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(total_amount), 0)
    INTO v_total_value
    FROM orders
    WHERE customer_id = p_customer_id;
    
    RETURN v_total_value;
END;
$$;

-- Function 2: Get product stock status
CREATE OR REPLACE FUNCTION get_product_stock_status(p_product_id INTEGER)
RETURNS VARCHAR(20)
LANGUAGE plpgsql
AS $$
DECLARE
    v_stock INTEGER;
    v_status VARCHAR(20);
BEGIN
    SELECT stock_quantity INTO v_stock
    FROM products
    WHERE product_id = p_product_id;
    
    IF v_stock IS NULL THEN
        v_status := 'NOT_FOUND';
    ELSIF v_stock = 0 THEN
        v_status := 'OUT_OF_STOCK';
    ELSIF v_stock < 20 THEN
        v_status := 'LOW_STOCK';
    ELSIF v_stock < 50 THEN
        v_status := 'MEDIUM_STOCK';
    ELSE
        v_status := 'IN_STOCK';
    END IF;
    
    RETURN v_status;
END;
$$;

-- Function 3: Calculate order total (for validation)
CREATE OR REPLACE FUNCTION calculate_order_total(p_order_id INTEGER)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_calculated_total DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(subtotal), 0)
    INTO v_calculated_total
    FROM order_items
    WHERE order_id = p_order_id;
    
    RETURN v_calculated_total;
END;
$$;

-- Display some sample queries
-- SELECT * FROM customer_order_summary;
-- SELECT * FROM product_sales_summary ORDER BY total_revenue DESC;
-- SELECT * FROM employees WHERE department_id = 1;
-- SELECT * FROM orders WHERE status = 'pending';

-- Sample procedure and function calls:
-- CALL get_customer_orders(1, NULL);
-- SELECT * FROM temp_customer_orders;
-- CALL update_product_stock(1);
-- SELECT get_customer_lifetime_value(1);
-- SELECT get_product_stock_status(1);
-- SELECT calculate_order_total(1);
