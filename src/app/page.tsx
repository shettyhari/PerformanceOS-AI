import Link from 'next/link';
import { ArrowRight, BarChart3, Brain, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { env } from '@/lib/env';

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute -right-40 bottom-0 h-[400px] w-[400px] rounded-full bg-purple-500/15 blur-[100px]" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            {env.NEXT_PUBLIC_APP_NAME}
          </span>
        </div>
        <nav className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/login">
              Get started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card/80 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
            <Brain className="h-4 w-4 text-primary" />
            Powered by Athena AI · Gemini 2.5 Pro
          </div>

          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            One Dashboard.{' '}
            <span className="text-gradient">Every Marketing Channel.</span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
            Enterprise AI-powered marketing operating system. Reporting,
            analytics, attribution, forecasting, CRM, and automation — unified.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="h-12 px-8 text-base" asChild>
              <Link href="/login">
                Start free trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 text-base"
              asChild
            >
              <Link href="/api/health">View system status</Link>
            </Button>
          </div>
        </div>

        <div className="mt-24 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: BarChart3,
              title: 'Unified Reporting',
              description:
                'Windsor.ai-powered data from Meta, Google, LinkedIn, and Microsoft — synced locally for sub-2s dashboards.',
            },
            {
              icon: Brain,
              title: 'Athena AI',
              description:
                'Natural language insights, budget optimization, forecasting, and executive summaries via MCP tools.',
            },
            {
              icon: Zap,
              title: 'Enterprise Ready',
              description:
                'RBAC, multi-tenant orgs, encrypted credentials, audit logs, and subscription-ready architecture.',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="glass animate-fade-in rounded-2xl p-6 transition-shadow hover:shadow-lg"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
