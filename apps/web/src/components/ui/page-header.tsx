export const PageHeader = ({ title, description }: { title: string; description?: string }) => (
  <header className="flex flex-col gap-1">
    <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
    {description ? <p className="max-w-2xl text-base text-muted-foreground">{description}</p> : null}
  </header>
);
