/**
 * Admin credential for interview-qa.
 *
 * IMPORTANT: this is FRONT-END-ONLY protection. The file is compiled into the
 * JavaScript bundle, so anyone who reads the bundle can see the username and
 * password. That is acceptable for a personal site because the admin area can only
 * change a local draft (stored in this browser) and cannot modify the deployed
 * questions.json. Do NOT reuse a password you use anywhere else.
 *
 * Change both values below, then rebuild and redeploy.
 */
export const DEFAULT_ADMIN_PASSWORD = 'change-me-now';

export const ADMIN_CONFIG = {
  username: 'admin',
  password: DEFAULT_ADMIN_PASSWORD,
} as const;
