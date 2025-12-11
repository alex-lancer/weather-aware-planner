import React from 'react';
import { Form, Link, useActionData, useNavigation, useSearchParams } from 'react-router-dom';
import BaseInput from '../commonComponents/BaseInput';
import BaseButton from '../commonComponents/BaseButton';

export default function Login() {
  const nav = useNavigation();
  const isSubmitting = nav.state === 'submitting' || nav.state === 'loading';
  const actionData = useActionData() as { error?: string } | undefined;
  const [params] = useSearchParams();
  const from = params.get('from') || '/';

  return (
    <div className="p-4 max-w-sm mx-auto">
      <h2 className="text-lg font-semibold mb-4">Sign in</h2>
      {actionData?.error && (
        <div className="mb-3 text-sm text-red-600">{actionData.error}</div>
      )}
      <Form method="post" action={`/login?from=${encodeURIComponent(from)}`} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="username">Username</label>
          <BaseInput id="username" name="username" autoComplete="username" required placeholder="e.g. manager1" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
          <BaseInput id="password" name="password" type="password" autoComplete="current-password" required placeholder="pass123" />
        </div>
        <BaseButton type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </BaseButton>
      </Form>
      <p className="mt-3 text-xs text-gray-600">Demo users: manager1/2/3, dispatcher1/2/3, technician1/2/3. Password: pass123</p>
      <p className="mt-3 text-xs"><Link className="text-blue-700 hover:underline" to="/">Back to planner</Link></p>
    </div>
  );
}
