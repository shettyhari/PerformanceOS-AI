import { requirePermission } from '@/lib/auth/session';
import { AthenaChat } from '@/features/athena/components/athena-chat';

export default async function AthenaPage() {
  await requirePermission('athena:use');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Athena AI</h1>
        <p className="mt-1 text-muted-foreground">
          Your AI marketing analyst — powered by Gemini 2.5 Pro
        </p>
      </div>
      <AthenaChat />
    </div>
  );
}
