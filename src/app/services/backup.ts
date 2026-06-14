import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { appThemes, type AppTheme, type TrackingMode, type WeightIncrement, type WeightUnit } from '../contexts/SettingsContext';
import { DataService, setSessionUser, type LocalProfileBackupData } from './db';

const BACKUP_FORMAT = 'strive-local-backup';
const BACKUP_VERSION = 1;
const SETTINGS_STORAGE_KEY = 'striveSettings';
const WEB_SAFETY_BACKUP_KEY = 'strive_pre_import_backup_v1';
const MAX_BACKUP_BYTES = 25 * 1024 * 1024;

interface BackupSettings {
  weightUnit?: WeightUnit;
  weightIncrement?: WeightIncrement;
  trackingMode?: TrackingMode;
  autoStartTimer?: boolean;
  timerNotifications?: boolean;
  workoutReminders?: boolean;
  restTimers?: boolean;
  theme?: AppTheme;
}

export interface StriveBackupFile {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  appVersion: string;
  data: LocalProfileBackupData;
  settings: BackupSettings;
}

export interface BackupPreview {
  profileName: string;
  exportedAt: string;
  workoutCount: number;
  routineCount: number;
  fileName: string;
  backup: StriveBackupFile;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readSettings(): BackupSettings {
  if (typeof window === 'undefined') return {};

  try {
    return sanitizeSettings(JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}'));
  } catch {
    return {};
  }
}

function sanitizeSettings(value: unknown): BackupSettings {
  if (!isRecord(value)) return {};

  const validThemes = new Set(appThemes.map((theme) => theme.id));
  const settings: BackupSettings = {};

  if (value.weightUnit === 'kg' || value.weightUnit === 'lbs') settings.weightUnit = value.weightUnit;
  if (value.weightIncrement === 2.5 || value.weightIncrement === 5 || value.weightIncrement === 10) {
    settings.weightIncrement = value.weightIncrement;
  }
  if (value.trackingMode === 'rir' || value.trackingMode === 'rpe' || value.trackingMode === 'both') {
    settings.trackingMode = value.trackingMode;
  }
  if (typeof value.autoStartTimer === 'boolean') settings.autoStartTimer = value.autoStartTimer;
  if (typeof value.timerNotifications === 'boolean') settings.timerNotifications = value.timerNotifications;
  if (typeof value.workoutReminders === 'boolean') settings.workoutReminders = value.workoutReminders;
  if (typeof value.restTimers === 'boolean') settings.restTimers = value.restTimers;
  if (typeof value.theme === 'string' && validThemes.has(value.theme as AppTheme)) {
    settings.theme = value.theme as AppTheme;
  }

  return settings;
}

function formatFileDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function createFileName(date = new Date()) {
  return `strive-backup-${formatFileDate(date)}.json`;
}

function serializeBackup(backup: StriveBackupFile) {
  return JSON.stringify(backup, null, 2);
}

function downloadInBrowser(contents: string, fileName: string) {
  const blob = new Blob([contents], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function createStriveBackup(userId: string): StriveBackupFile {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: '1.0.0',
    data: DataService.createProfileBackup(userId),
    settings: readSettings(),
  };
}

export async function exportStriveBackup(userId: string) {
  const backup = createStriveBackup(userId);
  const contents = serializeBackup(backup);
  const fileName = createFileName(new Date(backup.exportedAt));

  if (Capacitor.isNativePlatform()) {
    const writtenFile = await Filesystem.writeFile({
      path: fileName,
      data: contents,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
      recursive: true,
    });

    await Share.share({
      title: 'Strive backup',
      text: 'Save this file somewhere safe. It can restore your Strive profile on another device.',
      files: [writtenFile.uri],
      dialogTitle: 'Save or share Strive backup',
    });
    return { fileName, method: 'shared' as const };
  }

  downloadInBrowser(contents, fileName);
  return { fileName, method: 'downloaded' as const };
}

export async function readStriveBackupFile(file: File): Promise<BackupPreview> {
  if (file.size > MAX_BACKUP_BYTES) {
    throw new Error('This backup is larger than 25 MB and cannot be imported.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error('This file is not valid JSON.');
  }

  if (!isRecord(parsed) || parsed.format !== BACKUP_FORMAT) {
    throw new Error('This is not a Strive backup file.');
  }
  if (parsed.version !== BACKUP_VERSION) {
    throw new Error(`This backup uses an unsupported format version (${String(parsed.version)}).`);
  }
  if (
    typeof parsed.exportedAt !== 'string' ||
    Number.isNaN(new Date(parsed.exportedAt).getTime()) ||
    !isRecord(parsed.data) ||
    !isRecord(parsed.data.profile) ||
    typeof parsed.data.profile.name !== 'string' ||
    !Array.isArray(parsed.data.workouts) ||
    !Array.isArray(parsed.data.routines)
  ) {
    throw new Error('This Strive backup is incomplete or damaged.');
  }

  const backup = {
    ...parsed,
    settings: sanitizeSettings(parsed.settings),
  } as unknown as StriveBackupFile;

  return {
    profileName: backup.data.profile.username || backup.data.profile.name,
    exportedAt: backup.exportedAt,
    workoutCount: backup.data.workouts.length,
    routineCount: backup.data.routines.length,
    fileName: file.name,
    backup,
  };
}

async function saveSafetyBackup(userId: string) {
  const contents = serializeBackup(createStriveBackup(userId));

  if (Capacitor.isNativePlatform()) {
    await Filesystem.writeFile({
      path: 'strive-pre-import-backup.json',
      data: contents,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
      recursive: true,
    });
    return;
  }

  window.localStorage.setItem(WEB_SAFETY_BACKUP_KEY, contents);
}

export async function importStriveBackup(backup: StriveBackupFile, currentUserId: string) {
  // Keep one automatic rollback snapshot before replacing the current local profile.
  await saveSafetyBackup(currentUserId);
  const restoredProfile = DataService.restoreProfileBackup(backup.data, currentUserId);

  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(sanitizeSettings(backup.settings)));
  setSessionUser(restoredProfile.id);
  return restoredProfile;
}
