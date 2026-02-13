import { Response } from 'express';
interface OrderItem {
    id: number;
    orderId: number;
    jersey_number: string;
    jersey_name?: string;
    batch?: string;
    size: string;
    collar_type: string;
    sleeve_type: string;
    item_price: string;
}
interface Order {
    id: number;
    name: string;
    mobile_number: string;
    email: string;
    transaction_id?: string;
    notes?: string;
    final_price: string;
    status: string;
    created_at: string;
    items?: OrderItem[];
}
interface Expense {
    id: number;
    description: string;
    amount: string;
    category: string;
    date?: string;
    created_by?: string;
    created_at: string;
}
export declare function generateAllRegistrations(orders: Order[], res: Response): Promise<void>;
export declare function generatePaidReport(orders: Order[], res: Response): Promise<void>;
export declare function generateUnpaidReport(orders: Order[], res: Response): Promise<void>;
export declare function generateBatchReport(orders: Order[], res: Response): Promise<void>;
export declare function generateFinancialReport(orders: Order[], expenses: Expense[], res: Response): Promise<void>;
export declare function generateExpensesReport(expenses: Expense[], res: Response): Promise<void>;
export {};
//# sourceMappingURL=reports.d.ts.map