interface EmailResult {
    success: boolean;
}
export declare function sendEmail(to: string, subject: string, htmlContent: string, textContent: string): Promise<EmailResult>;
export declare function orderConfirmationHtml(order: any): string;
export declare function orderConfirmationText(order: any): string;
export declare function adminNotificationHtml(order: any): string;
export declare function paymentConfirmationHtml(order: any): string;
export declare function adminVerificationHtml(name: string, verifyUrl: string): string;
export {};
//# sourceMappingURL=email.d.ts.map