import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PageHeaderProps = {
  title: string;
  description: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <Card className="wedding-panel shadow-none">
      <CardHeader className="gap-1.5 p-4 sm:p-6">
        <CardTitle className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {title}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground sm:text-base">
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
