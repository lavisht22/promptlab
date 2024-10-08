import { Button, cn } from "@nextui-org/react";
import { LuTrash2 } from "react-icons/lu";
import ReactTextareaAutosize from "react-textarea-autosize";
import { z } from "zod";
import VariablesList from "./variables-list";

const TextPartSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});

const ImagePartSchema = z.object({
  type: z.literal("image_url"),
  image_url: z.object({
    url: z.string(),
    detail: z.enum(["auto", "low", "high"]),
  }),
});

export const UserMessageSchema = z.object({
  role: z.literal("user"),
  content: z.array(z.union([TextPartSchema, ImagePartSchema])),
});

type UserMessage = z.infer<typeof UserMessageSchema>;

export default function UserMessage({
  value,
  onValueChange,
  isInvalid,
  onRemove,
  variableValues,
  openVariablesDialog,
}: {
  value: UserMessage;
  onValueChange: (value: UserMessage) => void;
  isInvalid?: boolean;
  onRemove: () => void;
  variableValues: Map<string, string>;
  openVariablesDialog: () => void;
}) {
  return (
    <div
      className={cn(
        "relative w-full inline-flex tap-highlight-transparent shadow-sm px-3 rounded-medium flex-col !duration-150  transition-all motion-reduce:transition-none py-2 bg-default-100 hover:bg-default-200 focus-within:!bg-default-100",
        isInvalid &&
          "!bg-danger-50 hover:!bg-danger-50 focus-within:!bg-danger-50"
      )}
    >
      <label htmlFor="system" className="block text-xs font-medium mb-2">
        USER
      </label>

      {value.content.map((part, index) => {
        if (part.type === "text") {
          return (
            <div key={index}>
              <ReactTextareaAutosize
                className="outline-none w-full text-sm resize-none mb-4 bg-transparent"
                placeholder="Enter user message..."
                value={part.text}
                onChange={(e) => {
                  const newContent = [...value.content];
                  newContent[index] = { type: "text", text: e.target.value };
                  onValueChange({
                    ...value,
                    content: newContent,
                  });
                }}
                minRows={3}
                maxRows={100000}
              />
              <VariablesList
                text={part.text}
                variableValues={variableValues}
                openVariablesDialog={openVariablesDialog}
              />
            </div>
          );
        }

        if (part.type === "image_url") {
          return <div key={index}>Coming soon...</div>;
        }
      })}

      <div className="absolute top-0 right-0">
        <Button
          variant="light"
          size="sm"
          isIconOnly
          radius="full"
          onPress={onRemove}
        >
          <LuTrash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
