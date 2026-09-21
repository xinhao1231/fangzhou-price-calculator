const chatAccount = (() => {
  const $ = (id) => document.getElementById(id);
  const base = (window.FANGZHOU_CHAT_CONFIG?.apiBase || "").replace(/\/$/, "");
  let token = "";
  let user = null;
  let mode = base ? "shared" : "personal";
  let pending = false;
  const notice = (text) => { $("chatAccountStatus").textContent = text; };
  function changed() { window.dispatchEvent(new Event("chat-account-change")); }
  function render() {
    if (!user) {
      $("chatUserList").replaceChildren();
      $("chatAccountPanel").querySelectorAll('input[type="password"]').forEach((input) => { input.value = ""; });
    }
    $("sharedAccessTab").setAttribute("aria-pressed", String(mode === "shared"));
    $("personalAccessTab").setAttribute("aria-pressed", String(mode === "personal"));
    $("sharedAccountView").hidden = mode !== "shared";
    $("chatLoginForm").hidden = Boolean(user) || !base;
    $("chatSignedIn").hidden = !user;
    $("chatAdminPanel").hidden = user?.role !== "admin";
    $("chatSetupDetails").hidden = Boolean(user) || !base;
    $("chatServerState").textContent = base ? "授权账号使用管理员的共享额度。问题、上传图片和相关产品资料会发送给 DeepSeek。" : "共享账号服务尚未部署。配置完成后，管理员可以在这里授权用户。当前仍可使用个人密钥。";
    $("chatAccountLabel").textContent = user?.username || "账号与连接";
    $("chatAccountState").textContent = user ? (user.role === "admin" ? "管理员" : "已授权") : "未登录";
  }
  async function request(path, options = {}) {
    if (!base) throw new Error("共享账号服务尚未部署。");
    if (!/^https:\/\//.test(base) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(base)) throw new Error("账号服务必须使用HTTPS安全连接。");
    let response;
    try {
      response = await fetch(`${base}/api${path}`, { method: options.method || "GET", credentials: "omit", referrerPolicy: "no-referrer",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: options.body ? JSON.stringify(options.body) : undefined, signal: options.signal || AbortSignal.timeout(120000) });
    } catch (error) {
      if (options.signal?.aborted) throw error;
      throw new Error("无法连接账号服务，请检查网络或联系管理员。");
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 && token) { token = ""; user = null; render(); changed(); }
      throw new Error(data.error || "账号服务请求失败，请稍后重试。");
    }
    return data;
  }
  async function refresh() {
    if (!token) return;
    const result = await request("/me");
    user = result.user;
    $("chatUserSummary").textContent = `${user.username} · 今日调用 ${result.used} / ${user.dailyLimit}`;
    render();
    if (user.role === "admin") await listUsers();
  }
  async function listUsers() {
    const data = await request("/users");
    $("chatUserList").replaceChildren();
    for (const account of data.users) {
      const row = document.createElement("div");
      row.className = "chat-user-row";
      const title = document.createElement("strong");
      title.textContent = account.username;
      const detail = document.createElement("span");
      detail.textContent = `${account.role === "admin" ? "管理员" : account.active ? "已启用" : "已停用"} · 今日 ${account.used}/${account.dailyLimit}`;
      row.append(title, detail);
      if (account.role !== "admin") {
        const toggle = document.createElement("button");
        toggle.className = "secondary-button";
        toggle.textContent = account.active ? "停用" : "启用";
        toggle.addEventListener("click", () => action(async () => { await request(`/users/${account.id}`, { method: "PATCH", body: { active: !account.active } }); await listUsers(); notice("账号状态已更新，旧登录已失效。"); }));
        const edit = document.createElement("details");
        const summary = document.createElement("summary");
        summary.textContent = "修改额度 / 重置密码";
        const form = document.createElement("form");
        form.method = "post";
        form.className = "chat-account-form";
        const limit = document.createElement("input");
        limit.type = "number"; limit.min = "1"; limit.max = "2000"; limit.required = true; limit.value = account.dailyLimit;
        const password = document.createElement("input");
        password.type = "password"; password.minLength = 12; password.maxLength = 128; password.autocomplete = "new-password";
        for (const [input, text] of [[limit, "每日调用上限"], [password, "新密码（留空不修改）"]]) {
          const label = document.createElement("label"); label.className = "field";
          const span = document.createElement("span"); span.textContent = text; label.append(span, input); form.append(label);
        }
        const save = document.createElement("button"); save.type = "submit"; save.className = "primary-button"; save.textContent = "保存";
        form.append(save);
        form.addEventListener("submit", (event) => { event.preventDefault(); action(async () => {
          await request(`/users/${account.id}`, { method: "PATCH", body: { dailyLimit: Number(limit.value), ...(password.value ? { password: password.value } : {}) } });
          password.value = ""; await listUsers(); notice("已保存，请让该用户重新登录。");
        }); });
        edit.append(summary, form); row.append(toggle, edit);
      }
      $("chatUserList").append(row);
    }
  }
  async function action(fn) {
    if (pending) return;
    pending = true; notice("正在处理…");
    try { await fn(); } catch (error) { notice(error.message); }
    finally { pending = false; }
  }
  for (const [id, value] of [["sharedAccessTab", "shared"], ["personalAccessTab", "personal"]]) $(id).addEventListener("click", () => {
    mode = value; render(); changed();
  });
  $("chatLoginForm").addEventListener("submit", (event) => { event.preventDefault(); action(async () => {
    const result = await request("/login", { method: "POST", body: { username: $("chatUsername").value.trim(), password: $("chatPassword").value } });
    token = result.token; user = result.user; $("chatPassword").value = "";
    render(); changed(); await refresh(); notice("登录成功，可以开始提问。");
  }); });
  $("chatLogout").addEventListener("click", () => action(async () => {
    await request("/logout", { method: "POST", body: {} });
    token = ""; user = null; render(); changed(); notice("已退出登录。");
  }));
  $("chatCreateUser").addEventListener("submit", (event) => { event.preventDefault(); action(async () => {
    const data = Object.fromEntries(new FormData(event.target)); data.dailyLimit = Number(data.dailyLimit);
    await request("/users", { method: "POST", body: data }); event.target.reset(); await listUsers(); notice("已创建授权账号。请通过私密渠道把账号和初始密码交给使用者。");
  }); });
  $("chatPasswordForm").addEventListener("submit", (event) => { event.preventDefault(); action(async () => {
    await request("/password", { method: "POST", body: Object.fromEntries(new FormData(event.target)) });
    event.target.reset(); token = ""; user = null; render(); changed(); notice("密码已更新，所有设备已退出，请重新登录。");
  }); });
  $("chatSetupForm").addEventListener("submit", (event) => { event.preventDefault(); action(async () => {
    await request("/setup", { method: "POST", body: Object.fromEntries(new FormData(event.target)) });
    event.target.reset(); $("chatSetupDetails").open = false; notice("管理员创建成功，请用刚才的账号密码登录。");
  }); });
  $("chatAccountPanel").querySelectorAll("form").forEach((form) => { form.method = "post"; });
  render();
  return { get mode() { return mode; }, get ready() { return Boolean(token); }, request,
    refresh: () => action(refresh), clearNotice: () => notice("") };
})();
