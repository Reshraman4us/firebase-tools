import { ClientResponse, Client } from "../apiv2";
import { cloudAiCompanionOrigin } from "../api";
import {
  CloudAICompanionResponseError,
  CloudAICompanionResponse,
  CloudAICompanionRequest,
  CloudAICompanionInput,
  ClientContext,
  CallCloudAiCompanionRequest,
} from "./types";

const CLOUD_AI_COMPANION_VERSION = "v1";
const CLIENT_CONTEXT_NAME_IDENTIFIER = "firebase_vscode";
const FIREBASE_CHAT_REQUEST_CONTEXT_TYPE_NAME =
  "google.cloud.cloudaicompanion.v1main.FirebaseChatRequestContext";
const FDC_EXPERIENCE_CONTEXT = "/appeco/firebase/firebase-chat/free";
const USER_AUTHOR = "USER";

export function cloudAICompationClient(): Client {
  return new Client({
    urlPrefix: cloudAiCompanionOrigin(),
    apiVersion: CLOUD_AI_COMPANION_VERSION,
    auth: true,
  });
}

export async function callCloudAICompanion(
  client: Client,
  vscodeRequest: CallCloudAiCompanionRequest,
): Promise<ClientResponse<CloudAICompanionResponse | CloudAICompanionResponseError>> {
  console.log("HAROLD before build request");
  const request = buildRequest(vscodeRequest);
    console.log("HAROLD REQUEST in cli IS:", request);

  const res = await client.post<
    CloudAICompanionRequest,
    CloudAICompanionResponse | CloudAICompanionResponseError
  >(`${request.instance}:completeTask`, request);
  console.log("HAROLD:  RESULTS: ", res);
  return res;
}

function buildRequest({
  servicePath,
  naturalLanguageQuery,
  ideContext,
}: CallCloudAiCompanionRequest): CloudAICompanionRequest {
  const { serviceId, projectId } = getServiceParts(servicePath);
  const input: CloudAICompanionInput = {
    messages: [
      {
        author: USER_AUTHOR,
        content: naturalLanguageQuery,
      },
    ],
  };

  const clientContext: ClientContext = {
    name: CLIENT_CONTEXT_NAME_IDENTIFIER,
    // TODO: determine if we should pass vscode version; // version: ideContext.ver, 
    additionalContext: {
      fdcInfo: {
        serviceId,
        serviceName: servicePath,
        requiresQuery: true,
      },
      FIREBASE_CHAT_REQUEST_CONTEXT_TYPE_NAME,
    },
  };

  return {
    instance: toChatResourceName(projectId),
    input,
    clientContext,
    experienceContext: {
      experience: FDC_EXPERIENCE_CONTEXT,
    },
  };
}

function toChatResourceName(projectId: string) {
  return `projects/${projectId}/locations/global/instances/default`;
}

/** Gets service name parts */
interface ServiceParts {
  projectId: string;
  locationId: string;
  serviceId: string;
}
function getServiceParts(name: string): ServiceParts {
  const match = name.match(/projects\/([^\/]*)\/locations\/([^\/]*)\/services\/([^\/]*)/);

  if (!match) {
    throw new Error(`Invalid service name: ${name}`);
  }

  return { projectId: match[1], locationId: match[2], serviceId: match[3] };
}
