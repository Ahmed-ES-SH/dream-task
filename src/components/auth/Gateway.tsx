import { useTranslations } from "@/hooks/useTranslations";

export function GatewayAmbient() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute -top-32 left-1/2 size-96 -translate-x-1/2 rounded-full bg-gateway-fg/10 blur-3xl motion-safe:animate-[gateway-glow_6s_ease-in-out_infinite] lg:hidden" />
      <div className="absolute top-1/2 left-1/2 hidden h-[65vh] w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gateway-fg/15 blur-3xl motion-safe:animate-[gateway-glow_6s_ease-in-out_infinite] lg:block" />
      <div className="absolute inset-y-10 left-1/2 hidden w-px -translate-x-1/2 bg-linear-to-b from-transparent via-gateway-fg/25 to-transparent lg:block" />
    </div>
  );
}

export function GatewayCorners() {
  return (
    <>
      <span
        aria-hidden="true"
        className="absolute top-0 start-0 size-5 border-t border-s border-gateway-fg/60 motion-safe:animate-[mark-in_0.5s_ease-out_both]"
      />
      <span
        aria-hidden="true"
        className="absolute top-0 end-0 size-5 border-t border-e border-gateway-fg/60 motion-safe:animate-[mark-in_0.5s_ease-out_both] [animation-delay:100ms]"
      />
      <span
        aria-hidden="true"
        className="absolute bottom-0 start-0 size-5 border-b border-s border-gateway-fg/60 motion-safe:animate-[mark-in_0.5s_ease-out_both] [animation-delay:200ms]"
      />
      <span
        aria-hidden="true"
        className="absolute bottom-0 end-0 size-5 border-b border-e border-gateway-fg/60 motion-safe:animate-[mark-in_0.5s_ease-out_both] [animation-delay:300ms]"
      />
    </>
  );
}

export function GatewayBrandPanel({ description }: { description: string }) {
  const t = useTranslations();

  return (
    <section className="relative hidden flex-col justify-between p-12 lg:flex">
      <p className="text-xs font-medium tracking-[0.35em] text-gateway-fg/50 uppercase">
        {t("navbar.brand")}
      </p>

      <div>
        <h2 className="max-w-lg text-[clamp(4.5rem,9vw,9rem)] leading-[0.95] font-bold tracking-tighter text-gateway-fg [mask-image:linear-gradient(to_bottom,black_60%,transparent_95%)]">
          {t("navbar.brand")}
        </h2>
        <p className="mt-8 max-w-sm text-base text-gateway-fg/60">{description}</p>
      </div>

      <p className="text-xs text-gateway-fg/40">{t("footer.copyright")}</p>
    </section>
  );
}
