import { test } from "node:test";
import assert from "node:assert/strict";
import { login, loginErrorMessage, loginLocation, parseSession, safeReturnPath } from "../src/features/auth/api.ts";
import { createAuthStore } from "../src/features/auth/session.ts";
import { RequestError } from "../src/shared/lib/http.ts";

const credentials = { email: " Review@Example.invalid ", password: " Password with spaces " };
const response = (exp = Math.floor(Date.now() / 1000) + 3600) => ({
  tokenType: "Bearer", expiresIn: "1h",
  token: "eyJhbGciOiJIUzI1NiJ9." + Buffer.from(JSON.stringify({ email: "review@example.invalid", sub: "1", exp })).toString("base64url") + ".fixture",
});

test("login envia POST ao backend, normaliza apenas e-mail e mantém senha fora do estado da sessão", async t => {
  t.mock.method(globalThis, "fetch", async (url: string, options: RequestInit) => {
    assert.equal(url, "/backend/auth/login");
    assert.equal(options.method, "POST");
    assert.equal(options.cache, "no-store");
    assert.equal(new Headers(options.headers).get("Content-Type"), "application/json");
    assert.deepEqual(JSON.parse(String(options.body)), { email: "review@example.invalid", password: credentials.password });
    return Response.json(response());
  });
  const session = await login(credentials, new AbortController().signal);
  assert.equal(session.email, "review@example.invalid");
  assert.equal(Object.hasOwn(session, "password"), false);
});

test("login rejeita respostas malformadas e tokens sem prazo válido antes de iniciar sessão", () => {
  const valid = response();
  const token = (payload: unknown) => ({ ...valid, token: "header." + Buffer.from(JSON.stringify(payload)).toString("base64url") + ".signature" });
  for (const value of [null, {}, { ...valid, tokenType: "Basic" }, { ...valid, token: "opaque" },
    token({ email: "x", exp: 0 }), token({ email: "x", exp: "9999999999" }), token({ exp: 9999999999 }),
    token({ email: "x", exp: Date.now() / 1000 - 1 }), token(null), { ...valid, token: "header.invalid.signature" }])
    assert.throws(() => parseSession(value), error => error instanceof RequestError && error.kind === "format");
  const unicode = "usuário@example.invalid";
  assert.equal(parseSession(token({ email: unicode, exp: Math.floor(Date.now() / 1000) + 5 })).email, unicode);
});

test("mensagens distinguem credenciais, indisponibilidade, conexão e demora sem expor detalhes internos", () => {
  assert.match(loginErrorMessage(new RequestError("http", "SQL password", 401)), /E-mail ou senha incorretos/);
  assert.match(loginErrorMessage(new RequestError("http", "SQL password", 400)), /Confira/);
  assert.match(loginErrorMessage(new RequestError("http", "SQL password", 429)), /Aguarde/);
  for (const status of [500, 502, 503]) {
    const text = loginErrorMessage(new RequestError("http", "SQL password", status, { message: "SQL password" }));
    assert.match(text, /indisponível/);
    assert.doesNotMatch(text, /SQL|password/);
  }
  assert.match(loginErrorMessage(new RequestError("network", "internal")), /conectar/);
  assert.match(loginErrorMessage(new RequestError("timeout", "internal")), /demorou/);
  assert.match(loginErrorMessage(new RequestError("format", "internal")), /inválida/);
});

test("sessão só começa após resposta válida; envio duplicado não faz outra consulta", async t => {
  const store = createAuthStore();
  t.after(store.dispose);
  let resolve!: (value: Response) => void;
  let calls = 0;
  t.mock.method(globalThis, "fetch", () => { calls++; return new Promise<Response>(done => { resolve = done; }); });
  const first = store.signIn(credentials);
  assert.equal(store.getSnapshot().pending, true);
  assert.equal(store.getSnapshot().session, null);
  assert.equal(await store.signIn(credentials), false);
  assert.equal(calls, 1);
  resolve(Response.json(response()));
  assert.equal(await first, true);
  assert.equal(store.getSnapshot().pending, false);
  assert.equal(store.getSnapshot().session?.email, "review@example.invalid");
  const emptyTab = createAuthStore();
  assert.equal(emptyTab.getSnapshot().session, null);
});

test("cancelar ou sair durante o login impede que uma resposta atrasada abra a sessão", async t => {
  for (const action of ["cancelLogin", "logout", "dispose"] as const) {
    const store = createAuthStore();
    let resolve!: (value: Response) => void;
    t.mock.method(globalThis, "fetch", () => new Promise<Response>(done => { resolve = done; }));
    const pending = store.signIn(credentials);
    store[action]();
    resolve(Response.json(response()));
    assert.equal(await pending, false);
    assert.equal(store.getSnapshot().pending, false);
    assert.equal(store.getSnapshot().session, null);
    assert.equal(store.getSnapshot().error, null);
  }
});

