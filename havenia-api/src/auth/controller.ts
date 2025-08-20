// src/auth/controller.ts
import { z } from "zod";
import type { Request, Response } from "express";
import { query } from "../db";
import { hashPassword, verifyPassword, signJwt } from "./util";
import type { AuthedRequest } from "./middleware";
import { validate } from "../lib/validation";

const RegisterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const LoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export async function register(req: Request, res: Response) {
  const parsed = validate(RegisterSchema, req.body);
  if (!parsed.ok) return res.status(422).json({ error: parsed.error });

  const { name, email, password } = parsed.data;

  try {
    // Check if email exists
    const { rows: existing } = await query<{ id: string }>(
      `SELECT id FROM users WHERE email = :email LIMIT 1`,
      [{ name: "email", value: email }]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: { message: "Email already in use" } });
    }

    const password_hash = await hashPassword(password);

    const { rows } = await query<{
      id: string;
      name: string;
      email: string;
      role: string | null;
    }>(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES (:name, :email, :password_hash, 'user')
       RETURNING id, name, email, role`,
      [
        { name: "name", value: name },
        { name: "email", value: email },
        { name: "password_hash", value: password_hash },
      ]
    );

    const user = rows[0];
    const token = signJwt({ id: user.id, email: user.email, role: user.role ?? "user" });

    return res.status(201).json({ token, user });
  } catch (e: any) {
    return res.status(500).json({ error: { message: e.message } });
  }
}

export async function login(req: Request, res: Response) {
  const parsed = validate(LoginSchema, req.body);
  if (!parsed.ok) return res.status(422).json({ error: parsed.error });

  const { email, password } = parsed.data;

  try {
    const { rows } = await query<{
      id: string;
      email: string;
      name: string | null;
      password_hash: string | null;
      role: string | null;
    }>(
      `SELECT id, email, name, password_hash, role
       FROM users
       WHERE email = :email
       LIMIT 1`,
      [{ name: "email", value: email }]
    );

    const user = rows[0];
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: { message: "Invalid email or password" } });
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: { message: "Invalid email or password" } });
    }

    const token = signJwt({ id: user.id, email: user.email, role: user.role ?? "user" });
    const { password_hash, ...safe } = user;

    return res.json({ token, user: safe });
  } catch (e: any) {
    return res.status(500).json({ error: { message: e.message } });
  }
}

export async function me(req: AuthedRequest, res: Response) {
  try {
    const { rows } = await query<{
      id: string;
      email: string;
      name: string | null;
      role: string | null;
    }>(
      `SELECT id, email, name, role
       FROM users
       WHERE id = :id::uuid
       LIMIT 1`,
      [{ name: "id", value: req.user!.id }]
    );

    const user = rows[0];
    if (!user) return res.status(404).json({ error: { message: "User not found" } });

    return res.json({ user });
  } catch (e: any) {
    return res.status(500).json({ error: { message: e.message } });
  }
}