import { type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-600" />
      </div>
      <h3 className="text-white font-medium mb-1">{title}</h3>
      <p className="text-gray-500 text-sm text-center max-w-xs mb-4">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 rounded-lg bg-accent/20 text-accent text-sm font-medium hover:bg-accent/30 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