test("falha de banco não cria sessão nem marca campos inválidos, e permite nova tentativa", async t => {
  const store = createAuthStore();
  t.after(store.dispose);
  t.mock.method(globalThis, "fetch", async () => Response.json({ message: "connection refused" }, { status: 500 }));
  assert.equal(await store.signIn(credentials), false);
  assert.equal(store.getSnapshot().session, null);
  assert.equal(store.getSnapshot().invalidCredentials, false);
  assert.match(store.getSnapshot().error!, /indisponível/);
  t.mock.method(globalThis, "fetch", async () => Response.json({}, { status: 401 }));
  assert.equal(await store.signIn(credentials), false);
  assert.equal(store.getSnapshot().invalidCredentials, true);
  t.mock.method(globalThis, "fetch", async () => Response.json(response()));
  assert.equal(await store.signIn(credentials), true);
  assert.equal(store.getSnapshot().error, null);
});

test("sessão expira automaticamente e o retorno de uma aba suspensa verifica o prazo", async t => {
  t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: 1_800_000_000_000 });
  const store = createAuthStore();
  t.after(store.dispose);
  t.mock.method(globalThis, "fetch", async () => Response.json(response(Math.floor(Date.now() / 1000) + 2)));
  await store.signIn(credentials);
  t.mock.timers.tick(2000);
  assert.equal(store.getSnapshot().session, null);
  assert.equal(store.getSnapshot().notice, "expired");
  await store.signIn(credentials);
  t.mock.timers.setTime(Date.now() + 3000);
  assert.equal(store.checkExpiration(), null);
  assert.equal(store.getSnapshot().notice, "expired");
});

test("consulta protegida usa Bearer, 403 preserva a sessão e 401 solicita nova entrada", async t => {
  const store = createAuthStore();
  t.after(store.dispose);
  t.mock.method(globalThis, "fetch", async () => Response.json(response()));
  await store.signIn(credentials);
  const token = store.getSnapshot().session!.token;
  t.mock.method(globalThis, "fetch", async (url: string, options: RequestInit) => {
    assert.equal(url, "/backend/api/users/1");
    assert.equal(new Headers(options.headers).get("Authorization"), "Bearer " + token);
    return Response.json({ id_user: 1 });
  });
  assert.deepEqual(await store.request("/api/users/1"), { id_user: 1 });
  await assert.rejects(store.request("https://external.invalid/api/users"), /Caminho/);
  t.mock.method(globalThis, "fetch", async () => Response.json({}, { status: 403 }));
  await assert.rejects(store.request("/api/users/2"), error => error instanceof RequestError && error.status === 403);
  assert.ok(store.getSnapshot().session);
  t.mock.method(globalThis, "fetch", async () => { throw new TypeError("Failed to fetch"); });
  await assert.rejects(store.request("/api/users/1"), error => error instanceof RequestError && error.kind === "network");
  assert.ok(store.getSnapshot().session);
  t.mock.method(globalThis, "fetch", async () => Response.json({}, { status: 401 }));
  await assert.rejects(store.request("/api/users/1"), error => error instanceof RequestError && error.status === 401);
  assert.equal(store.getSnapshot().session, null);
  assert.equal(store.getSnapshot().notice, "expired");
  await assert.rejects(store.request("/api/users/1"), error => error instanceof RequestError && error.status === 401);
});

test("resposta de uma sessão anterior não encerra nem fornece dados à sessão nova", async t => {
  const store = createAuthStore();
  t.after(store.dispose);
  for (const status of [200, 401]) {
    t.mock.method(globalThis, "fetch", async () => Response.json(response()));
    await store.signIn(credentials);
    let resolve!: (value: Response) => void;
    t.mock.method(globalThis, "fetch", () => new Promise<Response>(done => { resolve = done; }));
    const oldRequest = store.request("/api/users/1");
    store.logout();
    t.mock.method(globalThis, "fetch", async () => Response.json(response()));
    await store.signIn(credentials);
    const current = store.getSnapshot().session;
    resolve(Response.json({}, { status }));
    await assert.rejects(oldRequest);
    assert.equal(store.getSnapshot().session, current);
    assert.equal(store.getSnapshot().notice, null);
  }
});

test("retorno do login preserva filtros e recusa redirecionamento externo", () => {
  const next = "/dashboard?aba=administracao&configuracao=acesso&pais=Brasil";
  assert.equal(safeReturnPath(next), next);
  assert.equal(new URL(loginLocation(next, true), "https://local.invalid").searchParams.get("retorno"), next);
  for (const value of ["https://external.invalid/dashboard", "//external.invalid/dashboard", "\\\\external.invalid/dashboard", "javascript:alert(1)", "/login", "/dashboard/../login"])
    assert.equal(safeReturnPath(value), "/dashboard?aba=administracao");
});
