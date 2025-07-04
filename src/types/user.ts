
export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  created_at: string;
  verification_status: string;
  identity_verification_requests?: any[];
  documents?: Array<{
    type: string;
    number: string;
    image_url: string;
    status: string;
    created_at: string;
  }>;
}

export interface NewUser {
  email: string;
  full_name: string;
  phone: string;
  passport_number: string;
  document_type: string;
}
