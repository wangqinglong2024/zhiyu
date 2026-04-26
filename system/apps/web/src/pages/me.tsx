import { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Container,
  HStack,
  Input,
  Label,
  PageShell,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  ThemeMenu,
  VStack,
  toast,
} from '@zhiyu/ui';
import { useT } from '@zhiyu/i18n/client';
import { auth, me } from '../lib/api.js';
import { navigate, useAuth } from '../lib/auth-store.js';

const errMsg = (e: unknown): string => {
  const err = e as { message?: string; body?: { error?: string } } | undefined;
  return err?.body?.error ?? err?.message ?? 'unknown';
};

function AvatarChip({ src, name }: { src?: string; name: string }): JSX.Element {
  const initial = (name?.trim()?.[0] ?? '?').toUpperCase();
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="h-16 w-16 rounded-full object-cover ring-2 ring-border-subtle"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-amber-500 text-h2 font-semibold text-white">
      {initial}
    </div>
  );
}

function MeHeader({ active }: { active: 'overview' | 'edit' | 'settings' | 'security' | 'data' }): JSX.Element {
  const { t } = useT(['me', 'common']);
  return (
    <header className="border-b border-border-subtle">
      <Container>
        <HStack className="h-16 justify-between">
          <a href="/" className="text-title font-semibold">{t('common:brand.name')} · {t('me:overview.title')}</a>
          <HStack gap={3}>
            <ThemeMenu />
            <Button variant="ghost" size="sm" onClick={async () => { await auth.signOut(); navigate('/signin'); }}>{t('common:nav.signout')}</Button>
          </HStack>
        </HStack>
        <nav className="pb-3">
          <HStack gap={2}>
            {([
              ['overview', '/me', t('me:overview.title')],
              ['edit', '/me/edit', t('me:overview.edit')],
              ['settings', '/me/settings', t('me:overview.settings')],
              ['security', '/me/security', t('me:overview.security')],
              ['data', '/me/data', t('me:overview.data')],
            ] as const).map(([k, href, label]) => (
              <a key={k} href={href}>
                <Badge tone={active === k ? 'rose' : 'neutral'} variant={active === k ? 'solid' : 'soft'}>{label}</Badge>
              </a>
            ))}
          </HStack>
        </nav>
      </Container>
    </header>
  );
}

function useGuard(): { ready: boolean } {
  const { user, loading } = useAuth();
  useEffect(() => {
    if (!loading && !user) navigate('/signin');
  }, [loading, user]);
  return { ready: !loading && !!user };
}

export function MeOverviewPage(): JSX.Element {
  const { t } = useT(['me', 'common']);
  const { ready } = useGuard();
  const [data, setData] = useState<Awaited<ReturnType<typeof me.get>> | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    void me.get().then(setData).catch((e) => setErr(errMsg(e)));
  }, [ready]);

  return (
    <PageShell>
      <MeHeader active="overview" />
      <Container className="py-10">
        {err && <Alert tone="danger" title={t('common:states.error_generic')}>{err}</Alert>}
        {data && (
          <Card>
            <HStack gap={4}>
              <AvatarChip src={(data.profile.avatar_url as string) ?? undefined} name={(data.profile.display_name as string) ?? data.email ?? '?'} />
              <VStack gap={1}>
                <h2 className="text-h2">{(data.profile.display_name as string) ?? data.email ?? '—'}</h2>
                <div className="text-small text-text-secondary">@{(data.profile.username as string) ?? '—'} · {data.email}</div>
                <div className="text-body">{(data.profile.bio as string) ?? '—'}</div>
                <HStack gap={2}>
                  <Badge tone="sky">{t('common:nav.language')}: {(data.profile.locale as string) ?? 'en'}</Badge>
                  <Badge tone="amber">{t('me:overview.level_label')}: {String(data.profile.hsk_self_level ?? 0)}</Badge>
                  {data.profile.goal ? <Badge tone="rose">{t('me:edit.goal')}: {String(data.profile.goal)}</Badge> : null}
                </HStack>
              </VStack>
            </HStack>
          </Card>
        )}
      </Container>
    </PageShell>
  );
}

