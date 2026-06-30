import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-primary via-purple to-purple-deep px-6 text-center">
      <div>
        <p className="font-display text-7xl font-extrabold text-white sm:text-8xl">
          404
        </p>
        <p className="mt-4 text-lg text-white/80">This page hit a wrong note.</p>
        <div className="mt-8">
          <ButtonLink href="/">Back to home</ButtonLink>
        </div>
      </div>
    </div>
  );
}
