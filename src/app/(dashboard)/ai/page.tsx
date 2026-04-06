import { ChatInterface } from "@/components/ai/ChatInterface";

export const dynamic = "force-dynamic";

export default function AskAIPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-zinc-50">Ask AI</h1>
        <p className="text-sm text-zinc-400">Chat with Claude about your trading performance</p>
      </div>
      <ChatInterface />
    </div>
  );
}
