import { z } from 'zod';

// --- ORDER SCHEMAS ---

export const orderItemSchema = z.object({
    jerseyNumber: z.string().min(1).max(6),
    jerseyName: z.string().max(30).optional(),
    batch: z.string().max(15).optional(),
    size: z.string().min(1).max(10),
    collarType: z.string().min(1).max(20),
    sleeveType: z.string().min(1).max(20),
    itemPrice: z.number().positive(),
});

export const createOrderSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(30),
        mobileNumber: z.string().min(10).max(15),
        email: z.string().email().max(40),
        transactionId: z.string().max(30).optional(),
        notes: z.string().max(500).optional(),
        finalPrice: z.number().positive(),
        items: z.array(orderItemSchema).min(1),
    }),
});

// --- ADMIN SCHEMAS ---

export const adminLoginSchema = z.object({
    body: z.object({
        username: z.string().min(3).max(30),
        password: z.string().min(6),
    }),
});

export const adminRegisterSchema = z.object({
    body: z.object({
        username: z.string().min(3).max(30),
        name: z.string().min(2).max(60).optional(),
        email: z.string().email().max(100),
        password: z.string().min(6),
    }),
});

// --- EXPENSE SCHEMAS ---

export const createExpenseSchema = z.object({
    body: z.object({
        description: z.string().min(2).max(200),
        amount: z.number().positive(),
        category: z.string().max(50).optional(),
        date: z.string().max(20).optional(),
    }),
});
