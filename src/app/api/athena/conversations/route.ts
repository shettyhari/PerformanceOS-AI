import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/rbac';
import { athenaService } from '@/server/services';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(session.user.role, 'athena:use')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const conversations = await athenaService.listConversations(
    session.user.organizationId,
    session.user.id,
  );

  return NextResponse.json({ conversations });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  await athenaService.deleteConversation(
    id,
    session.user.organizationId,
    session.user.id,
  );

  return NextResponse.json({ success: true });
}
