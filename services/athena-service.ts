import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "../lib/prisma";
import { mcpToolDefinitions, executeMcpTool } from "../mcp/tools";

// Initialize Gemini Client
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const SYSTEM_INSTRUCTION = `You are Athena AI, the world-class Marketing Operating System Intelligence assistant inside PerformanceOS AI.
Your purpose is to help digital marketers analyze campaigns, optimize budgets, forecast results, and detect performance anomalies.

Guidelines:
1. Always base your replies on real data. You have access to real-time marketing data via tools.
2. Never make up or simulate data. If the tools return no campaigns or spend, state clearly that no ad accounts are connected.
3. You can request marketing aggregates and campaign details using your tools.
4. Format your responses with structured Markdown:
   - Use Markdown tables to compare metrics.
   - Use bold highlights for key recommendations.
5. Keep your tone professional, strategic, and highly analytical.`;

/**
 * Sends a message to Athena AI (Gemini 2.5 Pro) and runs the MCP Tool Calling orchestration loop.
 */
export async function askAthena(
  conversationId: string,
  userMessageContent: string,
  orgId: string,
  userId: string
) {
  if (!GEMINI_API_KEY) {
    return { error: "Gemini API Key is missing. Configure GEMINI_API_KEY in environment." };
  }

  try {
    // 1. Fetch conversation history from database
    const dbMessages = await prisma.aIMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" }
    });

    // 2. Initialize Gemini 2.5 Pro with System Instructions and registered MCP Tools
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
      systemInstruction: SYSTEM_INSTRUCTION
    });

    // Map history to the format required by the Google Generative AI SDK
    const history = dbMessages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    // Save the new user message to the database first
    await prisma.aIMessage.create({
      data: {
        conversationId,
        role: "user",
        content: userMessageContent
      }
    });

    // 3. Start Chat session with history and tools
    const chat = model.startChat({
      history,
      tools: [{ functionDeclarations: mcpToolDefinitions as any }]
    });

    // 4. Send user query
    let result = await chat.sendMessage(userMessageContent);
    let responseText = "";

    // 5. Tool execution loop: If Gemini calls functions, resolve them locally and return results
    let functionCalls = result.response.functionCalls;
    
    while (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      
      // Execute the requested tool securely
      const toolOutput = await executeMcpTool(call.name, call.args, orgId);

      // Feed the function response back into the chat session
      result = await chat.sendMessage([
        {
          functionResponse: {
            name: call.name,
            response: { content: toolOutput }
          }
        }
      ]);

      // Check if there are further nested function calls
      functionCalls = result.response.functionCalls;
    }

    // Extract the final text response
    responseText = result.response.text();

    if (!responseText) {
      responseText = "I've processed the queries but couldn't generate a text explanation. Please review the campaign logs.";
    }

    // 6. Save the final assistant response to the database
    const savedMsg = await prisma.aIMessage.create({
      data: {
        conversationId,
        role: "assistant",
        content: responseText
      }
    });

    return { success: true, message: savedMsg };
  } catch (err: any) {
    console.error("Athena AI Orchestration error:", err);
    return { error: err.message || "An error occurred while calling Athena AI." };
  }
}

/**
 * Creates a new chat conversation for the active user organization.
 */
export async function createConversation(orgId: string, userId: string, title = "New Analysis") {
  try {
    const convo = await prisma.aIConversation.create({
      data: {
        orgId,
        userId,
        title
      }
    });
    return { success: true, conversation: convo };
  } catch (err: any) {
    console.error("Failed to create conversation:", err);
    return { error: "Failed to create new conversation." };
  }
}

/**
 * Fetches all conversations of an organization.
 */
export async function getConversations(orgId: string) {
  try {
    const convos = await prisma.aIConversation.findMany({
      where: { orgId },
      orderBy: { updatedAt: "desc" }
    });
    return { success: true, conversations: convos };
  } catch (err: any) {
    console.error("Failed to fetch conversations:", err);
    return { error: "Failed to fetch conversations." };
  }
}
