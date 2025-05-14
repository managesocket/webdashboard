import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "./card";
import { Dice5 } from "lucide-react";

type CasinoCardProps = {
  title: string;
  description: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
};

export function CasinoCard({
  title,
  description,
  children,
  icon = <Dice5 />,
  className = "",
  footer,
}: CasinoCardProps) {
  return (
    <Card className={`bg-secondary rounded-xl overflow-hidden shadow-lg ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="font-bold text-xl">{title}</CardTitle>
          <div className="text-accent">{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-6">{description}</p>
        {children}
      </CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}

export function CurrencyCard({
  amount,
  className = "",
  label = "coins",
}: {
  amount: number;
  className?: string;
  label?: string;
}) {
  return (
    <div className={`gradient-border inline-block ${className}`}>
      <div className="bg-secondary p-4 rounded-xl">
        <div className="flex justify-center items-center space-x-3">
          <i className="fas fa-coins text-warning text-2xl"></i>
          <span className="font-mono text-warning text-2xl">{amount.toLocaleString()}</span>
          <span className="text-muted-foreground">{label}</span>
        </div>
      </div>
    </div>
  );
}
