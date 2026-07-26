import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PageHeaderProps = {
  title: string;
  description: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <Card className="wedding-panel shadow-none">
      <CardHeader className="gap-1.5">
        <CardTitle className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
