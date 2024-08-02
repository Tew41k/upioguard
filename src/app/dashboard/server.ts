"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { project_admins, project, project_executions, project_api_keys, admins, ProjectApiKey, Project, users, Key } from "@/db/schema";
import { getRandomArbitrary, randomString } from "@/lib/utils";
import { count, eq, sql } from "drizzle-orm";

function generate_project_id() {
  return randomString(getRandomArbitrary(15,20));
}

async function validate_admin_account() {
  const session = await auth();

  if (session?.user?.id === undefined) {
    throw new Error("Unauthorized");
  }

  const admins_data = await db.select().from(admins).where(eq(admins.discord_id, session.user.id));
  if (admins_data.length == 0) {
    throw new Error("Unauthorized");
  }
}

async function validate_permissions(project_id: string) {
  const session = await auth();

  if (session?.user?.id === undefined) {
    throw new Error("Unauthorized");
  }

  await validate_admin_account();

  const project_data = await db.select().from(project).where(eq(project.project_id, project_id));

  if (project_data.length == 0) {
    throw new Error("Project not found");
  }

  const project_admins_data = await db.select().from(project_admins).where(sql`${project_admins.project_id} = ${project_id} AND ${project_admins.discord_id} = ${session.user.id}`);
  if (project_admins_data.length == 0) {
    throw new Error("Unauthorized");
  }

  return project_data[0];
}

export async function add_project_admin(project_id: string) {
  const session = await auth();
  await validate_permissions(project_id);

  if (session?.user?.id === undefined) {
    throw new Error("Unauthorized");
  }

  await db.insert(project_admins).values({
    discord_id: session.user.id,
    project_id: project_id,
  })
}

export async function get_api_keys_from_projects_owned_by_user() {
  const session = await auth();

  if (session?.user?.id === undefined) {
    throw new Error("Unauthorized");
  }

  await validate_admin_account();

  const project_data = await db.select().from(project_api_keys).where(eq(project_api_keys.creator_id, session.user.id));
  return project_data;
}

export async function delete_api_keys(api_key: ProjectApiKey[]) {
  const session = await auth();

  if (session?.user?.id === undefined) {
    throw new Error("Unauthorized");
  }

  for (const key of api_key) {
    await db.delete(project_api_keys).where(sql`${project_api_keys.api_key} = ${key.api_key} AND ${project_api_keys.project_id} = ${key.project_id}`);
  }
}

export async function create_api_key(project_id: string, name: string) {
  const session = await auth();

  if (session?.user?.id === undefined) {
    throw new Error("Unauthorized");
  }

  if (name == "" || project_id == "") {
    throw new Error("Missing required fields");
  }

  await validate_permissions(project_id);

  const api_key = "ugt_"+randomString(getRandomArbitrary(25,30));

  await db.insert(project_api_keys).values({
    project_id: project_id,
    name: name,
    api_key: api_key,
    creator_id: session.user.id,
  })

  return api_key;
}

export async function generate_project(name: string, description: string, type: "paid" | "free-paywall", discord_link: string, github_owner: string, github_repo: string, github_path: string, github_token: string) {
  const session = await auth();

  if (session?.user?.id === undefined) {
    throw new Error("Unauthorized");
  }

  await validate_admin_account();

  const generated_project_id = generate_project_id();

  await db.insert(project_admins).values({
    discord_id: session.user.id,
    project_id: generated_project_id,
  })

  await db.insert(project).values({
    name: name,
    project_id: generated_project_id,
    description: description,
    author_id: session.user.id,
    github_owner: github_owner,
    github_repo: github_repo,
    github_path: github_path,
    github_token: github_token,
    discord_link: discord_link,
    project_type: type,
  })

  return {
    name: name,
    project_id: generated_project_id,
    description: description,
    author_id: session.user.id,
    github_owner: github_owner,
    github_repo: github_repo,
    github_path: github_path,
    github_token: github_token,
    discord_link: discord_link,
    project_type: type,
  }
}

export async function get_projects_owned_by_user() {
  const session = await auth();

  if (session?.user?.id === undefined) {
    throw new Error("Unauthorized");
  }

  await validate_admin_account();

  const project_data = await db.select().from(project).where(eq(project.author_id, session.user.id));
  return project_data;
}

