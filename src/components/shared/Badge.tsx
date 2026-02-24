type BadgeVariant = 'red' | 'amber' | 'green' | 'blue' | 'purple' | 'gray';

const variantClasses: Record<BadgeVariant, string> = {
  red:    'bg-red-50 text-red-700 border-red-200',
  amber:  'bg-amber-50 text-amber-700 border-amber-200',
  green:  'bg-green-50 text-green-700 border-green-200',
  blue:   'bg-blue-50 text-blue-700 border-blue-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  gray:   'bg-gray-100 text-gray-600 border-gray-200',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

export function Badge({ children, variant = 'gray', size = 'sm' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center border rounded-full font-medium ${variantClasses[variant]} ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`}>
      {children}
    </span>
  );
}
