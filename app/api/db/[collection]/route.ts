import { NextResponse } from "next/server";
import {
  DB_COLLECTIONS,
  type DbCollection,
} from "@/lib/json-db/schema";
import { readCollection, writeCollection } from "@/lib/json-db/server";

type RouteContext = {
  params: Promise<{ collection: string }>;
};

function isCollection(value: string): value is DbCollection {
  return DB_COLLECTIONS.includes(value as DbCollection);
}

export async function GET(_request: Request, context: RouteContext) {
  const { collection } = await context.params;
  if (!isCollection(collection)) {
    return NextResponse.json({ error: "Unknown collection." }, { status: 404 });
  }
  return NextResponse.json(readCollection(collection));
}

export async function PUT(request: Request, context: RouteContext) {
  const { collection } = await context.params;
  if (!isCollection(collection)) {
    return NextResponse.json({ error: "Unknown collection." }, { status: 404 });
  }

  const body = await request.json();
  if (!Array.isArray(body)) {
    return NextResponse.json(
      { error: "Collection payload must be an array." },
      { status: 400 },
    );
  }

  writeCollection(collection, body);
  return NextResponse.json({ ok: true });
}
