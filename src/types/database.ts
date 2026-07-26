export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type TaskCategory =
  | "wedding_preparation"
  | "hiras_stuff"
  | "ahmed_and_family";
export type OutfitStatus = "idea" | "ordered" | "fitting" | "ready";
export type GiftStatus =
  | "idea"
  | "ordered"
  | "purchased"
  | "wrapped"
  | "given";

export type Task = {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  event_name: string | null;
  due_date: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  notes: string | null;
  cost: number | null;
  category: TaskCategory;
  created_at: string;
  updated_at: string;
};

export type BudgetCategory = {
  id: string;
  category_name: string;
  estimated_amount: number;
  actual_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type BudgetContribution = {
  id: string;
  person_name: string;
  amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type MoneyTransaction = {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  paid_by: string | null;
  category: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
};

export type Outfit = {
  id: string;
  person_name: string;
  event_name: string | null;
  outfit_description: string | null;
  status: OutfitStatus;
  vendor: string | null;
  cost: number | null;
  notes: string | null;
  image_urls: string[];
  created_at: string;
  updated_at: string;
};

export type Event = {
  id: string;
  event_name: string;
  event_date: string | null;
  venue: string | null;
  guest_count: number | null;
  notes: string | null;
  image_urls: string[];
  created_at: string;
};

export type Gift = {
  id: string;
  person_name: string;
  "To Whom": string | null;
  "What to buy": string | null;
  event_name: string | null;
  status: GiftStatus;
  cost: number | null;
  created_at: string;
  updated_at: string;
};

type Tables = {
  tasks: {
    Row: Task;
    Insert: {
      id?: string;
      title: string;
      description?: string | null;
      assigned_to?: string | null;
      event_name?: string | null;
      due_date?: string | null;
      status?: TaskStatus;
      priority?: TaskPriority;
      notes?: string | null;
      cost?: number | null;
      category?: TaskCategory;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      title?: string;
      description?: string | null;
      assigned_to?: string | null;
      event_name?: string | null;
      due_date?: string | null;
      status?: TaskStatus;
      priority?: TaskPriority;
      notes?: string | null;
      cost?: number | null;
      category?: TaskCategory;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  budget_categories: {
    Row: BudgetCategory;
    Insert: {
      id?: string;
      category_name: string;
      estimated_amount?: number;
      actual_amount?: number;
      notes?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      category_name?: string;
      estimated_amount?: number;
      actual_amount?: number;
      notes?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  budget_contributions: {
    Row: BudgetContribution;
    Insert: {
      id?: string;
      person_name: string;
      amount?: number;
      notes?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      person_name?: string;
      amount?: number;
      notes?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  money_transactions: {
    Row: MoneyTransaction;
    Insert: {
      id?: string;
      transaction_date?: string;
      description: string;
      amount: number;
      paid_by?: string | null;
      category?: string | null;
      payment_method?: string | null;
      notes?: string | null;
      created_at?: string;
    };
    Update: {
      id?: string;
      transaction_date?: string;
      description?: string;
      amount?: number;
      paid_by?: string | null;
      category?: string | null;
      payment_method?: string | null;
      notes?: string | null;
      created_at?: string;
    };
    Relationships: [];
  };
  outfits: {
    Row: Outfit;
    Insert: {
      id?: string;
      person_name: string;
      event_name?: string | null;
      outfit_description?: string | null;
      status?: OutfitStatus;
      vendor?: string | null;
      cost?: number | null;
      notes?: string | null;
      image_urls?: string[];
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      person_name?: string;
      event_name?: string | null;
      outfit_description?: string | null;
      status?: OutfitStatus;
      vendor?: string | null;
      cost?: number | null;
      notes?: string | null;
      image_urls?: string[];
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  events: {
    Row: Event;
    Insert: {
      id?: string;
      event_name: string;
      event_date?: string | null;
      venue?: string | null;
      guest_count?: number | null;
      notes?: string | null;
      image_urls?: string[];
      created_at?: string;
    };
    Update: {
      id?: string;
      event_name?: string;
      event_date?: string | null;
      venue?: string | null;
      guest_count?: number | null;
      notes?: string | null;
      image_urls?: string[];
      created_at?: string;
    };
    Relationships: [];
  };
  gifts: {
    Row: Gift;
    Insert: {
      id?: string;
      person_name: string;
      "To Whom"?: string | null;
      "What to buy"?: string | null;
      event_name?: string | null;
      status?: GiftStatus;
      cost?: number | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      person_name?: string;
      "To Whom"?: string | null;
      "What to buy"?: string | null;
      event_name?: string | null;
      status?: GiftStatus;
      cost?: number | null;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
};

export type Database = {
  public: {
    Tables: Tables;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
