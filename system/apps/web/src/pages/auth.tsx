import { useEffect, useState } from 'react';
import {
  Alert,
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
  VStack,
  toast,
} from '@zhiyu/ui';
import { useT } from '@zhiyu/i18n/client';
import { auth } from '../lib/api.js';
import { navigate } from '../lib/auth-store.js';

const errMsg = (e: unknown): string => {
  const err = e as { message?: string; body?: { error?: string } } | undefined;
  return err?.body?.error ?? err?.message ?? 'unknown_error';
};

export function SignUpPage(): JSX.Element {
  const { t } = useT(['auth', 'common']);
  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [email, setEmail] = useState('');
  const [challenge, setChallenge] = useState<{ id: string; devCode?: string } | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <PageShell>
      <Container size="sm" className="py-16">
        <Card>
          <CardHeader>
            <CardTitle>{t('auth:signup.title')}</CardTitle>
            <CardDescription>{t('auth:signup.subtitle')}</CardDescription>
          </CardHeader>
          <VStack gap={4}>
            {error && <Alert tone="danger" title={t('common:states.error_generic')}>{error}</Alert>}
            {step === 'email' && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  setError(null);
                  try {
                    const r = await auth.signUp(email);
                    setChallenge({ id: r.challenge_id, devCode: r.dev_code });
                    setStep('verify');
                    toast.success(t('auth:signup.otp_sent', { email }), { description: r.dev_code ? `dev: ${r.dev_code}` : '' });
                  } catch (e2) {
                    setError(errMsg(e2));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <VStack gap={3}>
                  <div>
                    <Label htmlFor="su-email">{t('auth:signup.email_label')}</Label>
                    <Input id="su-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                  </div>
                  <Button type="submit" loading={busy}>{t('auth:signup.send_otp')}</Button>
                </VStack>
              </form>
            )}
            {step === 'verify' && challenge && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  setError(null);
                  try {
                    await auth.verifyOtp({
                      challenge_id: challenge.id,
                      code,
                      password: password || undefined,
                      display_name: displayName || undefined,
                    });
                    toast.success(t('auth:signup.title'));
                    navigate('/me');
                  } catch (e2) {
                    setError(errMsg(e2));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <VStack gap={3}>
                  {challenge.devCode && (
                    <Alert tone="info" title={t('auth:signup.otp_label')}>
                      <code>{challenge.devCode}</code>
                    </Alert>
                  )}
                  <div>
                    <Label htmlFor="su-code">{t('auth:signup.otp_label')}</Label>
                    <Input id="su-code" inputMode="numeric" pattern="\\d{6}" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
                  </div>
                  <div>
                    <Label htmlFor="su-name">{t('me:edit.display_name')}</Label>
                    <Input id="su-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="su-pass">{t('auth:signin.password_label')}</Label>
                    <Input id="su-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('auth:signin.password_hint')} />
                  </div>
                  <HStack gap={2}>
                    <Button type="submit" loading={busy}>{t('auth:signup.submit')}</Button>
                    <Button type="button" variant="ghost" onClick={() => setStep('email')}>{t('common:actions.back')}</Button>
                  </HStack>
                </VStack>
              </form>
            )}
            <div className="text-small text-text-secondary">
              {t('auth:signup.have_account')} <a href="/signin" className="ms-1 underline">{t('auth:signup.go_signin')}</a>
            </div>
          </VStack>
        </Card>
      </Container>
    </PageShell>
  );
}

