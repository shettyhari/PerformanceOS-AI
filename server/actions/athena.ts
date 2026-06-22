"use server";

import { auth } from "../../auth";
import { prisma } from "../../lib/prisma";
import { askAthena, createConversation, getConversations } from "../../services/athena-service";

/**
 * Creates a new conversation thread for the active user organization.
 */
export async function createNewConversation(title?: string) {
  try {
    const session = await auth();
    if (!session || !session.orgId) {
      return { error: "Authentication required" };
    }

    return await createConversation(session.orgId, session.user.id, title);
  } catch (err: any) {
    console.error("Create conversation action fail:", err);
    return { error: "Failed to initialize conversation." };
  }
}

/**
 * Retrieves all conversations list for the active organization.
 */
export async function fetchConversations() {
  try {
    const session = await auth();
    if (!session || !session.orgId) {
      return { error: "Authentication required" };
    }

    return await getConversations(session.orgId);
  } catch (err: any) {
    console.error("Fetch conversations action fail:", err);
    return { error: "Failed to load chats history." };
  }
}

/**
 * Fetches all messages for a specific conversation thread.
 */
export async function fetchConversationMessages(conversationId: string) {
  try {
    const session = await auth();
    if (!session || !session.orgId) {
      return { error: "Authentication required" };
    }

    // Verify ownership of the conversation thread
    const convo = await prisma.aIConversation.findUnique({
      where: { id: conversationId }
    });

    if (!convo || convo.orgId !== session.orgId) {
      return { error: "Unauthorized access to this chat thread." };
    }

    const messages = await prisma.aIMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" }
    });

    return { success: true, messages };
  } catch (err: any) {
    console.error("Fetch messages action fail:", err);
    return { error: "Failed to load messages." };
  }
}

/**
 * Sends a new user query to Athena AI and executes tool calculations.
 */
export async function sendAthenaQuery(conversationId: string, content: string) {
  try {
    const session = await auth();
    if (!session || !session.orgId) {
      return { error: "Authentication required" };
    }

    // Verify ownership of the thread
    const convo = await prisma.aIConversation.findUnique({
      where: { id: conversationId }
    });

    if (!convo || convo.orgId !== session.orgId) {
      return { error: "Unauthorized access to this chat thread." };
    }

    return await askAthena(conversationId, content, session.orgId, session.user.id);
  } catch (err: any) {
    console.error("Send Athena query action fail:", err);
    return { error: "Failed to execute AI request." };
  }
}
