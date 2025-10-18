export interface Database {
  sessions: {
    key: string;
    data: string;
    updated_at: Date;
  };
}
