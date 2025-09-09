import type { ChatRequestOptions, ChatStatus } from "ai";
import { CopyIcon, RefreshCcwIcon } from "lucide-react";
import { Fragment } from "react";
import type { ChatUIMessage } from "@/lib/ai/types";
import { Action, Actions } from "../ai-elements/actions";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "../ai-elements/conversation";
import { Loader } from "../ai-elements/loader";
import { Message, MessageContent } from "../ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "../ai-elements/reasoning";
import { Response } from "../ai-elements/response";

export const ChatConversation = ({
  messages,
  regenerate,
  status,
  error,
}: {
  messages: ChatUIMessage[];
  regenerate: ({
    messageId,
    ...options
  }?: {
    messageId?: string;
  } & ChatRequestOptions) => Promise<void>;
  status: ChatStatus;
  error: Error | undefined;
}) => {
  return (
    <Conversation>
      <ConversationContent>
        {messages.map((message) => (
          <div key={message.id}>
            {message.parts.map((part, i) => {
              switch (part.type) {
                case "text":
                  return (
                    <Fragment key={`${message.id}-${i}`}>
                      <Message from={message.role}>
                        <MessageContent>
                          <Response>{part.text}</Response>
                        </MessageContent>
                      </Message>
                      {message.role === "assistant" &&
                        i === message.parts.length - 1 && (
                          <Actions className="mt-2">
                            <Action
                              onClick={() => regenerate()}
                              label="Повторить"
                            >
                              <RefreshCcwIcon className="size-3" />
                            </Action>
                            <Action
                              onClick={() =>
                                navigator.clipboard.writeText(part.text)
                              }
                              label="Копировать"
                            >
                              <CopyIcon className="size-3" />
                            </Action>
                          </Actions>
                        )}
                    </Fragment>
                  );
                // case "tool-call": {
                //   const toolName = part.type.replace("tool-", "");
                //   const input = part.input as { title?: string };
                //   return (
                //     <Message key={`${message.id}-${i}`} from={message.role}>
                //       <MessageContent>
                //         <div className="text-sm text-gray-600">
                //           {toolName === "createDocument" &&
                //             "🔧 Создаю документ: "}
                //           {toolName === "updateDocument" &&
                //             "✏️ Обновляю документ: "}
                //           <strong>{input.title || "документ"}</strong>
                //         </div>
                //       </MessageContent>
                //     </Message>
                //   );
                // }
                case "reasoning":
                  return (
                    <Reasoning
                      key={`${message.id}-${i}`}
                      className="w-full"
                      isStreaming={
                        status === "streaming" &&
                        i === message.parts.length - 1 &&
                        message.id === messages.at(-1)?.id
                      }
                    >
                      <ReasoningTrigger />
                      <ReasoningContent>{part.text}</ReasoningContent>
                    </Reasoning>
                  );
                default:
                  return null;
              }
            })}
          </div>
        ))}
        {error && <div>Произошла ошибка: {error.message}</div>}
        {status === "submitted" && <Loader />}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
};
