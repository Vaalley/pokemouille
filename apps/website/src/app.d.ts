declare global {
  namespace App {
    interface Locals {
      /** Revision-relative dataset files the prerendered document should preload. */
      dataPreloads?: string[];
    }
  }
  interface ImportMetaEnv {
    /** Dataset revision the site was built from; absent when no dataset was published. */
    readonly DATASET_REVISION?: string;
  }
}

export {};
