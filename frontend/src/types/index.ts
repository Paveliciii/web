export interface Order {
    id: number;
    order_id: string;
    order_date: string;
    ship_date?: string;
    ship_mode?: string;
    customer_id: number;
    customer_name: string;
    segment?: string;
    country: string;
    city: string;
    state: string;
    postal_code: string;
    region_id: number;
    product_id: number;
    quantity: number;
    sales: number;
    discount?: number;
    profit?: number;
}

export interface Product {
    id: number;
    name: string;
    price: number;
}

export interface Region {
    id: number;
    name: string;
}

export interface SalesSummary {
    total_orders: number;
    total_items: number;
    total_revenue: number;
}

export interface SalesByRegion {
    region: string;
    revenue: number;
}

export interface SalesByProduct {
    product: string;
    total_quantity: number;
    revenue: number;
}

export interface SalesTrend {
    period: string;
    revenue: number;
}

export interface CustomerSegment {
    segment: string;
    count: number;
    revenue: number;
} 