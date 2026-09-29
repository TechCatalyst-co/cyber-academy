// Account: profile summary and password change.
import { post } from '../api.js';
import { esc, fmt, toast, pageHead, passwordInput } from '../ui.js';
import { state } from '../app.js';

export async function view() {
  const u = state.user;
  const html = `<div class="page">
    ${pageHead({ title: esc(u.name), meta: ['Account', esc(u.email), esc(fmt.role(u.role)), esc(state.tenant?.name || 'TechCatalyst')] })}
    <form class="card stack" style="max-width:520px" data-form novalidate>
      <div class="card-head" style="margin:0"><h2>Change password</h2></div>
      ${u.must_change_password ? '<div class="notice">You are using a temporary password. Choose your own now.</div>' : ''}
      <div class="field"><label for="cur">Current password</label>${passwordInput('id="cur" name="current" autocomplete="current-password" required')}</div>
      <div class="field"><label for="nw">New password</label>${passwordInput('id="nw" name="next" autocomplete="new-password" minlength="10" required')}<span class="hint">At least 10 characters. A passphrase of three or four random words works well.</span></div>
      <p class="error" data-err hidden></p>
      <div><button class="btn btn-primary" type="submit">Update password</button></div>
    </form>
  </div>`;
  return {
    title: 'Account', html,
    mount(root) {
      const f = root.querySelector('[data-form]');
      f.addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = f.querySelector('[data-err]'); err.hidden = true;
        try {
          await post('/api/auth/password', { current: f.current.value, next: f.next.value });
          state.user.must_change_password = 0;
          f.reset(); toast('Password updated');
        } catch (ex) { err.textContent = ex.message; err.hidden = false; }
      });
    },
  };
}
