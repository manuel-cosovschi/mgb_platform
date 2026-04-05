"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Hash, Plus, Send, Loader2, Lock, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface Channel {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  createdAt: string;
  _count: { messages: number };
  messages: { content: string; createdAt: string; sender: { name: string } }[];
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string; image?: string; role: string };
}

// ─── Channel list panel ───────────────────────────────────────────────────────

function ChannelList({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newChannel, setNewChannel] = useState({ name: "", description: "", isPrivate: false });

  const { data: channels = [], isLoading } = useQuery<Channel[]>({
    queryKey: ["chat-channels"],
    queryFn: async () => {
      const r = await fetch("/api/chat/channels");
      return r.json();
    },
    refetchInterval: 10_000,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newChannel) => {
      const r = await fetch("/api/chat/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error("Error al crear canal");
      return r.json();
    },
    onSuccess: (channel) => {
      queryClient.invalidateQueries({ queryKey: ["chat-channels"] });
      toast.success("Canal creado");
      setCreateOpen(false);
      setNewChannel({ name: "", description: "", isPrivate: false });
      onSelect(channel.id);
    },
    onError: () => toast.error("No se pudo crear el canal"),
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-3 border-b">
        <span className="text-sm font-semibold">Canales</span>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear canal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nombre del canal</Label>
                <Input
                  value={newChannel.name}
                  onChange={(e) => setNewChannel((p) => ({ ...p, name: e.target.value }))}
                  placeholder="general, proyectos, etc."
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción (opcional)</Label>
                <Input
                  value={newChannel.description}
                  onChange={(e) => setNewChannel((p) => ({ ...p, description: e.target.value }))}
                  placeholder="¿Para qué es este canal?"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Canal privado</Label>
                  <p className="text-xs text-muted-foreground">Solo los invitados pueden acceder</p>
                </div>
                <Switch
                  checked={newChannel.isPrivate}
                  onCheckedChange={(v) => setNewChannel((p) => ({ ...p, isPrivate: v }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button
                onClick={() => createMutation.mutate(newChannel)}
                disabled={!newChannel.name || createMutation.isPending}
              >
                {createMutation.isPending ? "Creando..." : "Crear canal"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {isLoading ? (
          <div className="space-y-1 p-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-md" />)}
          </div>
        ) : channels.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground px-3">
            No hay canales.<br />Crea el primero.
          </div>
        ) : (
          channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => onSelect(channel.id)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left transition-colors mx-1",
                selectedId === channel.id
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {channel.isPrivate ? (
                <Lock className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <Hash className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="truncate">{channel.name}</span>
              {channel._count.messages > 0 && (
                <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
                  {channel._count.messages}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Message thread ───────────────────────────────────────────────────────────

function MessageThread({
  channelId,
  channelName,
}: {
  channelId: string;
  channelName: string;
}) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["chat-messages", channelId],
    queryFn: async () => {
      const r = await fetch(`/api/chat/channels/${channelId}/messages`);
      return r.json();
    },
    refetchInterval: 3_000,
  });

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const r = await fetch(`/api/chat/channels/${channelId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!r.ok) throw new Error("Error al enviar");
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", channelId] });
    },
    onError: () => toast.error("No se pudo enviar el mensaje"),
  });

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    sendMutation.mutate(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const ROLE_COLORS: Record<string, string> = {
    SOCIO: "text-purple-400",
    EMPLEADO: "text-blue-400",
    CLIENTE: "text-green-400",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Channel header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <Hash className="h-4 w-4 text-muted-foreground" />
        <span className="font-semibold">{channelName}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-full max-w-sm" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Sin mensajes aún</p>
            <p className="text-xs text-muted-foreground mt-1">¡Sé el primero en escribir!</p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const isOwn = msg.author.id === session?.user?.id;
              const prevMsg = messages[idx - 1];
              const showHeader = !prevMsg || prevMsg.author.id !== msg.author.id;

              return (
                <div key={msg.id} className={cn("flex gap-3", isOwn && "flex-row-reverse")}>
                  {showHeader && (
                    <div
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                        isOwn ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {msg.author.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}
                  {!showHeader && <div className="w-8 shrink-0" />}
                  <div className={cn("flex flex-col max-w-[70%]", isOwn && "items-end")}>
                    {showHeader && (
                      <div className={cn("flex items-center gap-2 mb-1", isOwn && "flex-row-reverse")}>
                        <span className={cn("text-xs font-semibold", ROLE_COLORS[msg.author.role])}>
                          {msg.author.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatRelativeTime(msg.createdAt)}
                        </span>
                      </div>
                    )}
                    <div
                      className={cn(
                        "px-3 py-2 rounded-2xl text-sm",
                        isOwn
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-muted text-foreground rounded-tl-sm"
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Mensaje en #${channelName}`}
            className="flex-1"
            disabled={sendMutation.isPending}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            size="icon"
          >
            {sendMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 ml-1">
          Enter para enviar · Shift+Enter para nueva línea
        </p>
      </div>
    </div>
  );
}

// ─── Main chat page ───────────────────────────────────────────────────────────

export default function ChatPage() {
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [selectedChannelName, setSelectedChannelName] = useState<string>("");

  const { data: channels = [] } = useQuery<Channel[]>({
    queryKey: ["chat-channels"],
    queryFn: async () => {
      const r = await fetch("/api/chat/channels");
      return r.json();
    },
  });

  const handleSelectChannel = (id: string) => {
    setSelectedChannelId(id);
    const ch = channels.find((c) => c.id === id);
    if (ch) setSelectedChannelName(ch.name);
  };

  // Auto-select first channel
  useEffect(() => {
    if (channels.length > 0 && !selectedChannelId) {
      setSelectedChannelId(channels[0].id);
      setSelectedChannelName(channels[0].name);
    }
  }, [channels, selectedChannelId]);

  return (
    <div className="flex flex-col h-full">
      <Header
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Chat" }]}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-56 border-r bg-card/50 flex-shrink-0 overflow-hidden">
          <ChannelList selectedId={selectedChannelId} onSelect={handleSelectChannel} />
        </div>

        {/* Message area */}
        <div className="flex-1 overflow-hidden bg-background">
          {selectedChannelId ? (
            <MessageThread channelId={selectedChannelId} channelName={selectedChannelName} />
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <MessageSquare className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="font-medium text-muted-foreground">Seleccioná un canal</p>
                <p className="text-sm text-muted-foreground mt-1">
                  O creá uno nuevo para empezar a chatear
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
