import { Button, cn } from "@nextui-org/react";
import { LuInfo } from "react-icons/lu";
import { z } from "zod";
import VariablesList from "./variables-list";
import ReactTextareaAutosize from "react-textarea-autosize";

export const SystemMessageSchema = z.object({
  role: z.literal("system"),
  content: z.string(),
});

type SystemMessage = z.infer<typeof SystemMessageSchema>;

export default function SystemMessage({
  value,
  onValueChange,
  isInvalid,
}: {
  value: SystemMessage;
  onValueChange: (value: SystemMessage) => void;
  isInvalid?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative w-full inline-flex tap-highlight-transparent shadow-sm px-3 border-medium border-default-200 hover:border-default-400 rounded-medium flex-col !duration-150 focus-within:!border-primary transition-all motion-reduce:transition-none py-2",
        isInvalid && "!border-danger-400"
      )}
    >
      <label htmlFor="system" className="block text-xs font-medium mb-2">
        SYSTEM
      </label>

      <ReactTextareaAutosize
        className="outline-none w-full text-sm resize-none mb-4"
        placeholder="Set a system prompt"
        minRows={1}
        maxRows={100000}
        value={value.content}
        onChange={(e) =>
          onValueChange({
            ...value,
            content: e.target.value,
          })
        }
      />
      <VariablesList text={value.content} />
      <div className="absolute top-0 right-0">
        <Button variant="light" size="sm" isIconOnly radius="full">
          <LuInfo className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
