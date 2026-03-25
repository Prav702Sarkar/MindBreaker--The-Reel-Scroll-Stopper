import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function ANY(req: NextRequest, props: { params: Promise<{ path?: string[] }> }) {
  const { userId, getToken } = await auth();

  // Extract path and query string to forward
  const params = await props.params;
  const path = params?.path ? params.path.join("/") : "";
  const query = req.nextUrl.search;
  const targetUrl = `${BACKEND_URL}/${path}${query}`;

  // Get the auth token if we want to pass it to the backend securely
  const token = await getToken();

  const headers = new Headers(req.headers);
  headers.set("Host", new URL(BACKEND_URL).host);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Next.js body reading
  let body = undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.arrayBuffer();
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      redirect: "manual",
    });

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    console.error("Gateway error proxying to backend:", error);
    return NextResponse.json({ error: "Gateway Error" }, { status: 502 });
  }
}

// Map Next.js required methods to the ANY handler
export const GET = ANY;
export const POST = ANY;
export const PUT = ANY;
export const PATCH = ANY;
export const DELETE = ANY;
export const OPTIONS = ANY;