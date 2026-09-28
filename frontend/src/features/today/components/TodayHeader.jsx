export default function TodayHeader({ greeting, currentDate }) {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
        {greeting}
      </h1>
      <p className="text-sm font-medium text-muted-foreground">
        {currentDate}
      </p>
    </header>
  );
}
