export default function HeroSection() {
  return (
    <section className="container mx-auto flex min-h-[70vh] items-center px-4">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex rounded-full border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
          💻 Modern Technology Platform
        </span>

        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
          Build. Learn. Innovate.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          Explore the latest technologies, programming resources, and practical
          guides to help you build better software and stay ahead in the tech
          industry.
        </p>
      </div>
    </section>
  );
}
