/**
 * Interface for environment configuration objects
 */
export interface EnvironmentType {
  production: boolean;
  firestoreDbPort?: number;
  uploadFromCSVURL: string;
  getFirebaseConfig: () => Promise<{[key: string]: string}>;
}
