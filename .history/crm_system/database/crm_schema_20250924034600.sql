-- WhatsApp CRM Database Schema
-- Created for comprehensive customer management

-- Customers Table
CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255),
    business_name VARCHAR(255),
    location VARCHAR(255),
    customer_type VARCHAR(50), -- 'individual', 'business', 'group'
    segment VARCHAR(50), -- 'vip', 'regular', 'prospect', 'inactive'
    total_messages INTEGER DEFAULT 0,
    last_contact_date DATETIME,
    first_contact_date DATETIME,
    preferred_products TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Messages Table
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    message_date DATETIME,
    message_type VARCHAR(20), -- 'incoming', 'outgoing', 'notification'
    message_text TEXT,
    chat_session VARCHAR(255),
    attachment_type VARCHAR(50),
    attachment_info VARCHAR(255),
    status VARCHAR(20), -- 'read', 'sent', 'received'
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Products Table
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price DECIMAL(10,2),
    stock_quantity INTEGER,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sales Table
CREATE TABLE sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    unit_price DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    sale_date DATETIME,
    status VARCHAR(20), -- 'pending', 'completed', 'cancelled'
    notes TEXT,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Customer Segments Table
CREATE TABLE customer_segments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    criteria TEXT, -- JSON criteria for segmentation
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Automated Responses Table
CREATE TABLE automated_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trigger_keywords TEXT, -- JSON array of keywords
    response_text TEXT,
    response_type VARCHAR(50), -- 'text', 'template', 'catalog'
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Analytics Table
CREATE TABLE analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_name VARCHAR(100),
    metric_value DECIMAL(15,2),
    date_recorded DATE,
    segment VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_customers_phone ON customers(phone_number);
CREATE INDEX idx_customers_segment ON customers(segment);
CREATE INDEX idx_messages_customer ON messages(customer_id);
CREATE INDEX idx_messages_date ON messages(message_date);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_date ON sales(sale_date);
