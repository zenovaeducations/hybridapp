// Zenova Admin — Admin Core
// Authentication is intentionally not enforced yet.
// This file is prepared for the future Admin authentication system.

import { auth } from "./firebase/firebase-config.js";

/**
 * Future Admin authentication state.
 *
 * Later this file will handle:
 * - Admin sign-in
 * - Admin sign-out
 * - Admin session
 * - Admin authorization
 * - Admin custom claims / roles
 * - Access protection
 */

let currentAdmin = null;

/**
 * Get currently authenticated Firebase user.
 */
export function getCurrentAdmin() {
  return currentAdmin || auth.currentUser || null;
}

/**
 * Set the current admin internally.
 * Used later by the authentication layer.
 */
export function setCurrentAdmin(user) {
  currentAdmin = user || null;
}

/**
 * Clear current admin.
 */
export function clearCurrentAdmin() {
  currentAdmin = null;
}

/**
 * Future authorization gate.
 *
 * For now it allows access because Admin login
 * has intentionally not been implemented.
 *
 * When authentication is added, this function
 * becomes the central authorization checkpoint.
 */
export function requireAdmin() {
  return true;
}
