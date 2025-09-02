import { Badge } from "./badge"

interface StatusBadgeProps {
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  pending: {
    label: 'Pendiente',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
    color: '#F59E0B'
  },
  confirmed: {
    label: 'Confirmado',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    color: '#3B82F6'
  },
  shipped: {
    label: 'Enviado',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
    color: '#8B5CF6'
  },
  delivered: {
    label: 'Entregado',
    className: 'bg-green-100 text-green-800 border-green-200',
    color: '#10B981'
  },
  cancelled: {
    label: 'Cancelado',
    className: 'bg-red-100 text-red-800 border-red-200',
    color: '#EF4444'
  }
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status]
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  }

  return (
    <Badge 
      className={`${config.className} ${sizeClasses[size]} border font-medium`}
      variant="outline"
    >
      {config.label}
    </Badge>
  )
} 