export async function get_project(project_id: string) {
  const session = await auth();

  if (session?.user?.id === undefined) {
    throw new Error("Unauthorized");
  }

  await validate_permissions(project_id);

  const project_data = await db.select().from(project).where(sql`${project.project_id} = ${project_id}`);
  return project_data[0];
}

export async function get_total_executions(project_id: string) {
  const session = await auth();

  if (session?.user?.id === undefined) {
    throw new Error("Unauthorized");
  }

  await validate_permissions(project_id);

  const project_data = await db.select( { count: count() }).from(project_executions).where(sql`${project_executions.project_id} = ${project_id}`);
  return project_data;
}

export async function fetch_project_executions(project_id: string) {
  const session = await auth();

  if (session?.user?.id === undefined) {
    throw new Error("Unauthorized");
  }

  await validate_permissions(project_id);

  const project_data = await db.select().from(project_executions).where(sql`${project_executions.project_id} = ${project_id}`);

  return project_data;
}

export async function update_project(project_id: string, data: Project) {
  const session = await auth();

  if (session?.user?.id === undefined) {
    throw new Error("Unauthorized");
  }

  await validate_permissions(project_id);

  await db.update(project).set(data).where(eq(project.project_id, project_id));
}

export async function delete_project(project_id: string) {
  const session = await auth();

  if (session?.user?.id === undefined) {
    throw new Error("Unauthorized");
  }

  await validate_permissions(project_id);

  await db.delete(project).where(eq(project.project_id, project_id));
  await db.delete(project_executions).where(eq(project_executions.project_id, project_id));
  await db.delete(project_api_keys).where(eq(project_api_keys.project_id, project_id));
  await db.delete(project_admins).where(eq(project_admins.project_id, project_id));
  await db.delete(users).where(eq(users.project_id, project_id));
}

export async function get_script_keys(project_id: string) {
  const session = await auth();

  if (session?.user?.id === undefined) {
    throw new Error("Unauthorized");
  }

  await validate_permissions(project_id);

  const user_data = await db.select().from(users).where(eq(users.project_id, project_id));
  return user_data;
}

export async function delete_script_key(project_id: string, key: string) {
  const session = await auth();

  if (session?.user?.id === undefined) {
    throw new Error("Unauthorized");
  }

  await validate_permissions(project_id);

  await db.delete(users).where(sql`${users.project_id} = ${project_id} AND ${users.key} = ${key}`);
}

export async function create_script_key_raw(project_id: string, data: Key) {
  const session = await auth();

  if (session?.user?.id === undefined) {
    throw new Error("Unauthorized");
  }

  await validate_permissions(project_id);

  await db.insert(users).values({
    project_id: project_id,
    key: data.key,
    key_expires: data.key_expires,
    key_type: data.key_type,
    discord_id: data.discord_id,
    username: data.username,
    note: data.note,
    hwid: data.hwid,
    executor: data.executor,
  })
}

export async function reset_hwid(project_id: string, key: string) {
  const session = await auth();

  if (session?.user?.id === undefined) {
    throw new Error("Unauthorized");
  }

  await validate_permissions(project_id);

  await db.update(users).set({ hwid: null, executor: null }).where(eq(users.key, key));
}

// add export when its implemented
async function ban_hwid(project_id: string, key: string) {
  // TODO: implement
}

export async function modify_key_note(project_id: string, key: string, note: string) {
  const session = await auth();

  if (session?.user?.id === undefined) {
    throw new Error("Unauthorized");
  }

  await validate_permissions(project_id);

  if (note.trim() == "") {
    await db.update(users).set({ note: null }).where(eq(users.key, key));
    return;
  }

  await db.update(users).set({ note: note }).where(eq(users.key, key));
}

export async function delete_account() {
  const session = await auth();

  if (session?.user?.id === undefined) {
    throw new Error("Unauthorized");
  }

  await validate_admin_account();
  
  const project_data = await db.select().from(project).where(eq(project.author_id, session.user.id));
  for (const project of project_data) {
    await db.delete(project_executions).where(eq(project_executions.project_id, project.project_id));
    await db.delete(project_api_keys).where(eq(project_api_keys.project_id, project.project_id));
    await db.delete(project_admins).where(eq(project_admins.project_id, project.project_id));
    await db.delete(users).where(eq(users.project_id, project.project_id));
  }
  
  await db.delete(admins).where(eq(admins.discord_id, session.user.id));
}