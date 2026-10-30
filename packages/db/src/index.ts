export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "platform_admin" | "owner" | "technician" | "customer";

export type Tenant = {
  id: string;
  name: string;
  gstin: string | null;
  logo_path: string | null;
  plan: string;
  settings: Json;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type ChemicalCategory = "reagents" | "biochemistry" | "hematology" | "rapid_cards" | "consumables";

export type UnitStatus = "active" | "inactive";

export type ServiceEventType = "installation" | "breakdown" | "preventive";

export type ServiceEventStatus = "open" | "completed";

type Audit = {
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type Customer = Audit & {
  id: string;
  tenant_id: string;
  name: string;
  contact_person: string | null;
  mobile: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  pin: string | null;
  gstin: string | null;
  tally_ledger_name: string | null;
};

export type EquipmentType = Audit & {
  id: string;
  tenant_id: string;
  name: string;
  category: string | null;
};

export type Chemical = Audit & {
  id: string;
  tenant_id: string;
  name: string;
  category: ChemicalCategory;
};

export type Unit = Audit & {
  id: string;
  tenant_id: string;
  customer_id: string;
  equipment_type_id: string;
  make: string | null;
  model: string | null;
  serial_no: string;
  installed_on: string;
  pmd_interval_months: number;
  pmd_start_date: string;
  status: UnitStatus;
};

export type ServiceEvent = Audit & {
  id: string;
  tenant_id: string;
  unit_id: string;
  type: ServiceEventType;
  event_date: string;
  technician_id: string | null;
  complaint: string | null;
  work_done: string | null;
  status: ServiceEventStatus;
  billable: boolean;
  amount: number | null;
  invoice_ref: string | null;
  request_id: string | null;
};

export type PmdSchedule = Audit & {
  id: string;
  tenant_id: string;
  unit_id: string;
  due_date: string;
  completed_on: string | null;
  completed_event_id: string | null;
  skip_reason: string | null;
};

export type Activity = {
  id: string;
  tenant_id: string;
  kind: string;
  summary: string;
  created_at: string;
  created_by: string | null;
};

export type Profile = {
  id: string;
  user_id: string;
  tenant_id: string;
  role: UserRole;
  full_name: string;
  mobile: string | null;
  customer_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

type TenantInsert = {
  id?: string;
  name: string;
  gstin?: string | null;
  logo_path?: string | null;
  plan?: string;
  settings?: Json;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
};

type ProfileInsert = {
  id?: string;
  user_id: string;
  tenant_id: string;
  role: UserRole;
  full_name: string;
  mobile?: string | null;
  customer_id?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
};

type CustomerInsert = {
  id?: string;
  tenant_id: string;
  name: string;
  contact_person?: string | null;
  mobile?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  pin?: string | null;
  gstin?: string | null;
  tally_ledger_name?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
};

type EquipmentTypeInsert = {
  id?: string;
  tenant_id: string;
  name: string;
  category?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
};

type ChemicalInsert = {
  id?: string;
  tenant_id: string;
  name: string;
  category: ChemicalCategory;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
};

type UnitInsert = {
  id?: string;
  tenant_id: string;
  customer_id: string;
  equipment_type_id: string;
  make?: string | null;
  model?: string | null;
  serial_no: string;
  installed_on: string;
  pmd_interval_months?: number;
  pmd_start_date: string;
  status?: UnitStatus;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
};

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: Tenant;
        Insert: TenantInsert;
        Update: Partial<TenantInsert>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: Partial<ProfileInsert>;
        Relationships: [];
      };
      customers: {
        Row: Customer;
        Insert: CustomerInsert;
        Update: Partial<CustomerInsert>;
        Relationships: [];
      };
      equipment_types: {
        Row: EquipmentType;
        Insert: EquipmentTypeInsert;
        Update: Partial<EquipmentTypeInsert>;
        Relationships: [];
      };
      chemicals: {
        Row: Chemical;
        Insert: ChemicalInsert;
        Update: Partial<ChemicalInsert>;
        Relationships: [];
      };
      units: {
        Row: Unit;
        Insert: UnitInsert;
        Update: Partial<UnitInsert>;
        Relationships: [];
      };
      service_events: {
        Row: ServiceEvent;
        Insert: Partial<ServiceEvent>;
        Update: Partial<ServiceEvent>;
        Relationships: [];
      };
      pmd_schedule: {
        Row: PmdSchedule;
        Insert: Partial<PmdSchedule>;
        Update: Partial<PmdSchedule>;
        Relationships: [];
      };
      activity: {
        Row: Activity;
        Insert: {
          id?: string;
          tenant_id: string;
          kind: string;
          summary: string;
          created_at?: string;
          created_by?: string | null;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      install_unit: {
        Args: {
          p_customer_id: string;
          p_equipment_type_id: string;
          p_make: string;
          p_model: string;
          p_serial_no: string;
          p_installed_on: string;
          p_pmd_interval_months: number;
          p_pmd_start_date: string;
        };
        Returns: string;
      };
      request_visit: {
        Args: {
          p_unit_id: string;
          p_note: string;
        };
        Returns: string;
      };
      record_visit: {
        Args: {
          p_unit_id: string;
          p_type: string;
          p_event_date: string;
          p_complaint: string;
          p_work_done: string;
        };
        Returns: string;
      };
      skip_pmd: {
        Args: {
          p_unit_id: string;
          p_skipped_on: string;
          p_reason: string;
        };
        Returns: string;
      };
    };
    Enums: {
      user_role: UserRole;
      chemical_category: ChemicalCategory;
      unit_status: UnitStatus;
      service_event_type: ServiceEventType;
      service_event_status: ServiceEventStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