export function MeEditPage(): JSX.Element {
  // i18n-skip-start: deep form copy migrates in v2 alongside profile content model.
  const { ready } = useGuard();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [profile, setProfile] = useState<Record<string, unknown>>({});
  const [avatarBusy, setAvatarBusy] = useState(false);

  useEffect(() => {
    if (!ready) return;
    void me.get().then((d) => setProfile(d.profile));
  }, [ready]);

  const set = (k: string, v: unknown): void => setProfile((p) => ({ ...p, [k]: v }));

  return (
    <PageShell>
      <MeHeader active="edit" />
      <Container size="md" className="py-10">
        <Card>
          <CardHeader>
            <CardTitle>编辑资料</CardTitle>
            <CardDescription>用户名首次免费修改，30 天后再次修改将消耗 100 ZC。</CardDescription>
          </CardHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setErr(null);
              try {
                await me.patch({
                  display_name: profile.display_name,
                  username: profile.username,
                  bio: profile.bio ?? null,
                  hsk_self_level: Number(profile.hsk_self_level ?? 0),
                  goal: profile.goal ?? null,
                  locale: profile.locale,
                  avatar_url: profile.avatar_url ?? null,
                });
                toast.success('资料已保存');
              } catch (e2) {
                setErr(errMsg(e2));
              } finally {
                setBusy(false);
              }
            }}
          >
            <VStack gap={4}>
              {err && <Alert tone="danger" title="保存失败">{err}</Alert>}
              <HStack gap={4}>
                <AvatarChip src={(profile.avatar_url as string) ?? undefined} name={(profile.display_name as string) ?? '?'} />
                <VStack gap={2}>
                  <Label>头像（jpg/png/webp，≤2MB，自动转 webp 推荐）</Label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) {
                        setErr('图片需小于 2MB');
                        return;
                      }
                      setAvatarBusy(true);
                      try {
                        const sign = await me.signAvatar(file.name, (file.type as 'image/webp' | 'image/png' | 'image/jpeg') || 'image/webp');
                        if (!sign.fake) {
                          await fetch(sign.upload_url, { method: 'PUT', headers: { 'content-type': file.type }, body: file });
                        }
                        set('avatar_url', sign.public_url);
                        toast.success('头像已上传');
                      } catch (er) {
                        setErr(errMsg(er));
                      } finally {
                        setAvatarBusy(false);
                      }
                    }}
                  />
                  {avatarBusy && <div className="text-small text-text-secondary">上传中…</div>}
                </VStack>
              </HStack>
              <div>
                <Label htmlFor="dn">昵称</Label>
                <Input id="dn" value={(profile.display_name as string) ?? ''} onChange={(e) => set('display_name', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="un">用户名（3-20 位字母数字下划线）</Label>
                <Input id="un" value={(profile.username as string) ?? ''} onChange={(e) => set('username', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="bio">简介（≤200 字）</Label>
                <Textarea id="bio" rows={3} value={(profile.bio as string) ?? ''} onChange={(e) => set('bio', e.target.value)} />
              </div>
              <HStack gap={3}>
                <div className="flex-1">
                  <Label htmlFor="hsk">HSK 自评（0-9）</Label>
                  <Input id="hsk" type="number" min={0} max={9} value={Number(profile.hsk_self_level ?? 0)} onChange={(e) => set('hsk_self_level', Number(e.target.value))} />
                </div>
                <div className="flex-1">
                  <Label htmlFor="goal">目标</Label>
                  <select
                    id="goal"
                    className="h-10 w-full rounded-md border border-border-default bg-bg-elevated px-3 text-body"
                    value={(profile.goal as string) ?? ''}
                    onChange={(e) => set('goal', e.target.value || null)}
                  >
                    <option value="">未选择</option>
                    <option value="travel">旅行</option>
                    <option value="business">商务</option>
                    <option value="heritage">寻根</option>
                    <option value="exam">考试</option>
                    <option value="culture">文化</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div className="flex-1">
                  <Label htmlFor="lc">语言</Label>
                  <select
                    id="lc"
                    className="h-10 w-full rounded-md border border-border-default bg-bg-elevated px-3 text-body"
                    value={(profile.locale as string) ?? 'en'}
                    onChange={(e) => set('locale', e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="zh-CN">简体中文</option>
                    <option value="th">ไทย</option>
                    <option value="ar">العربية</option>
                    <option value="vi">Tiếng Việt</option>
                    <option value="id">Bahasa Indonesia</option>
                  </select>
                </div>
              </HStack>
              <Button type="submit" loading={busy}>保存</Button>
            </VStack>
          </form>
        </Card>
      </Container>
    </PageShell>
  );
}

export function MeSettingsPage(): JSX.Element {
  // i18n-skip-end
  // i18n-skip-start: deep form copy migrates in v2.
  const { ready } = useGuard();
  const [s, setS] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    void me.settingsGet().then(setS).catch((e) => setErr(errMsg(e)));
  }, [ready]);

  const set = (k: string, v: unknown): void => setS((prev) => ({ ...prev, [k]: v }));

  const save = async (patch: Record<string, unknown>): Promise<void> => {
    setBusy(true);
    setErr(null);
    try {
      await me.settingsPatch(patch);
      toast.success('设置已保存');
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell>
      <MeHeader active="settings" />
      <Container size="md" className="py-10">
        {err && <Alert tone="danger" title="出错">{err}</Alert>}
        <Card>
          <CardHeader>
            <CardTitle>外观与偏好</CardTitle>
          </CardHeader>
          <VStack gap={4}>
            <HStack className="justify-between">
              <Label>主题</Label>
              <select
                className="h-10 rounded-md border border-border-default bg-bg-elevated px-3 text-body"
                value={(s.theme as string) ?? 'system'}
                onChange={(e) => { set('theme', e.target.value); void save({ theme: e.target.value }); }}
              >
                <option value="light">亮色</option>
                <option value="dark">暗色</option>
                <option value="system">跟随系统</option>
              </select>
            </HStack>
            <HStack className="justify-between">
              <Label>界面语言</Label>
              <select
                className="h-10 rounded-md border border-border-default bg-bg-elevated px-3 text-body"
                value={(s.locale as string) ?? 'en'}
                onChange={(e) => { set('locale', e.target.value); void save({ locale: e.target.value }); }}
              >
                <option value="en">English</option>
                <option value="zh-CN">简体中文</option>
                <option value="th">ไทย</option>
                <option value="ar">العربية</option>
                <option value="vi">Tiếng Việt</option>
                <option value="id">Bahasa Indonesia</option>
              </select>
            </HStack>
            <HStack className="justify-between">
              <Label>开启站内推送</Label>
              <Switch checked={Boolean(s.push_enabled ?? true)} onCheckedChange={(v) => { set('push_enabled', v); void save({ push_enabled: v }); }} />
            </HStack>
            <HStack className="justify-between">
              <Label>接收营销邮件</Label>
              <Switch checked={Boolean(s.email_marketing_opt_in)} onCheckedChange={(v) => { set('email_marketing_opt_in', v); void save({ email_marketing_opt_in: v }); }} />
            </HStack>
            <HStack className="justify-between">
              <Label>降低动效（可访问性）</Label>
              <Switch checked={Boolean(s.a11y_reduced_motion)} onCheckedChange={(v) => { set('a11y_reduced_motion', v); void save({ a11y_reduced_motion: v }); }} />
            </HStack>
            <HStack className="justify-between">
              <Label htmlFor="dt">每日学习提醒（24h, HH:MM）</Label>
              <Input
                id="dt"
                style={{ width: 140 }}
                value={(s.daily_remind_at as string) ?? ''}
                placeholder="20:00"
                onBlur={(e) => { void save({ daily_remind_at: e.target.value || null }); }}
                onChange={(e) => set('daily_remind_at', e.target.value)}
              />
            </HStack>
            <HStack className="justify-between">
              <Label htmlFor="tts">TTS 声音</Label>
              <select
                id="tts"
                className="h-10 rounded-md border border-border-default bg-bg-elevated px-3 text-body"
                value={(s.tts_voice as string) ?? 'female-1'}
                onChange={(e) => { set('tts_voice', e.target.value); void save({ tts_voice: e.target.value }); }}
              >
                <option value="female-1">女声 1</option>
                <option value="female-2">女声 2</option>
                <option value="male-1">男声 1</option>
                <option value="male-2">男声 2</option>
              </select>
            </HStack>
            {busy && <div className="text-small text-text-secondary">保存中…</div>}
          </VStack>
        </Card>
      </Container>
    </PageShell>
  );
}

export function MeSecurityPage(): JSX.Element {
  // i18n-skip-end
  // i18n-skip-start: deep form copy migrates in v2.
  const { ready } = useGuard();
  const [sessions, setSessions] = useState<Awaited<ReturnType<typeof me.sessions>>['sessions']>([]);
  const [err, setErr] = useState<string | null>(null);

  const refresh = async (): Promise<void> => {
    try {
      const r = await me.sessions();
      setSessions(r.sessions);
    } catch (e) {
      setErr(errMsg(e));
    }
  };

  useEffect(() => { if (ready) void refresh(); }, [ready]);

  return (
    <PageShell>
      <MeHeader active="security" />
      <Container size="md" className="py-10">
        <Card>
          <CardHeader>
            <CardTitle>登录设备</CardTitle>
            <CardDescription>查看正在登录的设备，可一键登出。</CardDescription>
          </CardHeader>
          <VStack gap={3}>
            {err && <Alert tone="danger">{err}</Alert>}
            <Tabs defaultValue="list">
              <TabsList>
                <TabsTrigger value="list">设备列表</TabsTrigger>
                <TabsTrigger value="actions">批量操作</TabsTrigger>
              </TabsList>
              <TabsContent value="list">
                {sessions.length === 0 ? (
                  <div className="text-text-secondary">尚无可见会话</div>
                ) : (
                  <VStack gap={2}>
                    {sessions.map((s) => (
                      <HStack key={s.id} className="justify-between rounded-md border border-border-subtle p-3">
                        <VStack gap={0}>
                          <div className="text-body">{s.user_agent ?? 'unknown UA'}</div>
                          <div className="text-small text-text-secondary">IP {s.ip} · 最近 {new Date(s.last_seen_at).toLocaleString()}</div>
                        </VStack>
                        <HStack gap={2}>
                          {s.current && <Badge tone="sky">当前</Badge>}
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={async () => {
                              await me.revokeOne(s.id);
                              if (s.current) navigate('/signin');
                              else void refresh();
                            }}
                          >
                            登出此设备
                          </Button>
                        </HStack>
                      </HStack>
                    ))}
                  </VStack>
                )}
              </TabsContent>
              <TabsContent value="actions">
                <HStack gap={2}>
                  <Button
                    variant="danger"
                    onClick={async () => {
                      await me.revokeAll(true);
                      toast.success('已登出其它设备');
                      void refresh();
                    }}
                  >
                    登出所有其它设备
                  </Button>
                  <Button
                    variant="danger"
                    onClick={async () => {
                      await me.revokeAll(false);
                      navigate('/signin');
                    }}
                  >
                    登出所有设备（含当前）
                  </Button>
                </HStack>
              </TabsContent>
            </Tabs>
          </VStack>
        </Card>
      </Container>
    </PageShell>
  );
}

export function MeDataPage(): JSX.Element {
  // i18n-skip-end
  // i18n-skip-start: deep form copy migrates in v2.
  const { ready } = useGuard();
  const [exports, setExports] = useState<Awaited<ReturnType<typeof me.exportList>>['exports']>([]);
  const [pending, setPending] = useState<Awaited<ReturnType<typeof me.deleteStatus>> | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [pw, setPw] = useState('');

  const refresh = async (): Promise<void> => {
    try {
      const [list, status] = await Promise.all([me.exportList(), me.deleteStatus()]);
      setExports(list.exports);
      setPending(status);
    } catch (e) {
      setErr(errMsg(e));
    }
  };

  useEffect(() => { if (ready) void refresh(); }, [ready]);

  return (
    <PageShell>
      <MeHeader active="data" />
      <Container size="md" className="py-10">
        <VStack gap={6}>
          {err && <Alert tone="danger">{err}</Alert>}
          <Card>
            <CardHeader>
              <CardTitle>数据导出（GDPR）</CardTitle>
              <CardDescription>生成 JSON 包，包含资料 / 设置 / 设备记录。下载链接 24 小时有效。</CardDescription>
            </CardHeader>
            <VStack gap={3}>
              <Button
                onClick={async () => {
                  setBusy(true);
                  try {
                    await me.exportEnqueue();
                    toast.success('导出任务已入队');
                    setTimeout(() => void refresh(), 1500);
                  } catch (e) {
                    setErr(errMsg(e));
                  } finally {
                    setBusy(false);
                  }
                }}
                loading={busy}
              >
                生成新的导出
              </Button>
              {exports.length > 0 ? (
                <VStack gap={2}>
                  {exports.map((x) => (
                    <HStack key={x.id} className="justify-between rounded-md border border-border-subtle p-3">
                      <VStack gap={0}>
                        <div className="text-body">{x.id}</div>
                        <div className="text-small text-text-secondary">{x.status} · 创建 {new Date(x.created_at).toLocaleString()}</div>
                      </VStack>
                      {x.download_url && x.status === 'succeeded' ? (
                        <Button asChild variant="secondary" size="sm">
                          <a href={x.download_url} target="_blank" rel="noreferrer">下载</a>
                        </Button>
                      ) : (
                        <Badge tone={x.status === 'failed' ? 'danger' : 'amber'}>{x.status}</Badge>
                      )}
                    </HStack>
                  ))}
                </VStack>
              ) : (
                <div className="text-small text-text-secondary">尚无导出记录</div>
              )}
            </VStack>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>注销账号</CardTitle>
              <CardDescription>提交后立即冻结登录，30 天后物理删除。期间可在此页取消。</CardDescription>
            </CardHeader>
            <VStack gap={3}>
              {pending?.pending ? (
                <>
                  <Alert tone="warning" title="账号待删除">
                    将于 {pending.scheduled_for ? new Date(pending.scheduled_for).toLocaleString() : '—'} 执行
                  </Alert>
                  <Button onClick={async () => { await me.deleteCancel(); toast.success('已取消注销'); void refresh(); }}>取消注销</Button>
                </>
              ) : (
                <>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={confirmDel} onChange={(e) => setConfirmDel(e.target.checked)} />
                    <span>我已阅读并理解，注销将在 30 天后不可逆。</span>
                  </label>
                  <div>
                    <Label htmlFor="del-pw">输入密码以确认（OAuth 用户可留空）</Label>
                    <Input id="del-pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
                  </div>
                  <Button
                    variant="danger"
                    disabled={!confirmDel}
                    onClick={async () => {
                      try {
                        await me.deleteAccount(pw || undefined);
                        toast.success('注销已提交，30 天后生效');
                        navigate('/signin');
                      } catch (e) {
                        setErr(errMsg(e));
                      }
                    }}
                  >
                    确认注销
                  </Button>
                </>
              )}
            </VStack>
          </Card>
        </VStack>
      </Container>
    </PageShell>
  );
}

/** OAuth callback handler — extracts tokens from URL fragment, posts to BE, navigates home. */
export function AuthCallbackPage(): JSX.Element {
  // i18n-skip-end
  const [msg, setMsg] = useState('正在完成登录…');
  useEffect(() => {
    void (async () => {
      const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
      const params = new URLSearchParams(hash || window.location.search);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      const expires_in = Number(params.get('expires_in') ?? '3600');
      if (!access_token || !refresh_token) {
        setMsg('OAuth 回调缺少 token，请返回登录页重试');
        return;
      }
      try {
        const r = await fetch('/api/v1/auth/callback', {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ access_token, refresh_token, expires_in }),
        });
        if (r.ok) navigate('/me');
        else setMsg('回调处理失败');
      } catch (e) {
        setMsg(`错误：${(e as Error).message}`);
      }
    })();
  }, []);
  return (
    <PageShell>
      <Container className="py-16">
        <Card><div className="p-6">{msg}</div></Card>
      </Container>
    </PageShell>
  );
}
