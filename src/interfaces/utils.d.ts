// SERVICES
export interface user_profile_i {
  readonly _id: string;
  readonly name: string;
  readonly username: string;
  readonly email: string;
  readonly email_verified: boolean;
  readonly phone: string;
  readonly role: string;
  readonly img: string;
  readonly ref_code: string;
  readonly ref_from: string;
  readonly city: string;
  readonly district: string;
  readonly address: string;
  readonly zip: number;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface wallet_i {
  /** encoded key generated from 32 bytes random seed */
  readonly private: string;
  /** encoded public key generated from private key */
  readonly public: string;
}
