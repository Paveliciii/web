export interface Order {
    id?: number;
    order_id: string;
    customer_id: number;
    customer_name?: string;
    product_id: number;
    product_name?: string;
    quantity: number;
    price?: number;
    sales?: number;
    order_date?: string;
    region_id: number;
    region?: string;
}

export interface Product {
    id: number;
    name: string;
    category: string;
    price: number;
}

export interface Region {
    id: number;
    name: string;
}

export interface Customer {
    id: number;
    name: string;
}

export interface SalesSummary {
    total_orders: number;
    total_quantity: number;
    total_revenue: number;
    average_order_value: number;
}

export interface SalesByRegion {
    region: string;
    order_count: number;
    revenue: number;
}

export interface SalesByRegionChart {
    region_name: string;
    total_sales: number;
}

export interface SalesByProduct {
    product_name: string;
    category: string;
    quantity_sold: number;
    revenue: number;
}

export interface SalesByProductChart {
    product_name: string;
    total_sales: number;
    quantity_sold: number;
}

export interface SalesTrendData {
    date: string;
    revenue: number;
}

// For compatibility with existing code
export interface SalesTrend {
    period: string;
    revenue: number;
}

export interface CustomerSegment {
    segment: string;
    count: number;
    revenue: number;
} 