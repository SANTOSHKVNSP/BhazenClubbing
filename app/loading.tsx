export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center bg-primary py-32">
      <div
        className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-orange"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
