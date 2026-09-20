import {
  EgressClient,
  EncodedFileOutput,
  EncodedFileType,
  S3Upload,
  StreamOutput,
  StreamProtocol,
} from "livekit-server-sdk";

// Recording and streaming out. LiveKit does the work; the files land in our
// own Supabase storage, which speaks S3, so nothing lives with a third
// party longer than the upload takes.

export const recordingReady = Boolean(
  process.env.LIVEKIT_API_KEY &&
    process.env.S3_ENDPOINT &&
    process.env.S3_ACCESS_KEY &&
    process.env.S3_SECRET_KEY
);

export function egressClient() {
  return new EgressClient(
    process.env.LIVEKIT_URL!,
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!
  );
}

function fileOutput(sessionId: string) {
  return new EncodedFileOutput({
    fileType: EncodedFileType.MP4,
    filepath: `${sessionId}/{time}.mp4`,
    output: {
      case: "s3",
      value: new S3Upload({
        endpoint: process.env.S3_ENDPOINT!,
        region: process.env.S3_REGION ?? "us-east-1",
        accessKey: process.env.S3_ACCESS_KEY!,
        secret: process.env.S3_SECRET_KEY!,
        bucket: process.env.S3_BUCKET ?? "recordings",
        forcePathStyle: true,
      }),
    },
  });
}

// One recording of the whole room, laid out the way people saw it.
export async function startRecording(room: string, sessionId: string) {
  const egress = await egressClient().startRoomCompositeEgress(
    room,
    { file: fileOutput(sessionId) },
    { layout: "speaker" }
  );
  return egress.egressId;
}

// Out to YouTube, LinkedIn, Instagram, or several at once.
export async function startStreaming(room: string, urls: string[]) {
  const egress = await egressClient().startRoomCompositeEgress(
    room,
    {
      stream: new StreamOutput({ protocol: StreamProtocol.RTMP, urls }),
    },
    { layout: "speaker" }
  );
  return egress.egressId;
}

export async function stopEgress(egressId: string) {
  await egressClient().stopEgress(egressId);
}