// Shipment Management Types

export interface ShipmentCreateRequest {
  weekly_plan_data: WeeklyPlanResult;
  shipment_date: string;
  empresa_id: string;
  notes?: string;
}

export interface ShipmentCreateResponse {
  status: string;
  shipment_id: string;
  message: string;
  summary: {
    total_cost: number;
    total_menus: number;
    week_range: string;
    clients: number[];
  };
}

export interface ShipmentSummary {
  id: string;
  created_at: string;
  shipment_date: string;
  week_start_date: string;
  week_end_date: string;
  total_cost: number;
  total_menus: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  notes?: string;
  client_count: number;
}

export interface ShipmentDetail {
  shipment: ShipmentSummary;
  clients: Array<{
    cliente_id: number;
    client_name: string;
    total_cost: number;
    total_menus: number;
    total_kcal: number;
    menus: Array<{
      fecha: string;
      costo_total: number;
      kilocalorias_total: number;
      components: Array<{
        componente_id: number;
        receta_id: string;
        is_unique: boolean;
      }>;
    }>;
  }>;
  ingredients_summary: Array<{
    codigo_ingrediente: string;
    nombre_ingrediente: string;
    unidad: string;
    cantidad_total: number;
    costo_total: number;
  }>;
}

export interface ShipmentAnalytics {
  period_days: number;
  analytics: {
    total_shipments: number;
    total_cost: number;
    total_menus: number;
    avg_cost_per_shipment: number;
    avg_cost_per_menu: number;
    status_breakdown: Record<string, number>;
  };
}

export interface WeeklyPlanResult {
  status: string;
  plan: Array<{
    cliente_id: number;
    menus: Array<{
      fecha: string;
      tipo_menu: string;
      componentes: Array<{
        componente_id: number;
        receta_id: string;
        unico: boolean;
      }>;
      costo_total: number;
      kilocalorias_total: number;
    }>;
  }>;
}

export interface ShipmentFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  status?: string;
  clientCount?: {
    min: number;
    max: number;
  };
  search?: string;
}

export interface ShipmentStatusUpdate {
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  notes?: string;
} 