// @vitest-environment happy-dom
import { StrictMode } from 'react';
import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPanel } from '../../components/SettingsPanel';
import { createSettingsRepository } from '../../features/settings/repository';
import { SCHEMA_KEY, SETTINGS_KEYS } from '../../features/settings/schema';
import { MemoryStorage } from '../helpers/memory-storage';

afterEach(cleanup);

it('provides labeled controls, live persistence, keyboard reset confirmation, and cleanup', async () => {
  const storage = new MemoryStorage();
  const repository = createSettingsRepository(storage);
  const user = userEvent.setup();
  const view = render(
    <StrictMode>
      <SettingsPanel repository={repository} />
    </StrictMode>,
  );
  const master = screen.getByRole('checkbox', {
    name: 'Enable selected controls',
  });
  await waitFor(() =>
    expect(
      master.hasAttribute('disabled') || master.closest('fieldset')?.disabled,
    ).toBe(false),
  );
  await user.click(
    screen.getByRole('checkbox', { name: 'Hide Shorts discovery' }),
  );
  await waitFor(() =>
    expect(storage.data[SETTINGS_KEYS.hideShortsDiscovery]).toBe(true),
  );
  await user.click(master);
  await waitFor(() => expect(storage.data[SETTINGS_KEYS.enabled]).toBe(true));
  await user.click(screen.getByRole('button', { name: 'Reset preferences' }));
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'Cancel' }),
  );
  await user.keyboard('{Enter}');
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'Reset preferences' }),
  );
  expect(storage.data[SETTINGS_KEYS.enabled]).toBe(true);
  await user.click(screen.getByRole('button', { name: 'Reset preferences' }));
  await user.click(screen.getByRole('button', { name: 'Confirm reset' }));
  await waitFor(() => expect(storage.data).toEqual({}));
  await waitFor(() =>
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Reset preferences' }),
    ),
  );
  view.unmount();
  expect(storage.listeners.size).toBe(0);
});

it('shows an honest error instead of an optimistic saved checkbox', async () => {
  const storage = new MemoryStorage({ [SCHEMA_KEY]: 1 });
  const user = userEvent.setup();
  render(<SettingsPanel repository={createSettingsRepository(storage)} />);
  await waitFor(() =>
    expect(screen.getByRole('status').textContent).not.toMatch(/Loading/),
  );
  storage.set.mockRejectedValueOnce(new Error('quota'));
  await user.click(
    screen.getByRole('checkbox', { name: 'Enable selected controls' }),
  );
  expect((await screen.findByRole('alert')).textContent).toMatch(
    /Could not complete/,
  );
  expect(
    (
      screen.getByRole('checkbox', {
        name: 'Enable selected controls',
      }) as HTMLInputElement
    ).checked,
  ).toBe(false);
  expect(screen.getByRole('status').textContent).not.toMatch(/Saved in/);
});

it('disables edits for unsupported data but permits explicit reset', async () => {
  const storage = new MemoryStorage({ [SCHEMA_KEY]: 99 });
  render(<SettingsPanel repository={createSettingsRepository(storage)} />);
  await screen.findByRole('alert');
  expect(screen.getByRole('status').textContent).toMatch(/paused/);
  expect(
    screen
      .getByRole('checkbox', { name: 'Enable selected controls' })
      .closest('fieldset')?.disabled,
  ).toBe(true);
  expect(
    (
      screen.getByRole('button', {
        name: 'Reset preferences',
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(false);
  expect(storage.set).not.toHaveBeenCalled();
});
