import {
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  getKeyValue,
} from "@nextui-org/react";
import { Version } from "./page";
import {
  useMemo,
  useCallback,
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";
import { stream } from "fetch-event-stream";
import supabase from "utils/supabase";
import { Json } from "supabase/functions/types";
import toast from "react-hot-toast";
import { addEvaluation } from "utils/evaluations";

export default function Evaluate({
  activeVersionId,
  versions,
  setVersions,
}: {
  activeVersionId: string | null;
  versions: Version[];
  setVersions: Dispatch<SetStateAction<Version[]>>;
}) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

  const activeVersion = useMemo(() => {
    return versions.find((v) => v.id === activeVersionId) || null;
  }, [activeVersionId, versions]);

  useEffect(() => {
    if (activeVersion) {
      setEvaluations(activeVersion.evaluations as unknown as Evaluation[]);
    }
  }, [activeVersion]);

  const columns = useMemo(() => {
    const allVariables = new Set<string>();
    evaluations.forEach((evaluation) => {
      Object.keys(evaluation.variables).forEach((key) => allVariables.add(key));
    });
    return [
      ...Array.from(allVariables).map((variable) => ({
        key: variable,
        label: `{{${variable}}}`,
      })),
      { key: "response", label: "Response" },
    ];
  }, [evaluations]);

  const rows = useMemo(
    () =>
      evaluations.map((evaluation, index) => ({
        key: index.toString(),
        ...evaluation.variables,
        response: evaluation.response || null, // Change '-' to null
      })),
    [evaluations]
  );

  const handleRunEvaluation = useCallback(
    async (rowIndex: number) => {
      if (!activeVersion) return;

      const evaluation = evaluations[rowIndex];
      const variables = new Map(Object.entries(evaluation.variables));

      try {
        const response = await stream(
          "https://glzragfkzcvgpipkgyrq.supabase.co/functions/v1/run",
          {
            method: "POST",
            body: JSON.stringify({
              prompt_id: activeVersion.prompt_id,
              version_id: activeVersion.id,
              stream: true,
              variables: Object.fromEntries(variables),
            }),
            headers: {
              Authorization: `Bearer ${
                import.meta.env.VITE_SUPABASE_ANON_KEY! || ""
              }`,
            },
          }
        );

        let responseText = "";

        for await (const event of response) {
          if (!event.data) {
            continue;
          }

          const data = JSON.parse(event.data) as {
            delta: {
              content: string | null;
            };
          };

          responseText += data.delta.content || "";

          // Update the state immediately for each chunk
          setEvaluations((prevEvaluations) => {
            const updatedEvaluations = [...prevEvaluations];
            updatedEvaluations[rowIndex] = {
              ...updatedEvaluations[rowIndex],
              response: responseText,
            };
            return updatedEvaluations;
          });
        }

        // Update the database after streaming is complete
        const updatedEvaluations = addEvaluation(evaluations, {
          variables: evaluation.variables,
          response: responseText,
          created_at: new Date().toISOString(),
        });

        // Update the database
        const { data, error } = await supabase
          .from("versions")
          .update({
            evaluations: updatedEvaluations as unknown as Json,
          })
          .eq("id", activeVersion.id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        setVersions((prev) =>
          prev.map((v) => (v.id === activeVersion.id ? data : v))
        );
      } catch (error) {
        console.error("Error running evaluation:", error);
        toast.error("Oops! Something went wrong while running the evaluation.");
      }
    },
    [activeVersion, evaluations, setVersions]
  );

  return (
    <>
      <div className="flex-1 overflow-hidden flex flex-col ">
        <div className="flex-1 overflow-y-auto relative">
          <Table aria-label="Evaluations table" radius="none" shadow="none">
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn key={column.key}>{column.label}</TableColumn>
              )}
            </TableHeader>
            <TableBody items={rows}>
              {(item) => (
                <TableRow key={item.key}>
                  {(columnKey) => (
                    <TableCell>
                      {columnKey === "response" && item[columnKey] === null ? (
                        <Button
                          color="primary"
                          variant="bordered"
                          size="sm"
                          onClick={() => handleRunEvaluation(Number(item.key))}
                        >
                          Run
                        </Button>
                      ) : (
                        getKeyValue(item, columnKey) || "-"
                      )}
                    </TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex items-center absolute right-3 top-0 h-12">
        <Button size="sm" color="primary">
          Run all
        </Button>
      </div>
    </>
  );
}
