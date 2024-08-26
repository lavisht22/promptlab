import { ErrorResponse, SuccessResponse } from "../_shared/response.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { generate, Version } from "../_shared/generate.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return SuccessResponse("ok");
  }

  try {
    const { prompt_id, version_id, stream, variables }: {
      prompt_id: string;
      version_id: string;
      stream?: boolean;
      variables?: {
        [key: string]: string;
      };
    } = await req
      .json();

    if (!prompt_id || !version_id) {
      return ErrorResponse("prompt_id and version_id are required", 400);
    }

    const before = Date.now();

    // const { data: prompt, error: promptReadError } = await serviceClient.from(
    //   "prompts",
    // ).select(
    //   "id, workspace_id",
    // ).eq(
    //   "id",
    //   prompt_id,
    // ).single();

    // if (promptReadError) {
    //   throw promptReadError;
    // }

    const { data: version, error: versionReadError } = await serviceClient.from(
      "versions",
    ).select("*, providers(id, type, options, keys(value))").eq(
      "id",
      version_id,
    ).eq("prompt_id", prompt_id).single();

    if (versionReadError) {
      throw versionReadError;
    }

    if (!version.providers) {
      return ErrorResponse(
        "No provider has been linked with this prompt. Please link a provider to continue.",
        400,
      );
    }

    if (!version.providers.keys) {
      return ErrorResponse(
        "No API key has been linked with this provider. Please link an API key to continue.",
        400,
      );
    }

    const after = Date.now();

    console.log("Read time", after - before);

    return generate(version as Version, stream, variables);
  } catch (error) {
    console.error(error);
    return ErrorResponse(error.message, 500);
  }
});
