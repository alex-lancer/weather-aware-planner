import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from 'react-router-dom';
import { authRepository } from 'repositories/instances';

export async function loginAction({ request }: ActionFunctionArgs) {
  const url = new URL(request.url);
  const from = url.searchParams.get('from') || '/';
  const fd = await request.formData();
  const username = String(fd.get('username') || '').trim();
  const password = String(fd.get('password') || '').trim();

  authRepository.login({ username, password });

  const user = authRepository.getCurrentUser();

  if (!user) {
    return { error: 'Invalid username or password' };
  }

  return redirect(from);
}

export async function logoutAction() {
  authRepository.logout();
  return redirect('/');
}

export async function requireAuthLoader({ request }: LoaderFunctionArgs) {
  const user = authRepository.getCurrentUser();

  if (!user) {
    const url = new URL(request.url);
    const to = url.pathname + (url.search || '');

    return redirect(`/login?from=${encodeURIComponent(to)}`);
  }

  return null;
}
