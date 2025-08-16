export interface IndexDetailKeys {
    name: string;
    type: string;
}

export interface TableDetails {
    name: string;
    keys: IndexDetailKeys[];
    primaryKey: string;
}