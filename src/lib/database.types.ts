export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          name: string;
          contact_person: string | null;
          email: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          contact_person?: string | null;
          email?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          contact_person?: string | null;
          email?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      inbound_packages: {
        Row: {
          id: string;
          client_id: string;
          package_type: string;
          received_by: string;
          atera_ticket_id: string;
          status: 'OK' | 'WARNING' | 'CRITICAL';
          received_date: string;
          expected_date: string;
         serial_number: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          package_type: string;
          received_by: string;
          atera_ticket_id?: string;
          status?: 'OK' | 'WARNING' | 'CRITICAL';
          received_date: string;
          expected_date: string;
         serial_number?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          package_type?: string;
          received_by?: string;
          atera_ticket_id?: string;
          status?: 'OK' | 'WARNING' | 'CRITICAL';
          received_date?: string;
          expected_date?: string;
         serial_number?: string | null;
         created_at?: string;
         completed?: boolean;
         completed_at?: string;
         completed_by?: string;
        };
      };
    };
  };
}