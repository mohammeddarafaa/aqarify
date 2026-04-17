import { Helmet } from "react-helmet-async";
import { SignupForm } from "../components/signup-form";

export default function SignupPage() {
  return (
    <>
      <Helmet><title>Start your trial — Aqarify</title></Helmet>

      <section className="mx-auto grid max-w-5xl gap-12 px-6 py-16 md:grid-cols-[1fr_1.25fr] md:py-24">
        <aside className="hidden md:block">
          <div className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">Get started</div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
            Your branded portal — ready in minutes.
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Fill in a few details, complete a Paymob payment, and we'll provision
            your tenant at <span className="font-medium text-foreground">yourcompany.aqarify.com</span> instantly.
          </p>

          <ol className="mt-10 space-y-6 border-s border-border ps-6">
            {[
              "Tell us about your company",
              "Pick your plan and billing cycle",
              "Pay securely with Paymob",
              "Your portal goes live immediately",
            ].map((step, i) => (
              <li key={step} className="relative">
                <span className="absolute -start-[29px] grid size-5 place-items-center rounded-full bg-foreground text-[0.7rem] font-semibold text-background">
                  {i + 1}
                </span>
                <span className="text-sm">{step}</span>
              </li>
            ))}
          </ol>
        </aside>

        <div className="rounded-2xl border border-border bg-card p-6 md:p-10">
          <SignupForm />
        </div>
      </section>
    </>
  );
}
