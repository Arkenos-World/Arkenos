"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

const POSTHOG_KEY = "phc_EpJEHZU7Hmnyl8bhhefL4IT6ETktgXYlwO9D6PIQ2A6";
const POSTHOG_HOST = "https://us.i.posthog.com";

async function fetchInstanceId(): Promise<string | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    const res = await fetch(`${apiUrl}/settings/instance-id`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.instance_id || null;
  } catch {
    return null;
  }
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_TELEMETRY === "false") return;

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: true,
      capture_pageleave: true,
      persistence: "localStorage",
      autocapture: false,
      person_profiles: "identified_only",
    });

    // Fetch instance ID from backend and register as super property
    fetchInstanceId().then((instanceId) => {
      if (instanceId) {
        posthog.register({ instance_id: instanceId });
        posthog.capture("instance_started", { instance_id: instanceId });
      }
    });
  }, []);

  if (process.env.NEXT_PUBLIC_TELEMETRY === "false") {
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
