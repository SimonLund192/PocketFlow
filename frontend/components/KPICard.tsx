import { Card } from "@/components/ui/card";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
}

export default function KPICard({ title, value, change, isPositive }: KPICardProps) {
  return (
    <Card className="p-6 bg-white">
      <p className="text-sm text-gray-500 font-medium uppercase tracking-wide mb-2">
        {title}
      </p>
      <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
      {change && (
        <p className={`text-sm font-medium ${
          isPositive === true 
            ? "text-green-600" 
            : isPositive === false 
            ? "text-red-600" 
            : "text-gray-500"
        }`}>
          {change}
        </p>
      )}
    </Card>
  );
}
