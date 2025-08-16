export class TransactionStatusService { 
    db: Map<string, any> = new Map();

    private static instance: TransactionStatusService | null = null;

    constructor() {
        if(TransactionStatusService.instance) {
            throw new Error("TransactionStatusService is a singleton");
        }
        TransactionStatusService.instance = this;
    }

    public static getInstance(): TransactionStatusService {
        if (!TransactionStatusService.instance) {
            TransactionStatusService.instance = new TransactionStatusService();
        }
        return TransactionStatusService.instance;
    }

    public async getTransactionStatus(transactionId: string) {
        return this.db.get(transactionId);
    }

    public async updateTransactionStatus(transactionId: string, status: any) {
        this.db.set(transactionId, status);
        return status;
    }
}