export function SignInPage(): JSX.Element {
  const { t } = useT(['auth', 'common']);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<{ google: boolean; apple: boolean } | null>(null);

  useEffect(() => {
    void auth.providers().then((r) => setProviders(r.providers)).catch(() => setProviders({ google: false, apple: false }));
  }, []);

  return (
    <PageShell>
      <Container size="sm" className="py-16">
        <Card>
          <CardHeader>
            <CardTitle>{t('auth:signin.title')}</CardTitle>
            <CardDescription>{t('auth:signin.subtitle')}</CardDescription>
          </CardHeader>
          <VStack gap={4}>
            {error && <Alert tone="danger" title={t('common:states.error_generic')}>{error}</Alert>}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setError(null);
                try {
                  await auth.signIn(email, password);
                  toast.success(t('auth:signin.title'));
                  navigate('/me');
                } catch (e2) {
                  setError(errMsg(e2));
                } finally {
                  setBusy(false);
                }
              }}
            >
              <VStack gap={3}>
                <div>
                  <Label htmlFor="si-email">{t('auth:signin.email_label')}</Label>
                  <Input id="si-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="si-pass">{t('auth:signin.password_label')}</Label>
                  <Input id="si-pass" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <HStack gap={2} className="justify-between">
                  <Button type="submit" loading={busy}>{t('auth:signin.submit')}</Button>
                  <a href="/reset-password" className="text-small underline text-text-secondary">{t('auth:signin.forgot')}</a>
                </HStack>
              </VStack>
            </form>
            {providers && (providers.google || providers.apple) && (
              <VStack gap={2}>
                <div className="text-small text-text-secondary">{t('auth:signin.or_provider')}</div>
                {providers.google && (
                  <Button variant="secondary" asChild>
                    <a href="/api/v1/auth/oauth/google">{t('auth:signin.provider_google')}</a>
                  </Button>
                )}
                {providers.apple && (
                  <Button variant="secondary" asChild>
                    <a href="/api/v1/auth/oauth/apple">{t('auth:signin.provider_apple')}</a>
                  </Button>
                )}
              </VStack>
            )}
            <div className="text-small text-text-secondary">
              {t('auth:signin.no_account')} <a href="/signup" className="ms-1 underline">{t('auth:signin.go_signup')}</a>
            </div>
          </VStack>
        </Card>
      </Container>
    </PageShell>
  );
}

export function ResetPasswordPage(): JSX.Element {
  const { t } = useT(['auth', 'common']);
  const [step, setStep] = useState<'email' | 'confirm'>('email');
  const [email, setEmail] = useState('');
  const [challenge, setChallenge] = useState<{ id: string; devCode?: string } | null>(null);
  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <PageShell>
      <Container size="sm" className="py-16">
        <Card>
          <CardHeader>
            <CardTitle>{t('auth:reset.title')}</CardTitle>
            <CardDescription>{t('auth:reset.subtitle')}</CardDescription>
          </CardHeader>
          <VStack gap={4}>
            {error && <Alert tone="danger" title={t('common:states.error_generic')}>{error}</Alert>}
            {step === 'email' ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  setError(null);
                  try {
                    const r = await auth.resetRequest(email);
                    setChallenge({ id: r.challenge_id, devCode: r.dev_code });
                    setStep('confirm');
                  } catch (e2) {
                    setError(errMsg(e2));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <VStack gap={3}>
                  <div>
                    <Label htmlFor="rp-email">{t('auth:reset.email_label')}</Label>
                    <Input id="rp-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <Button type="submit" loading={busy}>{t('auth:reset.submit_email')}</Button>
                </VStack>
              </form>
            ) : (
              challenge && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setBusy(true);
                    setError(null);
                    try {
                      await auth.resetConfirm({ challenge_id: challenge.id, code, new_password: pw });
                      toast.success(t('auth:reset.success'));
                      navigate('/signin');
                    } catch (e2) {
                      setError(errMsg(e2));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <VStack gap={3}>
                    {challenge.devCode && <Alert tone="info" title={t('auth:reset.otp_label')}><code>{challenge.devCode}</code></Alert>}
                    <div>
                      <Label htmlFor="rp-code">{t('auth:reset.otp_label')}</Label>
                      <Input id="rp-code" inputMode="numeric" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
                    </div>
                    <div>
                      <Label htmlFor="rp-pw">{t('auth:reset.new_password_label')}</Label>
                      <Input id="rp-pw" type="password" required value={pw} onChange={(e) => setPw(e.target.value)} placeholder={t('auth:signin.password_hint')} />
                    </div>
                    <Button type="submit" loading={busy}>{t('auth:reset.submit')}</Button>
                  </VStack>
                </form>
              )
            )}
          </VStack>
        </Card>
      </Container>
    </PageShell>
  );
}
